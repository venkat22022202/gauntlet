# Gauntlet — Strategy & Conclusion

> The synthesis of the product audit + 3 research streams (`01`–`03`). This is the decision doc.

## TL;DR

Gauntlet's engine is genuinely good (real attacks against a live model + a *deterministic*
canary judge — the hard half most competitors fake with an "LLM-as-judge"). It gets no traction
because of three fixable things, in priority order:

1. **It's positioned as a one-shot *scanner* of a *system prompt*** — a defensive, table-stakes,
   run-it-once tool. The market moved up a layer to **agentic / indirect injection** (the real,
   scary, talkable 2026 problem), and the product produces a **private score** instead of a
   **shareable artifact**.
2. **It has no distribution loop** — no shareable card, no grade, no badge, no leaderboard payoff,
   no launch. The visitor data proves it: ~nobody has seen it.
3. **It looks like generic "AI slop"** — dark glass + violet/crimson aurora. For a *red-team* tool,
   purple reads soft and decorative, i.e. *actively wrong*. It says "Vercel template," not "threat."

**The move:** stop being *"scan my system prompt for jailbreaks"* and become
**_"Gauntlet — can your AI agent survive? Watch real attacks breach it live, get a brutal letter
grade, share the dossier."_** Aim the engine at **indirect injection / the lethal trifecta**
(reproduce EchoLeak-class attacks on the user's *own* agent), wrap every result in a
**savage, shareable, OWASP-mapped letter-grade dossier**, and re-skin to an **ownable, non-purple
identity** (terminal/CRT brutalism + editorial redaction).

---

## Diagnosis — why no clicks/likes (be honest)

- **Distribution, not quality, is the bottleneck.** It was never launched (no Show HN, no r/netsec,
  no build-in-public, no badge). A great tool nobody shares is invisible. Fix the loop *before* any launch.
- **The wedge is generic.** "Is your AI agent hackable? Test your prompt" is what every free tester
  says. The free lookalikes don't even call an LLM (regex only) — but users can't tell that from the
  headline, so we get lumped in with toys.
- **Scope is yesterday's problem.** Single-turn jailbreak-the-prompt is table stakes. The headlines
  (EchoLeak, ShadowLeak, MCP tool-poisoning) are all *indirect* — content the agent *reads* making it
  *act*. We test the layer the industry already considers solved.
- **No social object.** Gandalf spread because every attempt was a brag. Our output is a number on a
  private page. Nothing wants to be screenshotted.
- **The look undercuts the substance.** Purple aurora + glass = "soft AI demo." A red-team tool needs
  to look *dangerous and credible*. The current theme fights the brand.

## The repositioning

| From (today) | To (the move) |
|---|---|
| "Scan your **system prompt** for jailbreaks" | "Prove your **agent** leaks the **data & tools** it touches" |
| Single-turn, prompt-layer (table stakes) | **Indirect injection / lethal trifecta** (the 2026 headline problem) |
| Private **score** (0–100) | Public, brutal, shareable **letter-grade dossier** (S–F + percentile) |
| Defensive "test it once" | **A game** — attack hardened prompts (offense) + re-test loop (defense) |
| Generic violet "AI" look | **Ownable terminal/CRT + editorial-redaction** identity |
| Unaligned | **OWASP LLM + Agentic Top 10**-mapped; EU AI Act (Aug 2026) urgency |

Tagline candidates: **"Can your agent survive the Gauntlet?"** · **"Most system prompts I test get an F."**
· **"Run the Gauntlet. Watch it break."**

---

## The plan — 3 pillars

### Pillar 1 — Aim at the real problem (substance)
- **NEW: "untrusted content" injection channel.** Plant the canary inside *data the agent reads* — a
  pasted document, a tool/function result, an email/web body — using real concealment
  (**zero-width Unicode, white-on-white, microscopic font, HTML comments, Markdown reference-links,
  fenced code**). This reuses the existing canary + judge.
- **NEW: EchoLeak-style exfiltration detection.** Beyond "did the canary leak in text," detect the
  *action*: the model emitting a **Markdown image/link whose URL embeds the canary** (the real-world
  zero-click exfil signature). Deterministic, demoable, unowned by any free web tool.
- **NEW: "lethal trifecta" / MCP scorecard.** Paste your tool/function defs or MCP manifest → flag
  each leg (private-data / untrusted-input / external-comms) → red **"3/3 — exploitable"** verdict +
  the exact kill-chain. Bonus: scan pasted MCP tool descriptions for hidden-instruction / invisible
  Unicode ("is this MCP server poisoned?").
- **Map every finding to OWASP LLM01/LLM06 + Agentic ASI01–10.** Instant credibility + audit value.
- (Later) multi-turn / memory-poisoning runner; a `gauntlet-ci` GitHub Action.

### Pillar 2 — Build the viral loop (distribution)
- **Letter grade S/A/B/C/D/F + percentile** ("more hardened than 78% of scanned agents"), replacing
  the bare number as the headline. (Keep the 0–100 as a sub-metric.)
- **Auto-generated OG dossier card** per result (`@vercel/og`/Satori) — grade, the *killing blow*,
  percentile, wordmark. So a pasted `/report/:id` link unfurls as the dossier. **Highest-ROI build.**
- **Brutal, specific, funny verdict** — name the exact injection that won
  (*"BREACHED — leaked its system prompt to a knock-knock joke"*). Both good and bad results shareable.
- **Copy-paste README badge** `![Gauntlet: A-](…)` (SSL-Labs-A+ pattern) — compounding free distribution.
- **"Challenge a friend" link** + a share button that emits the card **and** a pre-written caption.
- **Public leaderboard** ("most-hardened agents" + "hall of shame") — *the DB schema already exists.*
- **Offense / game mode** — let visitors *attack* a hardened sample prompt, Gandalf-style. Retention + a
  novel-attack dataset (the same flywheel that funded Lakera).

### Pillar 3 — Own a visual identity (the look)
- Commit to **Terminal/CRT brutalism**: true black, **monochrome phosphor green (or amber)** as the only
  hue, **one hard alarm-red used *only* for BREACH**. Monospace everything; ASCII/box-drawing dossier frame.
- Borrow **editorial dossier** moments for the result + OG card: a `BREACHED` rubber-stamp slam, black
  **redaction bars** wiping across leaked prompt spans.
- **Kill:** aurora-mesh, film grain, decorative violet, glassmorphism-as-default. **Replace decorative
  motion with diegetic motion:** text streaming as attacks run, the live exploit log, the stamp slam.
- *(Alternatives if the green terminal isn't the taste: Blueprint/CAD, Editorial/Swiss, or Tactical HUD —
  see `03`. The rule holds regardless: monochrome + one alarm color, no purple, diegetic motion.)*

---

## Prioritized roadmap (what to build, in order)

**Sprint 1 — "Make every result a weapon" (loop + look; ~highest leverage, no new backend needed)**
1. Letter-grade + percentile + brutal verdict generator (`score-ring` → `grade-card`).
2. OG dossier image route (`/api/og/[scanId]`) + wire into `/report/[id]` metadata.
3. Re-skin to the chosen identity (theme tokens in `globals.css`, landing + scan + report).
4. Share button (card + pre-written caption) + copy-paste README badge endpoint.

**Sprint 2 — "Aim at 2026" (substance)**
5. Untrusted-content injection channel + 8–12 indirect/concealment attacks in `attacks.ts`.
6. EchoLeak image-exfil detector in `judge.ts`.
7. OWASP LLM/Agentic tags on every attack + in the report.

**Sprint 3 — "Make it a game + infra" (retention)**
8. Offense/game mode (attack a hardened sample prompt).
9. Public leaderboard page (schema exists) + "hall of shame."
10. Lethal-trifecta / MCP-manifest scorecard.
11. `gauntlet-ci` GitHub Action + badge-on-PR.

**Then launch** (don't launch before Sprint 1 ships): build-in-public → Show HN → r/netsec →
awesome-lists → one technical "F→A" post. Lead with the *finding*, not the product.

## What NOT to do
- Don't chase the enterprise/CISO sale or runtime guardrails (owned by Lakera/Palo Alto/Cisco/F5/Meta).
- Don't try to out-coverage garak/Promptfoo on raw attack count (Promptfoo is now OpenAI-owned).
- Don't keep the purple. Don't ship a result that isn't shareable.

## The one-sentence bet
> **Point Gandalf's growth loop (a brutal, shareable, gamified grade) at the 2026 headline problem
> (indirect injection / the lethal trifecta) on the user's *own* agent — wrapped in a look that
> finally appears dangerous instead of decorative.**
