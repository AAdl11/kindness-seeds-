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

## Reproduce it (clone → install → run)

Requires Python 3.10+ and a free Gemini API key from Google AI Studio
(<https://aistudio.google.com/apikey>). The key lives only in your local `.env`,
which is git-ignored — no key is ever committed.

```
git clone https://github.com/AAdl11/kindness-seeds-.git
cd kindness-seeds-/pipeline
python -m pip install -r requirements.txt

cp .env.example .env          # macOS/Linux   (Windows: copy .env.example .env)
# then open .env and paste your key:  GEMINI_API_KEY=...

python agents/orchestrator.py --need "Two food packages left, two people need them"
```

That single command runs the full pass:

```
Content agent  → drafts the_last_two candidate (MCP + Gemini) → out/
Safety agent   → reviews it (skill + MCP rules) → out/the_last_two.safety.json
Human gate     → shows candidate + report → approve / edit / reject
                 approve ONLY → writes ../data/the_last_two.json (reviewed_by:"human")
```

Run the agents now and the human gate later:

```
python agents/orchestrator.py --need "..." --no-gate
python review/human_gate.py --id the_last_two
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
- [x] **Step 2 — Content agent** (`agents/content_agent.py`): reads `data/`
      through MCP, drafts the `the_last_two` level with Gemini (key from
      `.env`), validates the trilingual shape, and writes via `save_candidate`.
      Candidate stays `reviewed_by: "pending"` until the human gate.
- [x] **Step 3 — Safety agent** (`agents/safety_agent.py` + `skills/safety_review/SKILL.md`):
      loads the skill, fetches the boundaries via MCP `get_safety_rules`, reviews
      the candidate rule by rule, and writes `out/<id>.safety.json`
      (`{pass, findings, suggested_fixes, checked_rules}`). Flag-only — never edits
      the candidate; `pass` is recomputed locally from the findings.
- [x] **Step 4 — Orchestrator + human review gate** (`agents/orchestrator.py`,
      `review/human_gate.py`): one command runs Content → Safety → human gate.
      The gate is the only writer into `data/`; approve stamps
      `reviewed_by:"human"`, edit/reject keep everything in `out/`.
- [x] **Step 5 — Agent Skills wired in**: both agents load a `SKILL.md` as their
      system instruction — `skills/content_branch_design/` (Content) and
      `skills/safety_review/` (Safety). The design rules/voice/schema now live in
      the skill, not hard-coded in `content_agent.py`.
- [ ] Step 6 — approved level plays in the game (engine unchanged)
- [x] **Step 7 — documentation**: main `README.md` has the judges' link row,
      the problem→solution→architecture story, a Mermaid pipeline diagram, and the
      capstone-concept mapping; this file has the clone→install→one-command run.

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
