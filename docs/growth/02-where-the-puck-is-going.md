# Where the Puck Is Going — the real 2026 problem

> Research stream 2 of 3. Source for the "what to aim Gauntlet at" call in `00-STRATEGY.md`.

The whole field moved one layer up the stack. **The interesting vulnerability is no longer
"can I jailbreak the model" — it's "can attacker-controlled content the agent *reads* make the
agent *act* / exfiltrate."** Single-turn "fire jailbreaks at a system prompt and watch a canary
leak" (Gauntlet today) is now *table stakes*. The frontier is the **data-flow + tool-call layer**.

## Three structural shifts

1. **Chatbots → agents with tools.** Once an LLM can call functions, browse, read email/docs,
   or talk to MCP servers, *untrusted data flows into a context that has capabilities.* The risk
   became "the model takes an action / exfiltrates data for an attacker who never authenticated."
2. **The "lethal trifecta" is now the field's organizing idea** (Simon Willison, Jun 2025):
   any system combining **(a) access to private data + (b) exposure to untrusted content +
   (c) ability to communicate externally** is exploitable — and you can't remove any leg without
   removing the point of the agent. HiddenLayer, Promptfoo, OWASP all argue in this vocabulary now.
3. **MCP turned it into a supply-chain problem.** Instructions hide in tool *descriptions* and
   JSON-schema field descriptions nobody reviews. Invariant found **~5.5% of public MCP servers
   already carry poisoned metadata.** New classes: indirect/cross-prompt injection, tool poisoning,
   confused-deputy, memory/context poisoning, multi-agent trust violations.

## Named incidents that scare people (reproduce baby versions of these)

- **EchoLeak — CVE-2025-32711, CVSS ~9.3 (M365 Copilot, Jun 2025).** First real-world **zero-click**
  prompt injection in production. A crafted *email* carried hidden instructions; when Copilot
  processed the inbox it exfiltrated chats/OneDrive/SharePoint — by emitting a **Markdown image
  whose URL embedded the stolen data**, which the browser auto-fetched. Zero clicks, pure text.
  The canonical "lethal trifecta realized."
- **ShadowLeak (ChatGPT Deep Research connector, Sep 2025).** *Service-side* exfiltration via
  white-on-white / microscopic-font instructions in an email — leaked from OpenAI's own infra,
  evading endpoint DLP.
- **Tenable's 7 ChatGPT bugs (Nov 2025):** zero-click via indexed sites, one-click via `?q=` URL,
  conversation injection, a Markdown-render concealment bug, and **persistent memory poisoning**.
- **The MCP breach wave (2025–26):** whatsapp-mcp tool-poisoning backdoor; GitHub MCP indirect
  injection leaking private repos; MCP Inspector RCE (CVE-2025-49596, CVSS 9.4); the Invariant
  PoC that made **Cursor read `~/.ssh/id_rsa`** via invisible-Unicode in a tool description.

The pattern across all of them: **an injection in content the agent merely *read* became an
*action* with the user's privileges.** That is the thing to test.

## What's forcing teams to test (standards & the deadline)

- **OWASP LLM Top 10 (2025):** LLM01 is *still* Prompt Injection; 2025 broadened to excessive
  agency + tool/plugin risk. Gauntlet already maps to LLM01/LLM06.
- **OWASP Top 10 for Agentic Applications (ASI01–ASI10), released 9 Dec 2025** — the new, very
  citable checklist and the best map for where to aim: ASI01 Goal Hijack, ASI02 Tool Misuse,
  ASI03 Identity/Privilege Abuse, ASI04 Agentic Supply Chain, ASI06 Memory/Context Poisoning, …
  Plus an emerging **MCP Top 10** (MCP03 = Tool Poisoning).
- **EU AI Act:** GPAI obligations live Aug 2 2025; **high-risk + transparency obligations + fines
  begin Aug 2 2026** — the date driving budget, inside our window.
- Net: *"we tested our agent against prompt injection" is moving from nice-to-have to audit artifact.*

## Underserved problems to own (ranked by pain × talkability × feasibility)

1. **Indirect / document-injection testing — "does your agent obey instructions hidden in the data
   it reads?"** ★ top pick. The attack behind EchoLeak/ShadowLeak/GitHub-MCP. Almost nobody can
   self-test it. *What to build:* an **"untrusted content" channel** — plant the canary inside a
   doc / tool result / email body, including real concealment (**white-on-white, zero-width Unicode,
   microscopic fonts, HTML comments, Markdown reference-links, fenced code**). Then check both
   (a) did the canary leak, and (b) **did the agent take the injected action** — emit a Markdown
   **image/link whose URL carries the canary** (the EchoLeak exfil signature). Detecting
   exfil-via-rendered-image deterministically is crisp, demoable, and unowned.
2. **"Lethal trifecta" exposure score for tool/MCP configs.** ★ viral hook. Ingest the agent's
   tool/function defs or MCP manifest; flag each leg (private-data / untrusted-input /
   external-comms) and output a red **"3/3 — exploitable"** verdict + the exact tool combo that
   completes the kill-chain. Bonus: **scan pasted MCP tool descriptions for hidden-instruction /
   invisible-Unicode payloads** — a 30-second "is this MCP server poisoned?" check.
3. **Multi-turn / memory-poisoning regression.** A stateful runner: split an attack across turns;
   plant an instruction in turn 1, start a fresh session, check if it re-fires (persistent
   contamination). Package as a CI regression artifact.
4. **Standards-mapped, shareable report** (cross-cutting amplifier): every run maps findings to
   OWASP LLM + Agentic ASI items, with a shareable scorecard URL and a pass/fail CI exit code.

**Don't chase:** full multi-agent orchestration red-teaming or MCP-server RCE fuzzing — low
feasibility for a small web tool, and Promptfoo/garak crowd the high end.

**Bottom line:** move Gauntlet from *"jailbreak my system prompt"* to *"prove my agent obeys
instructions hidden in the data and tools it touches — and exfiltrates."* Ship the
**indirect-content channel with EchoLeak-style image-exfil detection** first, then the
**lethal-trifecta / MCP-poisoning scorecard** as the viral hook. Both reuse the canary we already
have, both reproduce 2025–26 headlines on the user's own agent, both map to the brand-new OWASP
Agentic Top 10 — ahead of EU AI Act enforcement in Aug 2026.

## Sources
simonwillison.net/2025/Jun/16/the-lethal-trifecta · EchoLeak: hackthebox.com/blog/cve-2025-32711-echoleak…,
thehackernews.com/2025/06/zero-click-ai-vulnerability… · Tenable/ShadowLeak: thehackernews.com/2025/11/researchers-find-chatgpt…,
infosecurity-magazine.com/news/new-zeroclick-attack-chatgpt · MCP: authzed.com/blog/timeline-mcp-breaches,
owasp.org/www-project-mcp-top-10 · OWASP Agentic Top 10: genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026 ·
EU AI Act: artificialintelligenceact.eu/implementation-timeline · Promptfoo trifecta test: promptfoo.dev/blog/lethal-trifecta-testing
