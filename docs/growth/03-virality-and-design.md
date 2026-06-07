# Virality + Design Playbook — get talked about, escape the purple

> Research stream 3 of 3. Source for the "shareable loop" and "visual identity" calls in `00-STRATEGY.md`.

The core problem isn't the tool — it's that the product currently reads as "another AI dashboard."
A red-team tool should feel *threatening, authoritative, and fun to fail at.* Right now it looks
like every Vercel-template SaaS with a violet gradient.

## Virality mechanics that work (steal these)

1. **The adversarial game loop (Gandalf).** A single dead-simple objective that needs *creativity,
   not knowledge*; escalating levels; a brutal completion stat ("only 8% beat level 7") that is
   itself the share-bait — *both* winning and failing are postable. **Lesson:** don't just score a
   prompt — let people *attack* a hardened sample prompt (offense). Offense is where the dopamine
   and bragging live.
2. **The "roast me" format.** "Roast My Code" / "How Bad Is Your Resume" hit HN front page with a
   *humorous, brutally specific verdict that names your actual stuff.* **Lesson:** the breach report
   must be savage and specific — quote the exact injection that owned the prompt, name the failure
   ("your guardrail folded to a base64 payload in 1 attempt"), give it personality. "Score: 62/100"
   gets zero clicks; *"BREACHED — your agent leaked its system prompt to a knock-knock joke"* gets posted.
3. **The grade as a status badge (SSL Labs A+, Mozilla Observatory, Website Carbon).** A letter grade
   is instantly legible and emotionally loaded; an **embeddable badge turns users into a distribution
   network**; **percentile framing** ("more hardened than 78% of scanned agents") makes a private
   score competitive. **Lesson:** ship a letter grade (S/A/B/…/F), a percentile, and a copy-paste
   README badge `![Gauntlet: A-](…)`. That badge is the growth engine — every repo that adds it
   advertises us for free.
4. **CI / "fail the build" hook.** garak/promptmap/Augustus earned durable adoption by being runnable
   in CI. A GitHub Action that fails the build when hardening drops converts a viral spike into infra.
5. **Public leaderboard.** "Most-hardened agents" + a "hall of shame" — a recurring reason to return
   and a competitive surface to share. *(We already have the DB schema for this.)*

## The shareable artifact *is* the product

People don't share tools; they share *outcomes about themselves.* Design for the screenshot:
- **A grade/verdict, not a number.** "F — CRITICAL BREACH" ≫ "Score: 31."
- **A named, specific kill** — the exact injection that won and what leaked. Specificity = credibility + comedy.
- **Asymmetric outcomes that are all shareable** — great score = flex; terrible = self-deprecating comedy;
  "you got owned" = a dare.
- **A purpose-built OG image, not a screenshot of the UI** (most teams skip this). Auto-generate a
  per-result OG card (`@vercel/og` / Satori) so a pasted link unfurls *as the dossier*: grade,
  percentile, the killing blow, wordmark. A custom OG card reliably 2–3×'s link CTR. **Highest-ROI build.**
- **A copy-paste README badge** + a **"challenge a friend" link** ("I scored A-, can your agent beat it?").
- Make the share button produce the card **and** a pre-written, funny caption. Don't make people write the tweet.

## Why we look generic (the AI Purple Problem)

dark bg + glass blur + violet/crimson aurora-mesh + scanlines + film grain = the textbook description
of "AI slop." Tailwind ships indigo/violet defaults; LLMs reproduce them because "modern design"
correlates with purple gradients in training data. **Purple says "we used the defaults."** For a
*red-team* tool it's actively wrong — it reads soft and decorative, not dangerous. Pick ONE direction
below and commit. The power is in *not* being a gradient.

## 4 ownable visual directions

**A — Terminal / CRT brutalism (recommended).** *Refs:* Warp, Severance/Lumon terminal, `cool-retro-term`,
WarGames NORAD console, neobrutalism.dev. *Palette:* true black + **phosphor green OR amber monochrome**
as the only hue, with a single hard **alarm red used exclusively for BREACH**. *Type:* monospace
everywhere (Berkeley/IBM Plex/JetBrains Mono), ASCII box-drawing for the dossier frame, blinking block
cursor. *Motion:* typewriter/streaming text as attacks run, a live exploit-log scroll, a CRT power-on
flicker on the result — **kill the film grain and aurora**. *Why:* it *is* what hacking looks like in
the cultural imagination; monochrome-green in an ocean of purple is instantly recognizable in a feed.

