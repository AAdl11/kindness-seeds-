# Miya · Seeds of Kindness — AI Stewardship Architecture

Miya is a trilingual community game. Behind it runs a small multi-agent system that generates, reviews, and stewards content. The whole design rests on one principle: the AI works backstage, and players only ever see content a human has reviewed. This document describes that backstage architecture.

---

## 1. Design principle: AI stays backstage

The players are minors. Generated content is never shown to them unreviewed. Every agent produces its work backstage, where it passes a safety review and a human sign-off before anything reaches the game. Players experience a calm, reviewed, static experience; the AI is a content-and-stewardship system that supports the people who run the program.

Two words are kept separate throughout:

- *Simple* describes the engineering — small enough to finish and to maintain.
- *Mature* describes the content — written for teenagers (14–16): weight over decoration, agency over cuteness.

---

## 2. Layered architecture

```
Meta-Harness        planned future layer (§6) — the system reviews and improves itself

Strategy Planner    Layer 0 — sets the goal, constraints, steps; re-plans when things change
  └ Coordinator     Layer 1 — reads game state, routes work, holds the plan
       ├ Guide      companionship, hints, encouragement (the voice)
       ├ Content    generates levels / branches as data (a config object)
       └ Safety     reviews and blocks; final human sign-off
  Memory            extension — continuity across sessions
  Report · Social   roadmap — parent/teacher summaries · trilingual community posts
```

The current build centers on the three core agents — Guide, Content, Safety — running one complete loop, with the moral-dilemma branch in §7 as the demonstration. Memory is a near-term extension; Report, Social, and the self-improvement layer are on the roadmap. The design favors three agents that work well, with a clear path forward, over a larger number of partial ones.

### Strategy Planner — Layer 0

Before any content is generated, the planner produces a short, high-level strategy that constrains every step beneath it, so the system holds its goal across a long task instead of losing it one step at a time. It adopts the planning idea from the StraTA research — strategy on top of execution — as architecture and prompting, not model training.

```json
{
  "global_goal": "Help a teen feel a real trade-off under scarcity, without judging them",
  "audience": "teens 14-16, Hunters Point",
  "constraints": ["no scores or ranking", "no preaching", "no stigma of the vulnerable",
                  "respect every person's dignity", "age-appropriate"],
  "steps": ["set the scene", "two costed options", "an optional mutual-aid path", "an open reflection"],
  "done_when": "the player has chosen and seen an honest consequence; no 'correct answer' is shown"
}
```

The planner re-draws the strategy when the situation changes. A player who refuses, goes quiet, or moves off the expected path triggers a fresh plan rather than a forced one — the map is redrawn after the punch, not clung to.

### Coordinator — Layer 1

Holds the active strategy, reads the game state, routes work to the right agent, and checks each major step back against the original goal.

### Worker agents — Layer 2

