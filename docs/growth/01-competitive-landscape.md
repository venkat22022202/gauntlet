# Competitive Landscape — AI/LLM Security Testing (2025–2026)

> Research stream 1 of 3. Source for the positioning calls in `00-STRATEGY.md`.

The market split into three tiers while we were building. Knowing which tier we're
actually in is the whole game — and the answer is "almost none of them."

## Landscape

| Player | What it is | Target | OSS / $ | Distribution hook |
|---|---|---|---|---|
| **Lakera (Gandalf)** | Runtime guardrail API + the viral Gandalf hacking game | Enterprise / everyone | Commercial; Gandalf free. $20M Series A (2024) | **Gandalf** — best distribution hook in the category. Game → list → enterprise sales |
| **Promptfoo** | OSS local eval + red-team CLI, CI/CD gates | Indie dev → enterprise | OSS (MIT). **Acquired by OpenAI (~Mar 2026)**. ~300k users | GitHub stars + "used by OpenAI/Anthropic" + dev-first docs |
| **NVIDIA garak** | OSS LLM "vulnerability scanner" / probe library | Researchers, ML eng | OSS, free | GitHub + NVIDIA brand. The "nmap for LLMs" (~7k stars) |
| **Microsoft PyRIT** | OSS framework to *build* red-team orchestrations | Enterprise red teams | OSS, free | Microsoft AI Red Team brand |
| **HiddenLayer** | Enterprise AISec platform | CISO | Commercial; $50M Series A | Largest AI-sec Series A; analyst-led |
| **Robust Intelligence** | AI app firewall + validation | Enterprise | **Acquired by Cisco (~$400M)** | Now Cisco AI Defense |
| **Protect AI** (owned **Rebuff**) | ML/AI lifecycle security | Enterprise | **Acquired by Palo Alto (Jul 2025)**. **Rebuff archived May 2025** | Now Palo Alto GTM |
| **CalypsoAI** | Inference guardrails + red-team | CISO | **Acquired by F5 ($180M)** | Now F5 GTM |
| **SplxAI / Repello / Mindgard / Lasso** | Automated enterprise red-teaming | AppSec | Commercial, seed–A | Sales-led + content + marketplaces |
| **Meta LlamaFirewall** | OSS agent guardrail (defense, not red-team) | Devs | OSS, free | Meta brand. *Already publicly bypassed* with invisible-Unicode injection |
| **Free "tester" tools** (AI Dev Hub, PromptShield, SafePrompt) | Browser prompt scorers | Indie devs | Free | SEO + "no signup" — **our closest lookalikes…** |

## What's hot & funded

- **2024–26 was an M&A bonfire.** OpenAI bought Promptfoo; Palo Alto bought Protect AI;
  Cisco bought Robust Intelligence (~$400M); F5 bought CalypsoAI ($180M). The enterprise
  platform tier is consolidating into the big incumbents.
- **The obvious "free dev tool" lane just got an owner** (OpenAI/Promptfoo) with infinite
  distribution. We cannot win the enterprise-CI lane head-on.
- **Runtime guardrails went free** (Meta LlamaFirewall, Invariant) — but those are
  *defenses*, not attack tools, and LlamaFirewall has already been bypassed (good fodder).

## Why Gandalf went viral (the playbook to copy)

- **One-sentence goal anyone gets in 2 seconds**: "trick the AI into revealing the password."
- **Clean binary, screenshot-able win condition** — you got it or you didn't. *(This is our
  canary-token judge, except we built it as a real test, not a game.)*
- **7 escalating levels + a brutal stat** ("only ~8% beat level 7") — the stat is the share-bait.
- **Numbers:** ~9M interactions from 200k+ unique users in ~3 weeks; 1M+ players by 2024;
  the captured prompts became the dataset that powers Lakera's paid product and was
  *explicitly credited as the engine behind its $20M Series A*.

We have the harder half (a real attack engine + deterministic judge). We're missing the
**shareable, competitive, screenshot-able loop**.

## The white space for Gauntlet (ranked)

1. **"Test the prompt I actually wrote, against the model I actually use, right now."**
   The free lookalikes are *client-side regex scorers — they never call an LLM*. The serious
   tools that fire real attacks (Promptfoo, garak, PyRIT) need install + CLI. **Nobody owns
   "paste prompt → point at your endpoint → watch real attacks breach a live model → get
   transcripts, no install, no signup."** Own the words **"real attacks, real model, no install."**
2. **The deterministic canary judge as a *trust* wedge.** Most tools use a fuzzy "LLM-as-judge"
   devs distrust. Our canary mechanic is objectively verifiable — and **Rebuff, the one known
   canary tool, was archived May 2025**, leaving the concept ownerless.
3. **The shareable virality loop** — we have Gandalf's tool but not Gandalf's loop.
4. **"Harden, don't just scan"** — breach → exact transcript → suggested prompt patch → instant
   re-test. The free tools stop at a score; the paid ones gate remediation behind sales.
5. **Agent / tool-call / indirect injection**, not just chatbot prompt leaks (see doc 02).
6. **Distribution:** be the OWASP-aligned, "link-in-a-tweet" default.

**Don't:** chase runtime guardrails, chase the CISO/platform sale, or try to out-coverage
garak/Promptfoo on attack count. Our edge is **speed-to-first-breach, deterministic trust,
and shareability** — Gandalf's growth engine pointed at real production prompts.

## Sources
Lakera/Gandalf: lakera.ai/blog/who-is-gandalf · techcrunch.com/2024/07/24/lakera-…-raises-20m ·
Promptfoo: promptfoo.dev/pricing · openai.com/index/openai-to-acquire-promptfoo ·
garak: github.com/NVIDIA/garak · LlamaFirewall: ai.meta.com/research/publications/llamafirewall ·
bypass: medium.com/trendyol-tech/bypassing-metas-llama-firewall · M&A: paloaltonetworks.com,
cisco.com (Robust Intelligence), respan.ai (CalypsoAI/F5) · Rebuff: github.com/protectai/rebuff ·
free lookalikes: aidevhub.io/ai-prompt-injection-tester, promptshield.bithost.in ·
OWASP: genai.owasp.org