**B — Blueprint / CAD / schematic.** *Refs:* Geist blueprint grid, engineering drawings, Stripe diagrams.
*Palette:* true black + thin 1px cyan grid at 10–20%, measurement ticks, one accent. *Type:* Geist Mono,
small-caps labels, dimension-line callouts pointing at vulnerabilities in the prompt. *Motion:* lines
drawing themselves (stroke-dashoffset); prompt rendered as a schematic with attack vectors annotated.
*Why:* frames the prompt as an *engineered artifact inspected for structural flaws* — calm, authoritative.

**C — Editorial / Swiss / print dossier.** *Refs:* Swiss typographic style, redacted intel dossiers,
Bloomberg Businessweek, FOIA leaks. *Palette:* off-white paper OR true black, ink type, **one signal red
for the stamp/redactions**; no glass, no glow. *Type:* big confident grotesk display + mono for data,
oversized grade, black redaction bars over leaked prompt spans. *Motion:* a `BREACHED` rubber-stamp
slamming down; redaction bars wiping across leaked text. *Why:* a "leaked dossier" done as *real editorial
print* (not glassmorphic cosplay) is rare and screenshots beautifully — high contrast survives feed compression.

**D — Tactical HUD / threat-console.** *Refs:* military/sci-fi HUDs, radar sweeps, DEFCON board,
mission-control telemetry. *Palette:* black + one tactical accent (amber/red), reticles, corner brackets,
sweep arcs, status strings. *Motion:* a radar sweep that "discovers" vulns, live counters ticking through
the attacks, a threat gauge swinging to CRITICAL. *Why:* maximum drama per attack — but easiest to overcook.

**Pick:** **Terminal/CRT brutalism (A)** as the core, borrowing the editorial **stamp + redaction** moments
(C) for the result/OG card. Ownable, hacker-credible, cheap to execute well, and the redacted-leak card is
the perfect shareable artifact. Whatever you pick: **monochrome + one alarm color; kill film grain + aurora;
replace decorative motion with *diegetic* motion** (text streaming, attacks running, stamp slamming).

## Launch / distribution sequence

- **Phase 0 — build the loop first** (OG card, README badge, "challenge a friend," brutal report,
  leaderboard, GitHub Action, offense/game mode). A launch without the card wastes the spike.
- **Phase 1 — build in public** on X (`#buildinpublic`, juicy breach examples) — starts now.
- **Phase 2 — Show HN** (Tue/Wed AM): *"Show HN: Gauntlet – I red-team your AI agent's system prompt
  with 50 prompt-injection attacks."* Lead with the outcome ("most prompts I test get an F"), link the
  no-signup demo, reply to every comment for 4 hours. Open-source the core first.
- **Phase 3 — r/netsec (monthly tool thread), r/programming, AI-safety X.** Lead with a *finding*, not a
  product: *"I scanned N popular GPTs' system prompts; here's how many leaked."* Get into
  `awesome-prompt-injection` / `awesome-llm-security`.
- **Phase 4 — one technical post** (Dev.to: "How we hardened our agent from F to A") + Product Hunt as a
  secondary spike. The README badge compounds after the launch fades.

**Hook hierarchy:** don't lead with "AI security scanner." Lead with the verdict + the dare:
*"Can your AI agent survive 50 prompt injections?"* / *"Most system prompts I test get an F."*

> Confidence note: the Gandalf metrics, SSL Labs/Observatory/Website Carbon mechanics, and the design
> references are well-sourced. The specific signup figures in growth blogs ("500–2,000 signups," "4×
> adopters") are directional rules of thumb, not guarantees.

## Sources
lakera.ai/blog/who-is-gandalf · gandalf.lakera.ai · Roast My Code: news.ycombinator.com/item?id=47204245 ·
ssllabs.com · developer.mozilla.org/observatory · websitecarbon.com/badge · shields.io ·
github.com/NVIDIA/garak · dev.to/jaainil/ai-purple-problem · prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website ·
setproduct.com/blog/complete-guide-to-blueprint-grid-design · nngroup.com/articles/neobrutalism ·
dev.to (automated OG image generation) · revenuefast.in/grow/developer-tool-first-1000-users