**Guide — the voice.** Companionship, hints, encouragement, governed by five rules grounded in two independent bodies of research (Carol Dweck's growth mindset — process over ability praise — and Adlerian / Dreikurs positive discipline — encouragement over praise):

1. Praise effort and method, not "you're smart."
2. Keep mistakes safe — the first response is "that's a tricky one," not "wrong."
3. Hand the ball back with a question instead of giving the answer.
4. Connect first, then guide.
5. Stay warm but honest; no hollow praise.

For teenagers the principles hold and the tone matures — less sweetness, more agency and grey-zone reflection. The final wording is the human writer's own voice (gratitude, respect, love; like water; never preaching), in EN / ZH / ES.

**Content — content as data.** Generates levels, quests, and branches as a level-config object that the existing engine renders. It is bound by the planner's strategy and never addresses a player directly.

**Safety — review and block.** Checks every generated piece against the content boundaries (§5), age-appropriateness, and bias, and stops anything that fails. In a demonstration, this step is shown catching and holding back unsuitable content.

### Memory — extension

Remembers a player's progress and preferences, so the game keeps continuity across sessions.

### Report and Social — roadmap

Report turns a learning trajectory into a summary a parent or teacher can read. Social drafts trilingual community posts.

---

## 3. Tools and skills

A small **MCP server** ("Miya content server") gives the agents clean tool boundaries between game data, content generation, social drafting, and safety review:

```
read_game_config()      read_level_data()      analyze_player_state()
generate_next_quest()   generate_branch()      draft_social_post()
safety_review()         evaluate_alignment(state, strategy)
```

**Agent skills** (`SKILL.md`, loaded when needed):

- `guide_encouragement/` — the five-rule voice.
- `content_branch_design/` — building a costed moral-dilemma branch (§7).
- `safety_review/` — the content-boundary checklist as an executable review.

---

## 4. How the AI layer integrates with the game

The game is data-driven: each level's requirements, clues, supplies, thresholds, and scenes live in `data/`. The Content agent's output is simply a valid level-config object, which the existing engine renders. The AI layer adds content; it does not modify the engine. The same seam lets Miya serve as a reusable template for other communities.

---

## 5. Content boundaries and safety review

The Safety agent, followed by a human review, rejects any generated content that:

1. stigmatizes the vulnerable (for example, implying someone might resell supplies or isn't worth helping);
2. sets a single "correct answer," or labels a choice good or bad;
3. preaches — "you should…", "the right thing to do is…";
4. reduces a person's life or dignity to cold calculation;
5. leads the dilemma toward a harmful conclusion (discrimination, exclusion, judging by appearance).

The human review is part of the pipeline: a person gives the final sign-off and carries responsibility. All of it happens backstage; players see only the finalized result.

---

## 6. Meta-Harness — a planned future layer

A later layer will let the system review and improve its own workings — watching how well its prompts, memory, tools, and context serve the goal, and refining them over time (the "Meta-Harness" idea). It becomes meaningful once Miya has real players and a body of session data to learn from. A first step toward it is a **Reflection Engine**, in which Miya keeps a short, structured record of each session. The path is: run the loop, let real players play, gather data, add the Reflection Engine, then Meta-Harness. Naming it here keeps the architecture coherent and shows where the system is headed.

---

## 7. Worked example — "The Last Two"

A concrete piece of content that the pipeline produces, and at the same time a live demonstration of AI capability, AI's limits, child safety, and human review. *(A skeleton; the final wording is produced through the backstage flow and finalized by a human.)*

- **Player role:** a teen volunteer at a community mutual-aid station — an agent in the story, not a bystander.
- **The scene:** two fresh food packages are left, and two needs arrive at once:
  - **A — a young mother** with two children, first in line, who has waited a long time. By "first come, first served," the two packages are hers.
  - **B — Mr. Wang**, a homebound elder who usually comes at this hour but hasn't arrived; from an earlier level the player knows he moves slowly. If the packages go now, he goes without today.
- **The tension:** predictable, rule-based fairness against a flexible response to individual need. Both deserve help; the resources fit only one.
- **Two costed options**, neither scored nor labeled: give by the rule (the mother is cared for; Mr. Wang may, with quiet dignity, stop coming), or hold one back for Mr. Wang (he is cared for; the mother may feel it's unfair, or that help takes connections).
- **An optional third path — mutual aid, with a cost and a chance of failure:** the player can speak up and coordinate on the spot — ask the mother whether she'll share one, or rally others. Success means more people each receive something; failure means a polite refusal, and the player still chooses option one or two. Mutual good is not a free happy ending; it asks for initiative and risk.
- **The ending:** no grade. One open question — for example, *"In what you saw today, what is fair?"* — with no answer collected.

---

## 8. Capstone concept coverage

| Concept | Where it lives in Miya | Status |
|---|---|---|
| Multi-agent (ADK) | Strategy Planner → Coordinator → Guide / Content / Safety | core |
| MCP server | "Miya content server" tool boundaries (§3) | core |
| Agent skills (`SKILL.md`) | guide / content-branch / safety-review | core |
| Safety mechanism | Safety agent as a real blocking step, plus human review (§5) | core |
| Memory | extension | extension |
| Self-improvement | Meta-Harness (§6) | roadmap |

Three agents done well, with a documented roadmap, is itself a demonstration of a right-sized "AIAO" (small-charity AI advisor) methodology: buildable, finishable, and clear about what it does and does not yet do.

---

## 9. Audiences

- **Public game** — a gift to the Hunters Point community. This is the heart, and it stays the heart.
- **Stewardship layer** — the backstage system, demonstrated with de-identified, synthetic data rather than real community specifics.
- One line to hold it together: *Miya is the heart; the stewardship layer is the backstage that protects and extends it. One soul, two audiences.*

---

## Built on — references and acknowledgements

This architecture stands on work that others shared openly, and it is offered in the same spirit:

- The recent **StraTA** research on strategic planning for long-horizon agents — the "draw the map before setting out" idea behind the Strategy Planner (Layer 0).
- **Carol Dweck's** growth mindset (praising process over ability) and **Rudolf Dreikurs'** Adlerian positive discipline (encouragement over praise), which together shape the Guide's voice.
- The open agent-tooling ecosystem (ADK, the Model Context Protocol) and Anthropic's *AI Fluency* materials.

With gratitude to the researchers and communities who keep their work open. We pass it forward.

## License and citation

© 2026 **Miya · Seeds of Kindness** (AAdl11). This document is shared under **CC BY-SA 4.0**: you are warmly welcome to learn from it, adapt it, and build on it for your own community — as long as you (1) give attribution and (2) keep your adaptations open under the same terms.

Suggested citation:

> *Miya · Seeds of Kindness — AI Stewardship Architecture* (2026). https://github.com/AAdl11/kindness-seeds-
