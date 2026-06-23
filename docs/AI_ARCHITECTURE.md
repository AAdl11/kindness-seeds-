# Miya · Seeds of Kindness — AI Stewardship Architecture

> **One line / 一句話定位:** Miya does not put AI in front of children. Miya uses a backstage multi-agent system to help **organize, protect, and extend** a community's kindness — and the people stay human.
> 米芽不是讓 AI 取代人情,而是讓 AI 在後台幫忙整理、保護、延伸社區的善。
>
> **Audience:** Hunters Point Summer Camp teens (primary, ages 14–16); rural children in Taiwan (future). All minors.
> **Status:** Architecture of record. The public game ships as reviewed static content; this document describes the backstage AI layer.

---

## 0. The non-negotiable constraint (read first)

**Unreviewed AI output never reaches a player's screen.** Players (minors) only ever see human-reviewed, static content. Every generative agent runs **backstage**, behind a safety review and a human sign-off. This is not a limitation to apologize for — it is the design's strongest feature: a *human-in-the-loop, privacy-first, community-centered* system.

Two independent axes, never confused:
- **Simple** is for engineering — do not stack systems we cannot finish. Keep the build small.
- **Juvenile** is a content question — candy colors, decorative emoji, "pick-up-trash-for-points" play. This we mature for a teen audience.
Engineering can be simple *and* content mature at the same time.

---

## 1. Layered architecture

```
┌─ Layer ∞  Meta-Harness  (RESERVED — future, see §6)
│           the system observes and improves itself
│
├─ Layer 0  Strategy Planner   (StraTA-inspired — "draw the map before setting out")
│           sets goal + vows(constraints) + steps + done-criteria; binds everything below;
│           re-plans when the situation changes
│
├─ Layer 1  Miya Coordinator   (orchestrator)
│           interprets state, decides which worker to call, holds the plan
│
├─ Layer 2  Worker agents
│           ├ Guide   — companionship, hints, encouragement (the voice/soul)
│           ├ Content — generates levels / quests / branches as DATA (config JSON)
│           └ Safety  — a real blocking function + human-in-the-loop
│
├─ Extension (Tier 2)   Memory — remembers a player's progress & preferences
└─ Roadmap   (Tier 3)   Report (parent/teacher summaries) · Social (trilingual posts)
```

### Layer 0 — Strategy Planner (StraTA)
The cure for "AI amnesia": before any content is produced, a planner emits a short, high-level **strategy** that constrains every downstream step, so the system never "forgets the goal one step at a time."

- **Input:** task (e.g. "design a food-share branch level"), player/community context, the vows.
- **Output (machine-readable, MCP-friendly):**
```json
{
  "global_goal": "Help a teen feel a real trade-off under scarcity — without judging them",
  "audience": "teens 14-16, Hunters Point",
  "constraints": ["no scores/ranking", "no preaching", "no stigma of the vulnerable",
                  "respect every person's dignity", "age-appropriate"],
  "steps": ["set scene", "two costed options", "optional third mutual-aid path", "open reflection"],
  "done_when": "player has made a choice and seen an honest consequence; no 'correct answer' shown"
}
```
- **No reinforcement learning required.** This is architecture + prompting; we adopt StraTA's *idea* (strategy-on-top), not its training.
- **Dynamic re-plan trigger (the Tyson rule — "everyone has a plan until they get punched"):** a static map fails in a live, human environment. If the situation diverges from the plan (a player refuses, gets upset, goes off-script), the Coordinator interrupts and asks the Planner to redraw the map rather than forcing the old one.

### Layer 1 — Miya Coordinator (orchestrator)
Holds the current strategy, reads game state, and routes work to the right worker agent. Re-checks alignment to the global goal at each major step (institutionalized "never forget the original intention").

### Layer 2 — Worker agents (the three that ship)

