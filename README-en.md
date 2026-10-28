# Claude UI Skills (`claude-ui-skills`)

<p align="center">
  <strong>open-claude-ui, distilled into 6 plug-and-play AI agent skills — so any coding agent can generate UI that genuinely feels like Claude.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/Caho1/open-claude-ui"><img src="https://img.shields.io/badge/distilled%20from-open--claude--ui-ea580c?logo=github" alt="Source: open-claude-ui" /></a>
  <img src="https://img.shields.io/badge/skills-6-ea580c" alt="6 skills" />
  <img src="https://img.shields.io/badge/assets-33%20production%20modules-ea580c" alt="33 modules" />
</p>

<p align="center"><a href="README.md">简体中文</a> · <strong>English</strong></p>

---

## What is this

[open-claude-ui](https://github.com/Caho1/open-claude-ui) reverse-engineered the Claude Desktop production bundle (via the REA framework) into 183 design tokens, 30+ production components, and a 3,000+ line analysis manual. But **manuals are written for humans** — a 10K-line handbook doesn't fit in an agent's context, and the load-bearing constraints (spring constants, IME guards, the single-border rule) drown in narrative.

This repo **distills it into 6 agent skills**: each is a <500-line enforceable contract (`SKILL.md`) + precise parameter handbooks (`references/`) + copy-ready production source (`assets/`). Install into Claude Code / ZCode / Cursor or any skill-aware agent, say *"build a Claude-style chat UI"*, and the agent will automatically follow:

- Clay `#d97757`, the Surface 0–3 low-contrast ladder, retina hairlines, dark-mode chamfer highlights — not neon blue/purple gradients
- Real spring physics (600/30, 320/28, 1200/80/0.1) and the 15-stop `linear()` button spring — not `transition: all .3s ease`
- The CJK IME 500ms false-Enter guard and the 150ms streaming scroll-pin cooldown — the two details that instantly give away an imitation
- The single-closed-border rule: assistant replies float borderless on the canvas; only user messages get bubbles

## The skills

| Skill | Triggers on | Assets |
| --- | --- | --- |
| **cds-foundation** | The base of any "Claude-style" UI: tokens, surface ladder, radius matrix, shadows, typography, dark mode | `cds-theme.css` (all 183 tokens), `cds-pure.css`, `tailwind.config.js` |
| **cds-motion** | Any animation: 4 spring presets, 10 bezier curves, duration tokens, 7-stop scroll-fade mask, keyframe library | `ClaudeMotionPresets.ts` |
| **cds-components** | Buttons / segmented controls / status dots / dialogs / attachment tiles / code blocks | 6 production components |
| **cds-chat** | Chat UIs: composer + IME guard, bubbles, thinking accordion, streaming grapheme reveal, token gauge, MCP approval cards | 10 components & hooks |
| **cds-media** | Sound synthesis, mic bars, lightbox pan/zoom, split panes, diffs, sandbox bridge, shared-element transitions | 7 modules |
| **cds-desktop** | Electron vibrancy windows, 74px traffic-light avoidance, sidebar drag-reorder, Cowork multi-agent, retry backoff | 9 modules |

> The distillation also fixes a label swap in the original manual's chapter-8 spring decision tree (SNAPPY/BOUNCY/GENTLE were mislabeled, and 380/18 is a self-built preset, not an observed Claude value) — the skills follow the forensic annotations in `ClaudeMotionPresets.ts`.

## Install

```bash
git clone https://github.com/<you>/claude-ui-skills.git
cd claude-ui-skills
./install.sh                 # all 6 skills → ~/.agents/skills
./install.sh ~/.claude/skills cds-foundation cds-chat   # custom target + subset
```

Windows PowerShell: `./install.ps1 -Target "$env:USERPROFILE\.claude\skills"`

Or copy `skills/<name>/` manually into your agent's discovery path: `~/.claude/skills/` (Claude Code), `~/.zcode/skills/` (ZCode), or the cross-tool standard `~/.agents/skills/`.

**Verify**: ask your agent for "a Claude-style chat interface with a composer and message bubbles" — the result should use `var(--cds-surface-*)`, the clay accent, a 20px-radius composer, and the IME guard.

## Attribution & compliance

- Derivative distilled work of [open-claude-ui](https://github.com/Caho1/open-claude-ui) (© Caho1, MIT); every asset keeps its provenance header. Reverse engineering by [REA](https://github.com/morluto/rea), evidence baseline Claude Desktop `@ant/desktop v2.37337.1`.
- No proprietary binaries (fonts/audio) are distributed — system font fallback stacks and Web Audio oscillator synthesis only.
- Not affiliated with Anthropic. "Claude Design System" refers to clean-room reverse-engineering findings of the public client.

## License

MIT — see [LICENSE](LICENSE).
