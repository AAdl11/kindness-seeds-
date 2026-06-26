"""
Strategy Planner — Layer 0 (the "draw the map before setting out" layer).

Given a scenario id, it loads that scenario file and, via the MCP server, the
community context and the firm safety boundaries. From these it composes the
strategy that constrains every step below it:

    { global_goal, non-negotiable constraints, scenario_brief, age_band,
      community, safety_rules }

It prints the goal and the constraints so the "map drawn first" layer is
visible in a demo. It generates no content and calls no model.

Run on its own to see the map:
    python agents/strategy_planner.py --scenario the_last_two
"""

from __future__ import annotations

import argparse
import asyncio
import json
import pathlib
import sys

PIPELINE = pathlib.Path(__file__).resolve().parents[1]
SERVER = PIPELINE / "mcp_server" / "server.py"
SCENARIOS = PIPELINE / "scenarios"


def list_scenarios() -> list[str]:
    if not SCENARIOS.is_dir():
        return []
    return [f.stem for f in sorted(SCENARIOS.glob("*.json"))]


def load_scenario(scenario_id: str) -> dict:
    path = SCENARIOS / f"{scenario_id}.json"
    if not path.is_file():
        raise SystemExit(f"No scenario '{scenario_id}'. Available: {', '.join(list_scenarios()) or '(none)'}")
    return json.loads(path.read_text(encoding="utf-8"))


def _brief_text(brief) -> str:
    if isinstance(brief, list):
        return "\n".join(str(x) for x in brief)
    return str(brief or "")


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


async def build_strategy(scenario_id: str) -> dict:
    """Compose the strategy for one scenario (scenario file + MCP context/rules)."""
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    sc = load_scenario(scenario_id)

    params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            community = _tool_value(await session.call_tool("get_community_context", {}))
            rules = _tool_value(await session.call_tool("get_safety_rules", {}))

    # non-negotiable constraints = the scenario's own + every firm safety boundary
    constraints = list(sc.get("constraints") or [])
    constraints += [f"safety:{r.get('id')}" for r in (rules or []) if isinstance(r, dict)]

    strategy = {
        "scenario_id": sc.get("id", scenario_id),
        "age_band": sc.get("age_band", ""),
        "global_goal": sc.get("global_goal", ""),
        "constraints": constraints,
        "scenario_brief": _brief_text(sc.get("scenario_brief")),
        "tone": sc.get("tone") or [],
        "community": community,
        "safety_rules": rules,
    }

    print(f"[planner] map drawn for '{strategy['scenario_id']}'  (age band {strategy['age_band']})")
    print(f"  goal: {strategy['global_goal']}")
    print("  non-negotiable constraints:")
    for c in constraints:
        print(f"   - {c}")
    return strategy


def main() -> None:
    ap = argparse.ArgumentParser(description="Draw the strategy (the map) for a scenario.")
    ap.add_argument("--scenario", default="the_last_two", help="scenario id in pipeline/scenarios/")
    args = ap.parse_args()
    asyncio.run(build_strategy(args.scenario))


if __name__ == "__main__":
    main()
