# Claude UI Skills (`claude-ui-skills`)

<p align="center">
  <strong>把 open-claude-ui 蒸馏成 6 个即插即用的 AI Agent Skills——让任何编码智能体一次生成「像 Claude 的 UI」。</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/Caho1/open-claude-ui"><img src="https://img.shields.io/badge/distilled%20from-open--claude--ui-ea580c?logo=github" alt="Source: open-claude-ui" /></a>
  <img src="https://img.shields.io/badge/skills-6-ea580c" alt="6 skills" />
  <img src="https://img.shields.io/badge/assets-33%20production%20modules-ea580c" alt="33 modules" />
</p>

<p align="center"><strong>简体中文</strong> · <a href="README-en.md">English</a></p>

---

## 这是什么

[open-claude-ui](https://github.com/Caho1/open-claude-ui) 基于 REA 逆向框架对 Claude Desktop 生产包做了全量取证，产出了 183 个设计令牌、30+ 个生产级组件和 3000+ 行逆向分析手册。但**文档是给人读的，AI 编码智能体用不好它**——10K 行手册塞不进上下文，关键约束（弹簧参数、IME 守卫、单闭合边框）会淹没在叙事里。

本仓库把它**蒸馏（distill）成 6 个 Agent Skills**：每个 skill 是一份 <500 行的强制契约（SKILL.md）+ 精确参数手册（references/）+ 可直接复制的生产源码（assets/）。装进 Claude Code / ZCode / Cursor 等任何支持 skills 的智能体后，你说「做一个 Claude 风格的聊天界面」，智能体就会自动遵守：

- 陶土色 `#d97757`、Surface 0–3 微对比阶梯、发丝细边与暗色倒角高光——而不是蓝紫渐变
- 真实弹簧物理（600/30、320/28、1200/80/0.1）与 15 阶 `linear()` 按钮弹簧——而不是 `transition: all .3s ease`
- CJK 输入法 500ms 防误发守卫、流式滚动 150ms 防抢夺图钉——这两点是中文用户一眼识破"仿货"的地方
- 单闭合边框原则：助手回复无边框裸奔画布，用户消息才进气泡

## Skills 一览

| Skill | 触发场景 | 内含资产 |
| --- | --- | --- |
| **cds-foundation** | 任何「Claude 风格」UI 的地基：令牌、表面阶梯、圆角矩阵、阴影、排版、暗色模式 | `cds-theme.css`（全量 183 令牌）、`cds-pure.css`、`tailwind.config.js` |
| **cds-motion** | 一切动效：4 套弹簧预设、10 条贝塞尔、时长令牌、7 档滚动渐隐遮罩、关键帧库 | `ClaudeMotionPresets.ts` |
| **cds-components** | 按钮/分段控件/状态灯/对话框/附件磁贴/代码块 | 6 个生产组件 |
| **cds-chat** | 聊天界面：Composer+IME 守卫、气泡、思考折叠、流式图元晕染、Token 仪表、MCP 授权卡 | 10 个组件与 Hook |
| **cds-media** | 音效合成、麦克风波形、灯箱 Pan/Zoom、分屏、Diff、沙箱桥、共享元素变形 | 7 个模块 |
| **cds-desktop** | Electron 毛玻璃窗口、74px 红绿灯避让、侧栏拖拽、Cowork 多 Agent、退避重试 | 9 个模块 |

> 蒸馏过程中修正了原手册第 8 篇弹簧决策树的标注错误（SNAPPY/BOUNCY/GENTLE 错位，且 380/18 并非 Claude 观测值而是自建预设）——skills 以源码 `ClaudeMotionPresets.ts` 的取证注释为准。

## 安装

### 方式一：脚本安装（推荐）

```bash
git clone https://github.com/<you>/claude-ui-skills.git
cd claude-ui-skills

# 装全部 6 个 skill 到 ~/.agents/skills（跨工具标准位置）
./install.sh

# 或指定目录 / 只装部分
./install.sh ~/.claude/skills cds-foundation cds-chat
```

Windows PowerShell：`./install.ps1 -Target "$env:USERPROFILE\.claude\skills"`（默认装到 `~/.agents/skills`）

### 方式二：手动复制

把 `skills/` 下你需要的目录复制到智能体的 skill 发现路径：

| 智能体 | 路径 |
| --- | --- |
| Claude Code | `~/.claude/skills/<name>/`（全局）或项目 `.claude/skills/` |
| ZCode | `~/.zcode/skills/` 或项目 `.zcode/skills/`（高优先级） |
| 跨工具标准 | `~/.agents/skills/<name>/` |

### 验证

对智能体说：「做一个 Claude 风格的聊天界面，要有输入框和消息气泡」——它应该自动触发 cds-foundation + cds-chat，生成的代码里出现 `var(--cds-surface-*)`、陶土色、20px 圆角 Composer 和 IME 守卫。

## 使用建议（给智能体的提示词示例）

```
帮我做一个 AI 聊天应用前端，要和 Claude 桌面端一样的质感（陶土色、微对比表面、物理弹簧动效），
深浅双主题，输入框要防中文输入法误发送。
```

无需点名 skill——描述里带「Claude 风格 / CDS / 陶土色 / 物理动效」等关键词即会触发。做纯视觉页面只需 cds-foundation；一旦有交互动效会叠加 cds-motion；聊天流叠加 cds-chat。

## 目录结构

```
claude-ui-skills/
├── skills/
│   ├── cds-foundation/      # 设计哲学 + 令牌契约
│   │   ├── SKILL.md         #   <500 行强制规范
│   │   ├── references/      #   参数速查手册（按需加载）
│   │   └── assets/          #   cds-theme.css / cds-pure.css / tailwind.config.js
│   ├── cds-motion/          # 动效物理引擎
│   ├── cds-components/      # 原子组件
│   ├── cds-chat/            # 会话核心流
│   ├── cds-media/           # 视听媒体物理
│   └── cds-desktop/         # 桌面宿主架构
├── install.sh / install.ps1
├── README.md / README-en.md
└── LICENSE
```

## 合规与致谢

- 本仓库是 [open-claude-ui](https://github.com/Caho1/open-claude-ui)（© Caho1，MIT）的蒸馏衍生作品；所有 assets 源码保留原仓库归属头。原始逆向工程由 [REA (Reverse Engineer Anything)](https://github.com/morluto/rea) 完成，取证基线为 Claude Desktop `@ant/desktop v2.37337.1`。
- 不分发任何专有二进制资产（字体/音频）；skills 全部使用系统字体回退栈与 Web Audio 纯代码合成音效，自包含合规。
- 本项目与 Anthropic 无官方关联；"Claude Design System" 之描述指对公开客户端的 clean-room 逆向分析结论。

## License

MIT——见 [LICENSE](LICENSE)。
