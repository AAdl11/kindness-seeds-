"""
Safety agent — reviews a candidate level against the firm content boundaries.

Flow:
  1. Load the `safety_review` Agent Skill (pipeline/skills/safety_review/SKILL.md)
     and use it as the model's system instruction. This is a real use of the
     skill, not decoration.
  2. Fetch the boundaries at runtime via the MCP tool get_safety_rules() — the
     agent checks against those, it does not invent its own list.
  3. Read the candidate from pipeline/out/<id>.json and review it rule by rule
     with Gemini.
  4. Write a report to pipeline/out/<id>.safety.json:
       {pass, findings, suggested_fixes, checked_rules}

Iron rules honored:
  * Flag-and-suggest only — this agent NEVER edits the candidate. The human
    review gate decides what to do.
  * `pass` is recomputed locally from the findings (a "block" finding => not
    pass), so a model slip cannot wave something through.
  * Key from .env; no key in this file.

Run:
    python agents/safety_agent.py --id the_last_two
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
SKILL_PATH = PIPELINE / "skills" / "safety_review" / "SKILL.md"
OUT_DIR = PIPELINE / "out"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


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


def _normalize_report(report: dict, rules: list) -> dict:
    """Coerce the model's report into the agreed shape and recompute `pass`."""
    findings = report.get("findings") or []
    if not isinstance(findings, list):
        findings = []
    fixes = report.get("suggested_fixes") or []
    if not isinstance(fixes, list):
        fixes = []
    checked = report.get("checked_rules") or [r.get("id") for r in rules if isinstance(r, dict)]
    # pass is OUR decision, not the model's: any block finding => fail
    blocked = any((f or {}).get("severity") == "block" for f in findings)
    return {
        "pass": not blocked,
        "findings": findings,
        "suggested_fixes": fixes,
        "checked_rules": checked,
    }


def build_prompt(rules: list, candidate: dict) -> str:
    return f"""Review this candidate level, rule by rule, following your skill.

FIRM CONTENT BOUNDARIES (check against exactly these; use their ids):
{json.dumps(rules, ensure_ascii=False, indent=2)}

CANDIDATE LEVEL JSON:
{json.dumps(candidate, ensure_ascii=False, indent=2)}

Return ONLY the report JSON object described in your skill
(keys: pass, findings, suggested_fixes, checked_rules). Do not edit the candidate.
"""


async def review_candidate(level_id: str) -> dict:
    from dotenv import load_dotenv
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    load_dotenv(PIPELINE / ".env")
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is not set. See pipeline/.env.example.")

    cand_path = OUT_DIR / f"{level_id}.json"
    if not cand_path.is_file():
        raise SystemExit(f"No candidate at {cand_path}. Run the Content agent first.")
    candidate = json.loads(cand_path.read_text(encoding="utf-8"))

    # 1) load the skill (really)
    skill_md = SKILL_PATH.read_text(encoding="utf-8")
    print(f"[skill] loaded safety_review ({len(skill_md)} chars)")

    # 2) rules via MCP
    params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            rules = _tool_value(await session.call_tool("get_safety_rules", {}))
            ids = [r.get("id") for r in rules if isinstance(r, dict)]
            print(f"[mcp] get_safety_rules -> {len(ids)} rules: {', '.join(ids)}")

    # 3) review with Gemini, skill as system instruction
    from google import genai
    client = genai.Client(api_key=api_key)
    print(f"[gemini] reviewing with {GEMINI_MODEL} ...")
    resp = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=build_prompt(rules, candidate),
        config={
            "system_instruction": skill_md,
            "response_mime_type": "application/json",
            "temperature": 0.2,
        },
    )
    raw = (resp.text or "").strip()
    try:
        report = json.loads(raw)
    except ValueError as e:
        raise SystemExit(f"Safety review did not return valid JSON: {e}\n--- raw ---\n{raw[:2000]}")

    report = _normalize_report(report, rules)

    # 4) write the report next to the candidate (out/ only; never data/)
    report_path = OUT_DIR / f"{level_id}.safety.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"path": str(report_path.relative_to(PIPELINE.parent)), "report": report}


def main() -> None:
    ap = argparse.ArgumentParser(description="Safety-review a candidate level (flag-only).")
    ap.add_argument("--id", default="the_last_two", help="candidate id in pipeline/out/")
    args = ap.parse_args()
    result = asyncio.run(review_candidate(args.id))
    rep = result["report"]
    blocks = [f for f in rep["findings"] if (f or {}).get("severity") == "block"]
    warns = [f for f in rep["findings"] if (f or {}).get("severity") == "warn"]
    print(f"\nReport: {result['path']}")
    print(f"  pass = {rep['pass']}   ({len(blocks)} block, {len(warns)} warn; "
          f"{len(rep['checked_rules'])} rules checked)")
    for f in rep["findings"]:
        print(f"  - [{(f or {}).get('severity','?')}] {(f or {}).get('rule_id','?')} "
              f"@ {(f or {}).get('where','?')}: {(f or {}).get('why','')}")
    print("\nFlag-and-suggest only — the candidate is untouched. "
          "The human gate decides approve / edit / reject.")


if __name__ == "__main__":
    main()
