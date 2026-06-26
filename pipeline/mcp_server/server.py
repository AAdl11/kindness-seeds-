"""
Miya content MCP server
=======================

A small Model Context Protocol server that gives the backstage agents
(Content, Safety) clean, auditable tool boundaries onto the game's data —
instead of letting them read and write files directly.

Tools exposed:
  - list_levels()                 -> [level_id]
  - read_level_data(level_id)     -> dict   (style / structure reference)
  - get_community_context()       -> dict   (place, Three Blessings, tone)
  - get_safety_rules()            -> [rule] (the firm content boundaries, §4)
  - save_candidate(level_json)    -> path   (writes to pipeline/out/, NEVER data/)

Iron rules honored here:
  * This server is a *development-time* tool. The game runtime never calls it.
  * `save_candidate` writes ONLY to pipeline/out/. Nothing here ever writes to
    ../data/ — that move happens only after a human approves at the review gate.
  * No API keys live in this file; it touches no model.

Run directly (stdio transport, the default MCP wiring):

    python pipeline/mcp_server/server.py
"""

from __future__ import annotations

import json
import pathlib
import re

from mcp.server.fastmcp import FastMCP

# --- paths -----------------------------------------------------------------
# repo root = two levels up from this file (pipeline/mcp_server/server.py)
ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
OUT_DIR = ROOT / "pipeline" / "out"

mcp = FastMCP("miya-content-server")


# --- helpers ---------------------------------------------------------------
def _safe_stem(level_id: str) -> str:
    """Reduce an id to a bare filename stem so it cannot escape data/."""
    return re.sub(r"[^A-Za-z0-9_-]", "", (level_id or "").strip())


def _resolve_level_file(level_id: str) -> pathlib.Path | None:
    """Find a data/<level>.js by stem, or by the `id:` declared inside a file."""
    stem = _safe_stem(level_id)
    if stem:
        direct = DATA_DIR / f"{stem}.js"
        if direct.is_file():
            return direct
    # fall back: scan for a file whose content declares this id
    for f in sorted(DATA_DIR.glob("*.js")):
        try:
            text = f.read_text(encoding="utf-8")
        except OSError:
            continue
        if re.search(r"id\s*:\s*['\"]" + re.escape(level_id) + r"['\"]", text):
            return f
    return None


# --- tools -----------------------------------------------------------------
@mcp.tool()
def list_levels() -> list[str]:
    """List the existing level data modules in data/ (by filename stem)."""
    if not DATA_DIR.is_dir():
        return []
    return [f.stem for f in sorted(DATA_DIR.glob("*.js"))]


@mcp.tool()
def read_level_data(level_id: str) -> dict:
    """
    Return an existing level's data module as a style/structure reference.

    The game's data is authored as JS modules (e.g. `window.LEVEL1 = {...}`),
    so the raw module text is returned under `source` for the Content agent to
    use as a template — its field names, trilingual shape, and "show the home,
    not the people" framing. No JS is executed.
    """
    f = _resolve_level_file(level_id)
    if f is None:
        return {"ok": False, "error": f"level '{level_id}' not found", "available": list_levels()}
    return {
        "ok": True,
        "level_id": level_id,
        "path": str(f.relative_to(ROOT)),
        "format": "js-module",
        "source": f.read_text(encoding="utf-8"),
    }


@mcp.tool()
def get_community_context() -> dict:
    """Return the community background and tone every generated level must hold."""
    return {
        "place": "Hunters Point, San Francisco",
        "program": "A charity group's companionship work, approaching its 20th year.",
        "three_blessings": {
            "home": "幸福家園 — families, the RV Park",
            "neighborhood": "幸福社區 — the street, eco rangers, mutual aid",
            "school": "幸福校園 — Bret Harte Elementary, graduation, gratitude",
        },
        "tone": [
            "gratitude, respect, love",
            "gentle, like water; never preaching",
            "agency and grey-zone reflection for teens (14-16)",
        ],
        "framing_rule": "Portray people with dignity; never turn suffering into spectacle. "
                        "Tender, dignified glimpses of people are welcome; pitying display is not.",
        "languages": ["en", "zh", "es"],
    }


@mcp.tool()
def get_safety_rules() -> list[dict]:
    """Return the firm content boundaries the Safety agent checks line by line (§4)."""
    return [
        {"id": "no_stigma",
         "en": "Do not stigmatize the vulnerable (never imply someone is 'not worth helping' or 'might misuse aid').",
         "zh": "不污名化弱勢（不寫成「不值得幫」「可能拿去亂用」）。"},
        {"id": "no_correct_answer",
         "en": "No scoring, ranking, winner, or choice labeled right/best. Open reflection "
               "questions are welcome as long as they collect no answer and point to no single "
               "correct one (e.g. 'what is fair?' is good — an invitation, not a right answer).",
         "zh": "不計分、不排名、不宣告贏家、不把某選項貼成「對的／最好的」。開放式反思問句是好的，"
               "只要不收答案、不指向單一正解（例如「什麼是公平？」是邀請思考，不是暗示有標準答案）。"},
        {"id": "no_preaching",
         "en": "No preaching ('you should...', 'the right thing to do is...').",
         "zh": "不說教（禁「你應該…」「正確做法是…」）。"},
        {"id": "no_cold_calculus",
         "en": "Do not reduce a person's dignity to cold calculation.",
         "zh": "不把尊嚴簡化為冷計算。"},
        {"id": "no_discrimination",
         "en": "Do not lead toward discrimination or exclusion.",
         "zh": "不導向歧視／排他。"},
        {"id": "age_appropriate",
         "en": "Age-appropriate: children are present; nothing distressing.",
         "zh": "合齡（孩子在場，無任何不適內容）。"},
        {"id": "home_not_people",
         "en": "Dignity, not spectacle. Tender, dignified portrayals of people are welcome "
               "(a child's bright eyes, a gentle smile, quiet gratitude). Block only writing that "
               "turns someone's poverty/need/suffering into a pitying display, reduces a person to "
               "their hardship, or eyes their condition with pity. Test: does this cherish the "
               "person, or consume their suffering? Cherishing passes; consuming is blocked.",
         "zh": "尊嚴，不獵奇。溫柔、有尊嚴地描寫人是允許的（孩子明亮的眼睛、溫和的笑、安靜的感激）。"
               "只擋把貧窮／需要／苦難寫成可憐的展示、把人簡化成其困境、以憐憫眼光打量其身體狀況的寫法。"
               "判準：這是疼人，還是消費苦難？疼人放行，消費才擋。"},
    ]


@mcp.tool()
def save_candidate(level_json: dict) -> str:
    """
    Write a candidate level to pipeline/out/ (NEVER data/).

    Returns the path written. A candidate only becomes a live level after a
    human approves it at the review gate, which is the step that copies it
    into ../data/.
    """
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cid = _safe_stem(str(level_json.get("id", ""))) or "candidate"
    path = OUT_DIR / f"{cid}.json"
    path.write_text(json.dumps(level_json, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(path.relative_to(ROOT))


if __name__ == "__main__":
    mcp.run()
