"""
Orchestrator (Coordinator) — runs the whole loop, one complete pass.

    community need (one line)
      → Content agent   draft a candidate via MCP + Gemini
      → Safety agent    review it against the boundaries (skill + MCP)
      → Human gate      approve / edit / reject  (approve writes data/)

Each step prints its progress so the run is easy to record as a demo.

Iron rules: the agents only ever write to out/; only the human gate, on
approve, writes into data/. Keys come from .env; none live in code.

Run the full loop:
    python agents/orchestrator.py --need "Two food packages left, two people need them"

Run agents only, hand the gate off to a separate session:
    python agents/orchestrator.py --need "..." --no-gate
    python review/human_gate.py --id the_last_two
"""

from __future__ import annotations

import argparse
import asyncio
import pathlib
import sys

PIPELINE = pathlib.Path(__file__).resolve().parents[1]
# Put pipeline/ on the path so agents/ and review/ import as namespace packages.
sys.path.insert(0, str(PIPELINE))

from agents.content_agent import generate_candidate  # noqa: E402
from agents.safety_agent import review_candidate      # noqa: E402


async def run_agents(need: str):
    print("\n" + "#" * 64)
    print("STEP 1/3 — Content agent  (MCP read + Gemini draft → out/)")
    print("#" * 64)
    content = await generate_candidate(need)
    level_id = (content["candidate"].get("id") or "the_last_two")

    print("\n" + "#" * 64)
    print("STEP 2/3 — Safety agent  (skill + MCP rules → safety report)")
    print("#" * 64)
    safety = await review_candidate(level_id)

    return level_id, content, safety


def main() -> None:
    ap = argparse.ArgumentParser(description="Run the Miya content pipeline end to end.")
    ap.add_argument("--need", default="Two food packages left, two people need them",
                    help="one-line community need")
    ap.add_argument("--no-gate", action="store_true",
                    help="run the two agents only; do the human gate separately")
    args = ap.parse_args()

    level_id, _content, safety = asyncio.run(run_agents(args.need))
    rep = safety["report"]
    print(f"\nSafety verdict: pass={rep['pass']} "
          f"({sum(1 for f in rep['findings'] if (f or {}).get('severity')=='block')} block, "
          f"{sum(1 for f in rep['findings'] if (f or {}).get('severity')=='warn')} warn)")

    print("\n" + "#" * 64)
    print("STEP 3/3 — Human review gate  (approve → data/; else stays in out/)")
    print("#" * 64)
    if args.no_gate:
        print(f"--no-gate set. Review when ready:  python review/human_gate.py --id {level_id}")
        return

    from review.human_gate import run as gate_run
    gate_run(level_id)


if __name__ == "__main__":
    main()
