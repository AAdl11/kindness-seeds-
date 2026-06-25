"""
Content agent — drafts a candidate level with Gemini, reading data/ through MCP.

Flow (one complete pass):
  1. Connect to the Miya content MCP server (stdio) and call its tools:
       get_community_context() · get_safety_rules() · read_level_data("level1")
     So data/ is read *through MCP*, never by reaching into files directly.
  2. Build a prompt (community tone + safety boundaries + an existing level as a
     style reference + the scenario brief) and ask Gemini for a level JSON that
     matches the §3.5 schema, fully trilingual (EN/ZH/ES).
  3. Validate the shape locally.
  4. Write it via the MCP tool save_candidate() — which can only write to
     pipeline/out/, never data/.

Iron rules honored:
  * The key is read from .env (python-dotenv). No key appears in this file.
  * The candidate is NOT marked human-reviewed. safety_meta.reviewed_by stays
    "pending"; only the human review gate (a later step) sets it to "human" on
    approve. Nothing here writes to data/.

Run:
    python agents/content_agent.py --need "Two food packages left, two people need them"
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import pathlib
import sys

# --- paths -----------------------------------------------------------------
PIPELINE = pathlib.Path(__file__).resolve().parents[1]
SERVER = PIPELINE / "mcp_server" / "server.py"

DEFAULT_NEED = "Two food packages left, two people need them"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# The §3.5 target shape, shown to the model and checked locally.
SCHEMA_HINT = {
    "id": "the_last_two",
    "type": "moral_dilemma",
    "title": {"en": "", "zh": "", "es": ""},
    "scene": {"en": "", "zh": "", "es": ""},
    "choices": [
        {"label": {"en": "", "zh": "", "es": ""},
         "consequence": {"en": "", "zh": "", "es": ""}}
    ],
    "third_path": {
        "success": {"en": "", "zh": "", "es": ""},
        "fail": {"en": "", "zh": "", "es": ""},
    },
    "ending_question": {"en": "", "zh": "", "es": ""},
    "safety_meta": {"reviewed_by": "pending", "no_score": True},
}

# The scenario brief — the §7 "The Last Two" worked example is the structural
# and quality bar. The human reviewer's hand-written trilingual version is the
# gold standard the draft aims toward.
SCENARIO_BRIEF = """\
Scene: a teen volunteer at a community mutual-aid station. Two fresh food
packages are left, and two needs arrive at once:
  A — a young mother with two children, first in line, who has waited a long
      time. By "first come, first served," the two packages are hers.
  B — Mr. Wang, a homebound elder who usually comes at this hour but hasn't
      arrived; the player knows from before that he moves slowly. If the
      packages go now, he goes without today.
The tension: predictable, rule-based fairness vs. a flexible response to
individual need. Both deserve help; the resources fit only one.
- Exactly two costed options, neither scored nor labeled good/bad:
    (1) give by the rule, (2) hold one back for Mr. Wang. Each has an honest,
    humane consequence — no villain, no shaming.
- A third path: mutual aid, with a cost and a real chance of failure — the
  player speaks up and coordinates on the spot (ask the mother to share, or
  rally others). success = more people each receive something; fail = a polite
  refusal, and life goes on without blame.
- An open ending question with no correct answer collected, e.g.
  "In what you saw today, what is fair?"
"""


# --- MCP plumbing ----------------------------------------------------------
def _tool_value(result):
    """Extract a plain Python value from an MCP CallToolResult."""
    sc = getattr(result, "structuredContent", None)
    if sc is not None:
        # FastMCP wraps a non-dict return under {"result": ...}
        if isinstance(sc, dict) and set(sc.keys()) == {"result"}:
            return sc["result"]
        return sc
    parts = []
    for c in getattr(result, "content", []) or []:
        t = getattr(c, "text", None)
        if t:
            parts.append(t)
    text = "\n".join(parts).strip()
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        return text


# --- schema validation -----------------------------------------------------
LANGS = ("en", "zh", "es")


def _is_trilingual(obj) -> bool:
    return isinstance(obj, dict) and all(obj.get(l, "").strip() for l in LANGS)


def validate_candidate(obj: dict) -> list[str]:
    """Return a list of problems; empty list means the shape is valid."""
    problems: list[str] = []
    if not isinstance(obj, dict):
        return ["candidate is not a JSON object"]
    if obj.get("type") != "moral_dilemma":
        problems.append("type must be 'moral_dilemma'")
    if not _safe_id(obj.get("id")):
        problems.append("id missing or unsafe")
    for key in ("title", "scene", "ending_question"):
        if not _is_trilingual(obj.get(key)):
            problems.append(f"{key} must have non-empty en/zh/es")
    choices = obj.get("choices")
    if not isinstance(choices, list) or len(choices) < 2:
        problems.append("choices must be a list of at least 2")
    else:
        for i, c in enumerate(choices):
            if not _is_trilingual((c or {}).get("label")):
                problems.append(f"choices[{i}].label not trilingual")
            if not _is_trilingual((c or {}).get("consequence")):
                problems.append(f"choices[{i}].consequence not trilingual")
    tp = obj.get("third_path") or {}
    if not _is_trilingual(tp.get("success")) or not _is_trilingual(tp.get("fail")):
        problems.append("third_path.success / third_path.fail must be trilingual")
    sm = obj.get("safety_meta") or {}
    if sm.get("no_score") is not True:
        problems.append("safety_meta.no_score must be true")
    return problems


def _safe_id(v) -> bool:
    return isinstance(v, str) and bool(v.strip()) and all(ch.isalnum() or ch in "_-" for ch in v)


# --- prompt ----------------------------------------------------------------
def build_prompt(need: str, community: dict, rules: list, style_ref: str) -> str:
    return f"""You are the Content agent for "Miya · Seeds of Kindness", a gentle,
