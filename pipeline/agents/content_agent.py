"""
Content agent — drafts a candidate level with Gemini from a planner strategy,
reading data/ through MCP.

It no longer hard-codes a scenario. The Strategy Planner (Layer 0) turns a
scenario id into a strategy (goal + non-negotiable constraints + scenario brief
+ community + safety rules); this agent realizes that strategy as a level JSON,
using the content_branch_design skill as its system instruction.

Flow:
  1. Strategy Planner builds the strategy for the chosen scenario.
  2. Load the content_branch_design skill (system instruction).
  3. Through MCP, read an existing level as a style reference.
  4. Ask Gemini for a level JSON that matches the schema, fully trilingual.
  5. Validate the shape; force id = scenario id.
  6. Write it via the MCP tool save_candidate() — out/ only, never data/.

Iron rules: key from .env (no key in this file); candidate stays
reviewed_by:"pending" until the human gate; nothing here writes to data/.

Run:
    python agents/content_agent.py --scenario the_last_two
    python agents/content_agent.py --scenario summer_seed_camp
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import pathlib
import sys

PIPELINE = pathlib.Path(__file__).resolve().parents[1]
SERVER = PIPELINE / "mcp_server" / "server.py"
SKILL_PATH = PIPELINE / "skills" / "content_branch_design" / "SKILL.md"
# put pipeline/ on the path so we can import the planner as a namespace package
sys.path.insert(0, str(PIPELINE))

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


# --- MCP plumbing ----------------------------------------------------------
def _tool_value(result):
    """Extract a plain Python value from an MCP CallToolResult."""
    sc = getattr(result, "structuredContent", None)
    if sc is not None:
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


def _safe_id(v) -> bool:
    return isinstance(v, str) and bool(v.strip()) and all(ch.isalnum() or ch in "_-" for ch in v)


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


# --- prompt ----------------------------------------------------------------
# The design rules, voice, and output schema live in the content_branch_design
# skill (loaded as the system instruction). This prompt supplies only the
# strategy and materials for this particular level.
def build_prompt(strategy: dict, style_ref: str) -> str:
    return f"""Draft one Miya level, following your skill exactly.

LEVEL ID: {strategy['scenario_id']}
AGE BAND: {strategy['age_band']}

GLOBAL GOAL (the strategy for this level):
{strategy['global_goal']}

NON-NEGOTIABLE CONSTRAINTS:
{json.dumps(strategy['constraints'], ensure_ascii=False, indent=2)}

COMMUNITY CONTEXT (hold this tone):
{json.dumps(strategy['community'], ensure_ascii=False, indent=2)}

FIRM CONTENT BOUNDARIES (every one must hold):
{json.dumps(strategy['safety_rules'], ensure_ascii=False, indent=2)}

STYLE REFERENCE — an existing level module (match its trilingual shape and its
"show the home, not the people being helped" framing; do NOT copy its content):
---
{style_ref[:6000]}
---

SCENARIO TO REALIZE:
{strategy['scenario_brief']}

Use id = "{strategy['scenario_id']}" and write for the age band above.
Return ONLY the level JSON object described in your skill."""


# --- main flow -------------------------------------------------------------
async def generate_candidate(strategy: dict) -> dict:
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

    scenario_id = strategy["scenario_id"]
    skill_md = SKILL_PATH.read_text(encoding="utf-8")
    print(f"[skill] loaded content_branch_design ({len(skill_md)} chars)")

    params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tool_names = [t.name for t in (await session.list_tools()).tools]
            print(f"[mcp] connected — tools: {', '.join(tool_names)}")

            levels = _tool_value(await session.call_tool("list_levels", {}))
            ref_id = "level1" if "level1" in (levels or []) else (levels or ["level1"])[0]
            style = _tool_value(await session.call_tool("read_level_data", {"level_id": ref_id}))
            style_ref = style.get("source", "") if isinstance(style, dict) else str(style)
            print(f"[mcp] read style reference from '{ref_id}'")

            # --- Gemini generation (skill as system instruction) ---
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = build_prompt(strategy, style_ref)
            print(f"[gemini] generating '{scenario_id}' with {GEMINI_MODEL} ...")
            resp = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "system_instruction": skill_md,
                    "response_mime_type": "application/json",
                    "temperature": 0.7,
                },
            )
            raw = (resp.text or "").strip()
            try:
                candidate = json.loads(raw)
            except ValueError as e:
                raise SystemExit(f"Gemini did not return valid JSON: {e}\n--- raw ---\n{raw[:2000]}")

            # force id from the scenario; never trust the model for the filename
            candidate["id"] = scenario_id
            candidate.setdefault("safety_meta", {"reviewed_by": "pending", "no_score": True})

            problems = validate_candidate(candidate)
            if problems:
                print("[validate] candidate has issues:")
                for p in problems:
                    print("   -", p)
                print("[validate] saving anyway so the human reviewer can see it; "
                      "the safety agent + gate are the real checks.")
            else:
                print("[validate] shape OK (trilingual, two choices, third path, open ending)")

            saved = _tool_value(await session.call_tool("save_candidate", {"level_json": candidate}))
            print(f"[mcp] save_candidate -> {saved}")
            return {"path": saved, "candidate": candidate, "problems": problems}


def main() -> None:
    ap = argparse.ArgumentParser(description="Draft a candidate level via planner + MCP + Gemini.")
    ap.add_argument("--scenario", default="the_last_two", help="scenario id in pipeline/scenarios/")
    args = ap.parse_args()

    from agents.strategy_planner import build_strategy

    async def _run():
        strategy = await build_strategy(args.scenario)
        return await generate_candidate(strategy)

    result = asyncio.run(_run())
    title = (result["candidate"].get("title") or {}).get("en", "(untitled)")
    print(f"\nDrafted: {title}")
    print(f"Saved candidate at: {result['path']}")
    print("Next: the Safety agent reviews it, then the human gate decides "
          "approve / edit / reject. Nothing reaches data/ until you approve.")


if __name__ == "__main__":
    main()
