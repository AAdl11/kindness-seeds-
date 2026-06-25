# Miya — backstage stewardship pipeline

A small, development-time multi-agent pipeline that **generates, safety-reviews,
and human-approves** new levels before they ever become part of the game.

> **Iron rules**
> 1. Unreviewed AI output never reaches a player. Candidates are written to
>    `out/` and only move into `../data/` after a human approves them.
> 2. The game runtime (`../index.html` + `../src/` + `../data/`) stays pure
>    static and offline. This pipeline is a tool for the people who run the
>    program — players never call any AI.
> 3. No keys in the repo. `GEMINI_API_KEY` lives in `.env` (git-ignored).
> 4. A human gives the final sign-off and carries responsibility.

See the architecture it implements in [`../docs/AI_ARCHITECTURE.md`](../docs/AI_ARCHITECTURE.md).

## The flow

```
Community need
  → Strategy Planner   sets the goal, loads the firm content boundaries
  → Content agent      reads data/ via MCP, calls Gemini, drafts a level JSON
  → Safety agent       checks the boundaries line by line → safety report
  → Human review gate  approve / edit / reject  (only approve writes to data/)
  → Static level       lives in data/, the game plays it offline
```

## Setup

```
cd pipeline
pip install -r requirements.txt
cp .env.example .env        # then put your own GEMINI_API_KEY in .env
```

## Run the demo (target)

```
python agents/orchestrator.py --need "Two food packages left, two people need them"
# → drafts the_last_two candidate → safety report → human gate → on approve, writes ../data/
```

## Layout

```
pipeline/
├── README.md              this file
├── .env.example           key template (real .env is git-ignored)
├── requirements.txt       google-adk, mcp, google-genai, python-dotenv
├── mcp_server/
│   └── server.py          "Miya content server" — tool boundaries onto data/
├── skills/                Agent Skills (SKILL.md), loaded when needed
├── agents/                Strategy Planner · Content · Safety · Orchestrator
├── review/
│   └── human_gate.py      CLI review gate (approve / edit / reject)
└── out/                   candidate JSON (git-ignored)
```

## Build status

This pipeline is being assembled step by step, with a human review after each step.

- [x] **Step 1 — MCP server** (`mcp_server/server.py`): `list_levels`,
      `read_level_data`, `get_community_context`, `get_safety_rules`,
      `save_candidate` (writes only to `out/`).
- [ ] Step 2 — Content agent (MCP + Gemini → candidate JSON)
- [ ] Step 3 — Safety agent (`safety_review` skill → report)
- [ ] Step 4 — Orchestrator + human review gate
- [ ] Step 5 — Agent Skills (`SKILL.md`) wired in
- [ ] Step 6 — approved level plays in the game (engine unchanged)
- [ ] Step 7 — finalize this README (install + one-line demo + diagram)

## The MCP server (step 1)

`mcp_server/server.py` runs over stdio (the default MCP transport):

```
python mcp_server/server.py
```

It exposes five tools. The agents call these instead of touching files directly,
so every read of `data/` and every candidate write is auditable — and
`save_candidate` is structurally unable to write into `data/`.

| Tool | Returns |
|---|---|
| `list_levels()` | level ids (filename stems) in `../data/` |
| `read_level_data(level_id)` | that level's JS module text, as a style/structure reference |
| `get_community_context()` | place, Three Blessings, tone, framing rule, languages |
| `get_safety_rules()` | the firm content boundaries, checked line by line |
| `save_candidate(level_json)` | writes to `out/<id>.json` and returns the path |