trilingual community game. Draft ONE level as strict JSON.

COMMUNITY CONTEXT (hold this tone exactly):
{json.dumps(community, ensure_ascii=False, indent=2)}

FIRM CONTENT BOUNDARIES (every one must hold):
{json.dumps(rules, ensure_ascii=False, indent=2)}

STYLE REFERENCE — an existing level module (match its trilingual shape and its
"show the home, not the people being helped" framing; do NOT copy its content):
---
{style_ref[:6000]}
---

THE NEED:
{need}

SCENARIO TO REALIZE:
{SCENARIO_BRIEF}

OUTPUT RULES:
- Return ONLY a single JSON object, no markdown, no commentary.
- Match exactly this schema (same keys); every text field present in en, zh, es:
{json.dumps(SCHEMA_HINT, ensure_ascii=False, indent=2)}
- id = "the_last_two", type = "moral_dilemma".
- Exactly two entries in choices; each an honest, humane consequence; never
  label a choice right/wrong; no score, no winner.
- third_path has both success and fail.
- ending_question is open; collect no answer; offer no correct answer.
- Voice: gratitude, respect, gentleness; like water; never preaching.
- Keep safety_meta = {{"reviewed_by": "pending", "no_score": true}}.
- Write for teens 14-16: weight over decoration, agency over cuteness.
"""


# --- main flow -------------------------------------------------------------
async def generate_candidate(need: str) -> dict:
    from dotenv import load_dotenv
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    load_dotenv(PIPELINE / ".env")
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit(
            "GEMINI_API_KEY is not set. Copy pipeline/.env.example to pipeline/.env "
            "and add your key."
        )

    params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tool_names = [t.name for t in (await session.list_tools()).tools]
            print(f"[mcp] connected — tools: {', '.join(tool_names)}")

            community = _tool_value(await session.call_tool("get_community_context", {}))
            rules = _tool_value(await session.call_tool("get_safety_rules", {}))
            levels = _tool_value(await session.call_tool("list_levels", {}))
            ref_id = "level1" if "level1" in (levels or []) else (levels or ["level1"])[0]
            style = _tool_value(await session.call_tool("read_level_data", {"level_id": ref_id}))
            style_ref = style.get("source", "") if isinstance(style, dict) else str(style)
            print(f"[mcp] read context + style reference from '{ref_id}'")

            # --- Gemini generation ---
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = build_prompt(need, community, rules, style_ref)
            print(f"[gemini] generating with {GEMINI_MODEL} ...")
            resp = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json", "temperature": 0.7},
            )
            raw = (resp.text or "").strip()
            try:
                candidate = json.loads(raw)
            except ValueError as e:
                raise SystemExit(f"Gemini did not return valid JSON: {e}\n--- raw ---\n{raw[:2000]}")

            problems = validate_candidate(candidate)
            if problems:
                print("[validate] candidate has issues:")
                for p in problems:
                    print("   -", p)
                print("[validate] saving anyway so the human reviewer can see it; "
                      "the safety agent + gate are the real checks.")
            else:
                print("[validate] shape OK (trilingual, two choices, third path, open ending)")

            # --- write via MCP (out/ only) ---
            saved = _tool_value(await session.call_tool("save_candidate", {"level_json": candidate}))
            print(f"[mcp] save_candidate -> {saved}")
            return {"path": saved, "candidate": candidate, "problems": problems}


def main() -> None:
    ap = argparse.ArgumentParser(description="Draft a candidate level via MCP + Gemini.")
    ap.add_argument("--need", default=DEFAULT_NEED, help="one-line community need")
    args = ap.parse_args()
    result = asyncio.run(generate_candidate(args.need))
    title = (result["candidate"].get("title") or {}).get("en", "(untitled)")
    print(f"\nDrafted: {title}")
    print(f"Saved candidate at: {result['path']}")
    print("Next: the Safety agent reviews it, then the human gate decides "
          "approve / edit / reject. Nothing reaches data/ until you approve.")


if __name__ == "__main__":
    main()
