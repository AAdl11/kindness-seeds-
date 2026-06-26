"""
Human review gate — the step that cannot be skipped (iron rule #1).

Shows the candidate level and the safety report, then lets a human choose:

  approve  -> write the level into ../data/ (it becomes a live, static level)
              and stamp safety_meta.reviewed_by = "human".
  edit     -> leave it in out/ for manual editing; nothing reaches data/.
  reject   -> leave it in out/; nothing reaches data/.

This file is the ONLY place in the pipeline that writes into data/. The Content
and Safety agents can only touch out/. A person gives the final sign-off and
carries responsibility.

Run on its own:
    python review/human_gate.py --id the_last_two
"""

from __future__ import annotations

import argparse
import json
import pathlib

PIPELINE = pathlib.Path(__file__).resolve().parents[1]
ROOT = PIPELINE.parent
OUT_DIR = PIPELINE / "out"
DATA_DIR = ROOT / "data"

LANGS = ("en", "zh", "es")


def _load(level_id: str):
    cand_path = OUT_DIR / f"{level_id}.json"
    if not cand_path.is_file():
        raise SystemExit(f"No candidate at {cand_path}. Run the orchestrator or content agent first.")
    candidate = json.loads(cand_path.read_text(encoding="utf-8"))
    report_path = OUT_DIR / f"{level_id}.safety.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else None
    return cand_path, candidate, report


def _tri(label: str, obj, indent: str = "    ") -> None:
    obj = obj or {}
    print(f"{indent}{label}:")
    for l in LANGS:
        print(f"{indent}  [{l}] {obj.get(l, '')}")


def show_candidate(c: dict) -> None:
    print("\n" + "=" * 64)
    print(f"CANDIDATE LEVEL  ·  id={c.get('id')}  type={c.get('type')}")
    print("=" * 64)
    _tri("title", c.get("title"))
    _tri("scene", c.get("scene"))
    for i, ch in enumerate(c.get("choices") or []):
        print(f"  — choice {i + 1} —")
        _tri("label", (ch or {}).get("label"), indent="      ")
        _tri("consequence", (ch or {}).get("consequence"), indent="      ")
    tp = c.get("third_path") or {}
    print("  — third path (mutual aid) —")
    _tri("success", tp.get("success"), indent="      ")
    _tri("fail", tp.get("fail"), indent="      ")
    _tri("ending_question", c.get("ending_question"))
    print(f"    safety_meta: {json.dumps(c.get('safety_meta', {}), ensure_ascii=False)}")


def show_report(r) -> None:
    print("\n" + "-" * 64)
    if r is None:
        print("SAFETY REPORT: (none found — run the safety agent)")
        print("-" * 64)
        return
    findings = r.get("findings") or []
    blocks = [f for f in findings if (f or {}).get("severity") == "block"]
    warns = [f for f in findings if (f or {}).get("severity") == "warn"]
    print(f"SAFETY REPORT  ·  pass={r.get('pass')}  "
          f"({len(blocks)} block, {len(warns)} warn; {len(r.get('checked_rules') or [])} rules checked)")
    print("-" * 64)
    for f in findings:
        f = f or {}
        print(f"  [{f.get('severity','?')}] {f.get('rule_id','?')} @ {f.get('where','?')}")
        if f.get("quote"):
            print(f"        quote: {f['quote']}")
        if f.get("why"):
            print(f"        why:   {f['why']}")
    for fx in (r.get("suggested_fixes") or []):
        fx = fx or {}
        print(f"  ~ fix [{fx.get('rule_id','?')}]: {fx.get('suggestion','')}")
    if not findings:
        print("  (no findings)")


def _approve(level_id: str, candidate: dict) -> str:
    """Write the approved level into data/ and stamp human review. Returns path."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    meta = dict(candidate.get("safety_meta") or {})
    meta["reviewed_by"] = "human"
    candidate["safety_meta"] = meta
    out_path = DATA_DIR / f"{level_id}.json"
    out_path.write_text(json.dumps(candidate, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(out_path.relative_to(ROOT))


def run(level_id: str) -> dict:
    cand_path, candidate, report = _load(level_id)
    show_candidate(candidate)
    show_report(report)

    safety_passed = bool(report and report.get("pass"))
    print("\nChoose:  [approve]  [edit]  [reject]")
    choice = input("> ").strip().lower()

    if choice in ("approve", "a"):
        if not safety_passed:
            print("\n⚠  Safety did NOT pass (or no report). Approving overrides the "
                  "advisory and is your responsibility.")
            confirm = input("Type  I take responsibility  to proceed, or anything else to cancel:\n> ").strip()
            if confirm != "I take responsibility":
                print("Cancelled. Nothing written to data/.")
                return {"decision": "cancelled"}
        path = _approve(level_id, candidate)
        print(f"\n✓ Approved. Written to {path}  (safety_meta.reviewed_by = \"human\").")
        print("  It is now a static level; the candidate also remains in out/.")
        return {"decision": "approve", "data_path": path}

    if choice in ("edit", "e"):
        print(f"\n✎ Left for editing at {cand_path.relative_to(ROOT)}. "
              "Edit it, re-run the safety agent, then run the gate again. Nothing reached data/.")
        return {"decision": "edit"}

    print(f"\n✗ Rejected. {cand_path.relative_to(ROOT)} stays in out/; nothing reached data/.")
    return {"decision": "reject"}


def main() -> None:
    ap = argparse.ArgumentParser(description="Human review gate (approve/edit/reject).")
    ap.add_argument("--id", default="the_last_two", help="candidate id in pipeline/out/")
    args = ap.parse_args()
    run(args.id)


if __name__ == "__main__":
    main()
