"""
Orchestrator (Coordinator) — runs the whole loop, one complete pass.

    scenario id
      → Strategy Planner  draw the map: goal + non-negotiable constraints + brief
      → Content agent      draft a candidate via skill + MCP + Gemini
      → Safety agent       review it against the boundaries (skill + MCP)
      → Human gate         approve / edit / reject  (approve writes data/)

Each step prints its progress so the run is easy to record as a demo.

Iron rules: the agents only ever write to out/; only the human gate, on
approve, writes into data/. Keys come from .env; none live in code.

Run the full loop (any scenario in pipeline/scenarios/):
    python agents/orchestrator.py --scenario the_last_two
    python agents/orchestrator.py --scenario summer_seed_camp

Run planner + agents only, hand the gate off to a separate session:
    python agents/orchestrator.py --scenario summer_seed_camp --no-gate
    python review/human_gate.py --id summer_seed_camp
"""

from __future__ import annotations

import argparse
import asyncio
import pathlib
import sys

PIPELINE = pathlib.Path(__file__).resolve().parents[1]
# Put pipeline/ on the path so agents/ and review/ import as namespace packages.
sys.path.insert(0, str(PIPELINE))

from agents.strategy_planner import build_strategy     # noqa: E402
from agents.content_agent import generate_candidate    # noqa: E402
from agents.safety_agent import review_candidate        # noqa: E402


async def run_agents(scenario: str):
    print("\n" + "#" * 64)
    print("STEP 0/4 — Strategy Planner  (scenario → goal + constraints)")
    print("#" * 64)
    strategy = await build_strategy(scenario)
    level_id = strategy["scenario_id"]

    print("\n" + "#" * 64)
    print("STEP 1/4 — Content agent  (strategy + skill + Gemini → out/)")
    print("#" * 64)
    content = await generate_candidate(strategy)

    print("\n" + "#" * 64)
    print("STEP 2/4 — Safety agent  (skill + MCP rules → safety report)")
    print("#" * 64)
    safety = await review_candidate(level_id)

    return level_id, content, safety


def main() -> None:
    ap = argparse.ArgumentParser(description="Run the Miya content pipeline end to end.")
    ap.add_argument("--scenario", default="the_last_two",
                    help="scenario id in pipeline/scenarios/")
    ap.add_argument("--no-gate", action="store_true",
                    help="run planner + agents only; do the human gate separately")
    args = ap.parse_args()

    level_id, _content, safety = asyncio.run(run_agents(args.scenario))
    rep = safety["report"]
    print(f"\nSafety verdict: pass={rep['pass']} "
          f"({sum(1 for f in rep['findings'] if (f or {}).get('severity')=='block')} block, "
          f"{sum(1 for f in rep['findings'] if (f or {}).get('severity')=='warn')} warn)")

    print("\n" + "#" * 64)
    print("STEP 3/4 — Human review gate  (approve → data/; else stays in out/)")
    print("#" * 64)
    if args.no_gate:
        print(f"--no-gate set. Review when ready:  python review/human_gate.py --id {level_id}")
        return

    from review.human_gate import run as gate_run
    gate_run(level_id)


if __name__ == "__main__":
    main()