**Guide agent — the soul.** Companionship, hints, encouragement. Behavior is fixed by five rules (grounded in two independent bodies of research: Carol Dweck's growth mindset — *process vs. ability praise* — and Adlerian / Dreikurs positive discipline — *encouragement vs. praise*):
1. Praise effort and method, never "you're smart."
2. Make mistakes normal and safe — first reaction is "tricky one," not "wrong."
3. Don't give the answer; hand the ball back with a question.
4. Connect first, then guide.
5. No fake praise — warm but honest.

> Note for teens (14–16): the *principles* above hold; the *expression* matures — drop cutesy tone and candy reward framing; lean into agency and grey-zone reflection. The final wording is set by the human designer's own voice (gratitude, respect, love; like water; never preachy), in EN / ZH / ES.

**Content agent — generates content as DATA, not as live chat.** It outputs a **level-config JSON** that the existing data-driven engine renders (see §4). It is bound by the Layer 0 strategy and the vows. It never speaks to a player directly.

**Safety agent — a function that actually blocks, not a paragraph in a README.** Before any generated content can proceed, Safety checks it against explicit forbidden clauses (see §5), age-appropriateness (14–16), and bias/stigma. Output that fails is blocked, not shown. In the demo this must be *demonstrable*: show the reviewer it catches and stops unsuitable content.

### Tier 2 (extension) — Memory
Remembers a player's progress, preferences, and where their sprout has grown. "It remembers me" is the strongest delight, for one extra layer. Built only if time allows.

### Tier 3 (roadmap, documented not built) — Report, Social
- **Report:** turns a learning trajectory into a summary a parent/teacher can read.
- **Social:** turns outcomes into trilingual community posts (the Tzu Chi outreach line).

---

## 2. Tools & boundaries (MCP) and Skills

**MCP server — "Miya content server."** Clean tool boundaries between game data, content generation, social drafting, and safety review:
```
read_game_config()        read_level_data()       analyze_player_state()
generate_next_quest()     generate_branch()       draft_social_post()
safety_review()           evaluate_alignment(state, strategy)
```
This lets the writeup state, honestly: *Miya uses MCP-style tool boundaries to separate game data, storytelling, social generation, and safety review.* We build a **minimal** hub, not a cloud backend — clarity over size, given the deadline.

**Agent Skills (`SKILL.md`, loaded on demand):**
- `guide_encouragement/` — the five-rule voice.
- `content_branch_design/` — how to build a costed moral-dilemma branch (see §7).
- `safety_review/` — the forbidden-clause checklist as an executable review.

---

## 3. The Definition of Done (scope discipline)

> **Tier 1 — Guide + Content + Safety run one complete loop, and the "wow moment" can be performed on camera = this round is done. Everything else is v2.**

The wow moment (teen version): a player faces a **real trade-off** (a 善經濟 / mutual-aid dilemma), makes a choice, sees an honest, AI-generated-then-human-reviewed consequence branch, and the Guide reflects by honoring their *reasoning* — not by telling them right or wrong.

Brakes: depth beats agent count; don't refactor the front-end, don't add accounts or cloud sync, don't add a branch to all three levels — **one** demonstration branch is enough.

---

## 4. How the AI layer plugs into the game (no engine rewrite)

The game is **data-driven**: level requirements, clues, supplies, thresholds, and scenes live in `data/`. So the Content agent's job is simply to **emit a valid level-config object**, which the existing engine renders. The AI layer adds content; it does not touch the engine. This is the clean seam that makes the whole thing buildable before the deadline — and it is what makes Miya a reusable template ("AIAO" mother-mold) for other communities.

---

## 5. Safety: the forbidden clauses (enforced by the Safety agent + human)

Any generated branch/content is rejected if it:
1. Stigmatizes the vulnerable (e.g. "this person might resell the supplies / isn't worth helping"). For a long-stigmatized community this is categorically out.
2. Sets a "correct answer" — no option is rewarded with points or labeled good/bad.
3. Preaches — no "you should…", no "the right thing to do is…".
4. Reduces a life or dignity to cold calculation — trade-offs must keep respect for every character.
5. Leads the dilemma toward a harmful conclusion (discrimination, exclusion, judging by appearance).

**Human-in-the-loop is mandatory and cannot be skipped:** the designer (明暺) gives the final review and sign-off, and carries final responsibility. All of this happens backstage; the teen only ever sees the finalized static result.

---

## 6. Meta-Harness — reserved future top layer (do NOT build now)

Meta-Harness is the frontier idea of an agent that **improves its own harness** — watching whether prompts, memory, tools, and context are actually effective, and optimizing them over time. It is the right *eventual* top layer for Miya.

**Why not now:** it needs real player data to learn from, and Miya has zero real players yet. With no data, it has nothing to learn. So it is **documented and reserved** here as Layer ∞, to be activated in v2/v3 after Miya has real teens playing and a body of session data. A lightweight first step toward it is a **Reflection Engine** (Miya writes a short, structured session diary), which can come before the full Meta-Harness.

> Sequence: ship the loop → real teens play → collect data → Reflection Engine → Meta-Harness. Framing it now keeps the architecture from "scattering"; building it now would be premature.

---

## 7. Worked example — "The Last Two" (the demo branch)

A concrete demonstration that this pipeline produces real, safe, teen-appropriate content. *(Skeleton; final wording is produced through the backstage three-layer flow and finalized by the human designer.)*

- **Player role:** a teen volunteer at a community mutual-aid station (agency, not bystander).
- **Scene:** only **2** fresh food packages left. Two needs at once:
  - **A — the young mother** with two kids, first in line, waited long. By "first-come-first-served," these two are hers.
  - **B — Mr. Wang**, a homebound elder who usually comes this hour but hasn't arrived; the player knows (from an earlier level) he moves slowly. If they're given out now, he goes without today.
- **Core tension:** predictable, rule-based fairness vs. flexible response to individual need. Both deserve help; resources fit only one.
- **Two costed options** (no right/wrong, no score): give by the rule (mother is cared for; Mr. Wang may, with dignity, stop coming) **or** hold one back for Mr. Wang (he's cared for; the mother may feel it's unfair / that you need connections to get help).
- **Optional third path (mutual aid — costly, can fail):** the player can speak up and coordinate on the spot (ask the mother if she'll share one; rally others). Success = more people each get something ("善經濟 = make the sharing cleverer, make the pie bigger"). Failure = politely refused; the player carries the awkwardness and still must choose option one or two. *Mutual good is not a free happy ending; it takes initiative and risk.*
- **Ending:** no grade. One open question, e.g. *"In what you saw today, what is 'fair'?"* No standard answer collected; pure reflection.

**Why this is the Capstone's core, demonstrated:** the branch is generated by the **Content agent**, screened by the **Safety agent** against §5, and finalized by the **human** — so the level is simultaneously a piece of content *and* a live demonstration of AI capability, AI's limits, child safety, and human-in-the-loop.

---

## 8. Capstone concept mapping

| Concept | Where it lives in Miya | Status |
|---|---|---|
| Multi-agent (ADK) | Strategy Planner → Coordinator → Guide / Content / Safety | core |
| MCP server | "Miya content server" tool boundaries (§2) | core |
| Agent Skills (`SKILL.md`) | guide / content-branch / safety-review | core |
| Safety mechanism | Safety agent as a real blocking function + HITL (§5) | core |
| Memory | Tier 2 extension | extension |
| Self-improvement | Meta-Harness, reserved (§6) | roadmap |

A *right-sized* design — three agents done well plus a clear roadmap — is itself the demonstration of an "AIAO" (small-charity AI advisor) methodology: buildable, finishable, defensible. Six half-built agents would undermine the very thing we're selling.

---

## 9. Two entrances (ethics)

- **Public game** = a gift to the Hunters Point community. No "Kaggle," no "competition," no AI-chat in front of minors. This stays the heart.
- **Capstone demonstration** = the backstage stewardship layer, shown to reviewers using **de-identified / synthetic data** — not real children's data or the community's private specifics as a competition narrative.
- One line to hold it all: *Miya is the heart; the stewardship layer is the backstage that protects and extends the heart. They share one soul but speak to different audiences.*
