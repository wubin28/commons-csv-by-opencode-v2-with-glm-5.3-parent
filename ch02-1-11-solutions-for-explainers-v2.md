# ch02-1-11 Explainer 方案与提示词 v2（4 集全部使用"我的声音"克隆配音）

> - **代码锚**：`./commons-csv` 分支 **`ch02-after`**（`24562da2fff56fefd61ec8f6ce352632fb301957`，即 `ch02-1-2`/`ch02-1-3` 的行号锚；当前工作区已在该分支、工作区干净，2026-10-21 实测）。本文件所有行号均在该分支逐一实测核对。
> - **配套**：v1 方案见 `ch02-1-6-solutions-for-explainers-v1.md`（本文件 = v1 ＋"我的声音"配音改造，其余逐字未动）；"我的声音"换声工艺与质量决策见 `ch02-1-8-dialogs-for-using-my-voice-for-explainer-A2.md`；v2 决策对话见 `ch02-1-10-dialogs-for-solutions-for-explainers-v2.md`；帧样式样张见 `ch02-1-6-sample-frame-A2.png`（1920×1080，按 §3 规格渲染）。
> - **工具链事实**（均实测）：ffmpeg 8.1.1（**无 libass/drawtext**，字幕须 Pillow 画帧）；Pillow 12.1.1 + 系统字体 Menlo / SF Mono / Hiragino Sans GB 可加载（PingFang 已不可按路径加载）；Maven 3.9.16 + JDK 21；**声音克隆**：Qwen3-TTS 1.7B Base 8bit（MLX-Audio，Metal GPU 可用）+ faster-whisper small，全本地离线，位于本机 Movies 目录（路径见每份提示词的"依赖文件和目录"清单；A2 集已端到端验证）。
> - **与 v1 的关系**：v1 的方案选型、画面规格、站点表、验收框架全部沿用；本文件只把"配音"从 edge-tts 换成"我的声音"克隆，并按需加入占位符与依赖清单。v1 已产出的两版 A2 视频（edge-tts 版、两步换声版）与 `explainer-artifacts/A2/` 保持原样，本方案不再触碰。

---

## 0. 已审批的决策速览

### 0.1 沿用 v1 的决策（未变，全文见 ch02-1-6 §0）

| 决策 | 结论 |
| --- | --- |
| 优先理解的 4 个测试 | **A2 / B1 / C1b / D1**（理由见 §0.3） |
| explainer 深度 | **调试预习演**：顺序地图骨架 + 每集 2–3 个运行时快照 + 每帧"路径:行号"角标与断点红点 |
| 主方案 | **方案一「逐调用点分镜 · 代码剧场」**，4 集统一 |
| 字幕/画面 | 深色主题；字幕 Hiragino Sans GB 40px、黄色 `#FFEB3B`、无背景色（2px 深色描边）；代码字体 Menlo（与 VS Code 一致） |
| 观看姿势 | 分屏边看边在 VS Code 对照（→ 1080p、大字号、每帧 ≤16 行） |
| 时长 | 每集硬上限 **180 秒** |
| 片头/片尾 | 4 集统一模板（标题板/断点清单板，含对 ch02-1-2/1-3 的互引） |
| 变量快照 | 右上角"变量监视盒"（IDE watch 风格） |
| 版本锚 | **`ch02-after` 分支**（= ch02-1-2/1-3 行号锚；VS Code 请切到该分支再对照） |

### 0.2 v2 新增/变更的决策（本次对话审批，记录见 ch02-1-10）

| 决策 | 结论 | 审批 |
| --- | --- | --- |
| 配音 | **"我的声音"克隆**（Qwen3-TTS Base 8bit + MLX-Audio，本地离线；替换 v1 的 edge-tts 晓晓） | Round 0（Q0） |
| 配音管线 | **一步到位**：写讲解词 → 逐段克隆合成 → dwell = 克隆时长 + 0.3s（下限 3.0s）→ 渲帧 → 合成；**edge-tts 从提示词中彻底移除** | Round 0（Q0a） |
| 输出文件名 | B1/C1b/D1 **沿用 v1 原名**；A2 = `ch02-1-11-explainer-A2-my-voice.mp4`（与既有两版并存，不覆盖） | Round 0/1（M2、Q1a） |
| 占位符 | 每段提示词只标两类：`{{VOICE_REFERENCE_WAV}}`（我朗读的原声）与 `{{OUTPUT_VIDEO}}`（输出文件名），均新起一行并附"本次实际使用"值 | Round 0/1（M1） |
| 依赖清单 | 每段提示词内置"依赖文件和目录"三组清单（A 声音链路 / B 本仓库 / C 系统级备查），开工前逐一自检 | Round 1（Q2a） |
| 工具链缺失行为 | **停工报告等裁决**（按指南重建需下载约 3.6G，须经我确认）；全程禁止悄悄换任何其他 TTS | Round 1（Q3a） |
| 试听关卡 | **不设样段试听**（A2 集已人耳验证过音色与英文读音），一次到底 + 停工保险丝 | Round 0（M5） |
| 声音质量口径 | 响度 **-16 LUFS / -1.5 dBTP / LRA 9**；faster-whisper 逐段筛查相似度 **≥0.70**（**短** initial_prompt＋无 prompt 兜底——长 prompt 曾致假阴性停工）；seed=42+段号；讲解词**双文本**（字幕文本/发音文本） | 继承 ch02-1-8（Q1a/Q2b/Q3a） |
| 参考实现 | 允许且**建议**引用 `explainer-artifacts/A2/my-voice/` 已验证脚本（只读，复制后改造到各自产物目录） | Round 0（M4） |
| A2 集定位 | 与 B1/C1b/D1 **同构**的一步式复现路径；中间产物入新建子目录 `explainer-artifacts/A2/v2/`，不碰既有 `A2/` 内容 | Round 0/1（M6、Q1a） |

### 0.3 四个优先测试及入选理由（摘要，未变，全文见 ch02-1-5 Round 1）

| 组 | 测试（方法名 / 测试文件行号） | 入选理由（与 `setRequiredHeaders` 的相关度） |
| --- | --- | --- |
| A | **A2** `autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`（:85） | 需求主链路：上游对账 CSV 首行为表头 = 自动探测链；完整穿过将来校验插入点 `createHeaders()`（635→637→672），且是 A 组最长主干，其余 A 组测试皆其变奏 |
| B | **B1** `getByNameWithUnknownNameThrowsMappingNotFound`（:143） | 需求要替换的"晚失败"痛点本尊：`Mapping for currency not found` 正是 `CSVRecord.java:137` 这条；看懂它=看懂需求为什么存在 |
| C | **C1b** `duplicateFileHeaderWithDisallowThrowsAtParserCreation`（:210） | ch02-1-3 标注"本热身最关键的一个测试"：`parse()` 调用本身抛错、数据行从未被读——"读第一条记录之前报错"的现成先例，`setRequiredHeaders` 照此时机做 |
| D | **D1** `headerNameWithSurroundingSpacesNeedsExactMatch`（:260） | 直接决定 required 的匹配语义：现状精确匹配不 trim；若校验 trim 而取值不 trim，会"校验过了、`get` 取不到"——新功能必须显式决策的唯一语义点 |

### 0.4 v1 → v2 变更摘要（只列"变了什么"，未列出的即逐字未变）

| 位置（每段提示词内） | v1 | v2 |
| --- | --- | --- |
| 任务句 | 无声音要求 | 增一句"配音全程使用**我的声音**（本地克隆，禁止任何其他 TTS）" |
| 硬约束 2 | 输出名写死 | 改为占位符行：`{{OUTPUT_VIDEO}}（本次实际使用：<v1 原名 / A2 新名>）` |
| 硬约束 5 | 中间产物 frames/audio/narration.md/脚本/日志 | 增逐段克隆 WAV、缓存签名、`report.json`；A2 集改入新建子目录 `A2/v2/` |
| 硬约束 6 | 不动既有 `ch02-*.md`、`ch02-1-6-*.png` | 增：两版 A2 成片与 `explainer-artifacts/A2/` 全目录只读 |
| 硬约束 7（新增） | — | 声音工具链原地复用；开工自检依赖清单，缺失即停工报告；禁止任何其他 TTS |
| 依赖文件和目录（新增一节） | — | A/B/C 三组清单（含 `{{VOICE_REFERENCE_WAV}}` 占位行） |
| 配音节 | edge-tts 安装命令、晓晓语音、联网失败处理 | 现成声音档案、双文本、`VoiceEngine` 参数、dwell 公式、whisper 筛查、响度目标、失败停工 |
| 合成管线 | mp3 → `apad` 24kHz 串接 | 克隆 WAV → whisper 筛查 → `apad` 48kHz 串接 → 整体响度归一 |
| 验收 | 四项 | **五项**（增第 5 项"声音"）；交付报告增双文本全文与逐段相似度表 |
| 其余（视频形态、分镜站点表、真实运行结果帧、页脚 `ch02-1-6 · <ID>` 标识） | — | **逐字未变**（页脚沿用 ch02-1-6 标识 = 帧样式规格出处，属"其他不变"） |

---

## 1. 三个候选方案（未变，与 v1 相同）

### 1.1 方案一「逐调用点分镜 · 代码剧场」（主方案）

- **特点**：把该测试触发的调用链拆成 8–14 个"站点"，每站一帧：深色代码截屏（该行 ±7 行上下文、当前行高亮带、建议断点红点）、顶部"路径 · 方法 · 第 n/N 站"角标、右上角变量监视盒（每集 2–3 次更新）、底部黄色字幕；每站一段配音，帧停留时长 = 配音时长 + 0.3s（下限 3s）。每集结构：统一片头标题板（约 8s：场景编号+测试名+一句话目标+文档互引）→ 测试代码全貌帧（标出全部站点）→ 逐站点分镜 → 真实运行结果帧（worktree 里实测 mvn 输出）→ 邻居彩蛋帧 → 片尾"建议断点清单 + 互引"板（约 10s）。
- **独特优势**：唯一同时满足"顺序真实、路径:行号锚点、≤3 分钟、分屏可读、纯静态帧合成"五个硬约束的方案；帧与配音分段一一对应，改一帧只重合成该段，增量改版成本最低。
- **主要劣势**：画面静态、无运镜，吸引力完全靠配音与节奏；对"想看动态数据流动"的观众略显干燥。
- **适用场景**：以"看完之后亲手单步调试"为目标的预习（本任务）；任何调用链 ≤15 站的方法级代码走查。
- **不适用场景**：算法/数据结构的动态过程可视化；跨多文件的大范围架构巡览（帧数爆炸）；需要公开课级视觉炫技的场合。

### 1.2 方案二「终端实录混剪 · 证据先行」

- **特点**：每集先放真实运行帧（终端样式渲染的 mvn 输出、绿条、异常栈），"先见结果、再讲机制"；代码走查帧之间穿插 2–3 个终端帧（如打印 `headerMap` 的实际输出）。
- **独特优势**："实证感"最强——每个结论先给运行证据再讲源码，最贴合特征测试"先观察后固化"的精神。
- **主要劣势**：终端帧信息密度低、需停留 5–8 秒才读得完，挤占 3 分钟预算；"结果—机制—结果"两段式叙事削弱调用顺序的连贯地图感。
- **适用场景**：怀疑"文档/直觉 vs 实际行为"是否一致时的验证型讲解；给评审者看"这真的是跑出来的"。
- **不适用场景**：时长紧、以建立调用顺序记忆为首要目标时（本任务即此）。

### 1.3 方案三「IDE 调试器伪录屏 · 同构预习」

- **特点**：用 Pillow 仿画 VS Code 调试会话界面：调用栈面板、断点红点、悬浮变量提示、逐帧 step over/into——看起来像调试器录屏，实为渲染帧序列。
- **独特优势**：与"之后自己在 VS Code 单步调试"的界面完全同构，预习迁移最直接；变量面板天然承载运行时快照。
- **主要劣势**：仿 UI 工作量最大、细节最易穿帮（与真实 VS Code 的像素级差异反而造成记忆错位）；侧栏挤占代码区，每帧行数最少；生成管线最重、增量改版最贵。
- **适用场景**：已熟悉 VS Code 调试面板、想精确预习"按 F5 之后每一步会看到什么"的人。
- **不适用场景**：分屏观看（代码区太小）；追求一次生成成功率与低成本改版时（本任务即此）。

---

## 2. 推荐方案及理由（未变，仅第 2 点的配音表述更新）

**推荐：方案一「逐调用点分镜 · 代码剧场」，4 集统一采用。**

1. **唯一满足全部已确认硬约束**：调试预习演（顺序骨架 + 少量快照 + 行号锚点）、≤180s、分屏可读（1080p 大字号 ≤16 行/帧）、深色+黄色无底字幕、监视盒、自动验收——方案二受限于时长预算，方案三受限于每帧行数与生成稳定性。
2. **管线最简、一次成功率最高**：Pillow 渲帧 ＋ Qwen3-TTS 克隆"我的声音"分段配音（A2 集已在本机端到端实测通过）＋ ffmpeg 拼装，三个环节均离线可控（含"无 libass → 字幕画帧"的绕行方案）。
3. **能吸收另两案的精华，反之不能**：方案一在片头后安排"真实运行结果帧"（取自方案二的实证精神）、保留断点红点与变量监视盒（取自方案三的调试器同构感）；而方案二补不回顺序连贯性，方案三补不回行数与稳定性。

---

## 3. 主方案制作规格（4 份提示词的公共基底）

- **帧布局**（1920×1080，样张 `ch02-1-6-sample-frame-A2.png`）：
  - 顶栏（高 78px）：左=等宽字体 `文件路径 · 方法名`；右=中文 `<ID> <场景名> · 第 n/N 站`；
  - 代码区：Menlo 30px、行距 52px、±7 行上下文、每帧 ≤16 行；行号列右对齐 SF Mono 28px；
  - 当前行：整行高亮带 `#264F78` + 左侧黄色三角 + 行号前红色圆点（= 建议断点）；
  - 右上角变量监视盒：圆角深色面板（`#252526`、边框 `#3F3F46`），SF Mono 25px 显示变量值，中文小字标注快照时刻；
  - 字幕：Hiragino Sans GB 40px、`#FFEB3B`、2px `#141414` 描边、**无背景块**、底部居中（y≈1006）；
  - 页脚：左下 `frame k/M · dwell <秒>`，右下 `ch02-1-6 · <ID> · ch02-after (24562da2)`。
- **字体路径**（本机实测可加载）：Menlo=`/System/Library/Fonts/Supplemental/Menlo.ttc`；中文=`/System/Library/Fonts/Hiragino Sans GB.ttc`；等宽 UI=`/System/Library/Fonts/SFNSMono.ttf`。
- **配音（v2 变更点）**："我的声音"克隆（Qwen3-TTS Base 8bit + MLX-Audio，本地离线，复用 Movies 目录现成声音档案与 venv，A2 集已验证）；每站一段；讲解词双文本（字幕文本/发音文本），正文 400–550 字（各集范围见提示词）；dwell = max(克隆时长 + 0.3s, 3.0s)；响度 -16 LUFS / -1.5 dBTP / LRA 9；faster-whisper 逐段筛查 ≥0.70。
- **合成（v2 更新）**：变长帧 concat demuxer（每帧 `duration`，末帧重复一次）＋ 每段克隆 WAV `apad=whole_dur=<该站时长>`、48kHz 单声道统一规格后串接、整体响度归一 → `ffmpeg -f concat -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy out.mp4`。
- **验收五项**：① `ffprobe` 时长 ≤180s 且 h264+aac、音轨响度达标；② 抽 3 个代码帧重读 `git show ch02-after:<path>` 对应行逐字符比对；③ 每站停留 ≥3.0s、Σ停留与总时长差 ≤0.5s；④ 存 3 张样张 PNG 到 `explainer-artifacts/<ID>/review/`（A2 集为 `A2/v2/review/`）；⑤ 声音：逐段 whisper 相似度 ≥0.70 且克隆参数四集一致。
- **中间产物**：`explainer-artifacts/<ID>/`（A2 集为 `A2/v2/`）：`frames/`、`audio/`（含逐段克隆 WAV 与缓存）、`narration.md`（双文本）、`report.json`、生成脚本、构建日志。

---

## 4. 四份提示词（每份独立自包含，可分别复制粘贴给新会话的 agent；配音均为"我的声音"克隆）

> 使用方式：在**本工作目录**（`/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3`）打开 agent，一次粘贴一份。建议顺序：A2 → B1 → C1b → D1。每份提示词自带：输出名占位符（硬约束 2）、"依赖文件和目录"自检清单、ch02-1-8 已验证的配音工艺。路径将来有变时，只需替换占位符行（`{{VOICE_REFERENCE_WAV}}` / `{{OUTPUT_VIDEO}}`）。

### 4.1 提示词 A2（表头从哪来：自动探测链）

````markdown
任务：为 commons-csv 的特征测试 A2（`HeadersCharacterizationTest$HeaderSources#autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。配音全程使用**我的声音**（本地克隆合成，见"配音"与"依赖文件和目录"两节；禁止任何其他 TTS）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉（worktree 别放仓库和当前工作目录里）。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录，输出文件名：
   {{OUTPUT_VIDEO}}（本次实际使用：`ch02-1-11-explainer-A2-my-voice.mp4`）
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到**新建子目录** `./explainer-artifacts/A2/v2/`（`frames/`、`audio/`（含逐段克隆 WAV 与缓存签名）、`narration.md`（双文本）、`report.json`、生成脚本、构建日志）；不要写入 `./explainer-artifacts/A2/` 下的任何既有内容。
6. 除视频和 `explainer-artifacts/A2/v2/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md`、`ch02-1-6-*.png`、两版 A2 成片（`ch02-1-6-explainer-A2-auto-detected-header.mp4`、`ch02-1-6-explainer-A2-my-voice.mp4`）及 `explainer-artifacts/A2/` 全目录（其中 `my-voice/` 脚本只可复制后改造）。
7. 配音必须是"我的声音"：用下方"依赖文件和目录"A 组的本地克隆工具链**原地复用**（不复制模型、不重建 venv、不改动旧项目任何文件）合成；开工前先逐一自检该清单各项存在，任一缺失 → **停工报告**（说明缺什么；按操作指南重建需下载约 3.6G，须经我确认后才可进行）；全程**禁止使用任何其他 TTS**（含 edge-tts、macOS `say`）。

## 依赖文件和目录（开工前逐一自检存在；本提示词的全部外部依赖，勿删改）
- **A. 声音克隆链路**（"我的声音"的来源与合成工具，误删风险最高、恢复代价最大）：
  - 我朗读的原声（声音参考源，占位符）：
    {{VOICE_REFERENCE_WAV}}（可以使用 `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/朗琴园 8.m4a`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/voice/`（现成声音档案：`profile.json` + `reference.wav`（11.29s，取自上述原声 00:06.55–00:17.84）+ `reference.txt`；**直接使用，勿改**；仅当档案缺失需重建时才会直接用到上面的原声）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/clone.py`（`VoiceEngine`，及其引用的模型/档案常量）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/.qwen3-tts/`（`.venv` 运行环境 + `models/qwen3-tts-1.7b-base-8bit`（2.9G）+ `models/whisper-small` + `cache/`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/Qwen3-TTS_本机音色克隆操作指南.md`（环境/档案缺失时按此重建——但须先停工报告）
- **B. 本仓库**（当前工作目录）：
  - `./commons-csv`（代码锚：分支 `ch02-after` = `24562da2…`）
  - `./explainer-artifacts/A2/my-voice/`（已验证参考实现：`make_my_voice_video.py`、`verify_my_voice.sh`、`README.md`；**只读，复制到 `A2/v2/` 后改造**）
- **C. 系统级**（系统/homebrew 自带，误删风险低，列出备查）：
  - `/opt/homebrew/bin/ffmpeg`、`/opt/homebrew/bin/ffprobe`
  - 字体：`/System/Library/Fonts/Supplemental/Menlo.ttc`、`/System/Library/Fonts/Hiragino Sans GB.ttc`、`/System/Library/Fonts/SFNSMono.ttf`

## 视频形态（1920×1080，深色底 #1E1E1E）
- 结构与时长：片头标题板(~8s) → 测试全貌帧 → 逐站点分镜 → 真实运行结果帧(~6s) → 彩蛋帧(~8s) → 片尾断点清单板(~10s)。若总长超 180s：先压彩蛋/全貌停留，再合并相邻同类站点，不得删带 ★ 的断点站点。
- 每个站点一帧：该行 ±7 行上下文；当前行整行高亮带 `#264F78` + 行号前红色圆点（建议断点）；顶栏左 `src/.../CSVParser.java · createHeaders()`（等宽 SF Mono 25px #9DA0A6），右 `A2 自动探测表头 · 第 n/N 站`（中文 26px #4EC9B0）；右上"变量监视盒"（圆角面板 #252526/边框 #3F3F46，SF Mono 25px，值用 #9CDCFE，只在站点表标注时更新）；底部字幕。
- 字幕：Hiragino Sans GB 40px、#FFEB3B、2px #141414 描边、无背景块、居中（y≈1006）。
- 代码 Menlo 30px（#D4D4D4，注释 #6A9955，行号 #6E7681，行距 52px，每帧 ≤16 行）。
- 字体路径（实测可加载）：Menlo=/System/Library/Fonts/Supplemental/Menlo.ttc；中文=/System/Library/Fonts/Hiragino Sans GB.ttc；SF Mono=/System/Library/Fonts/SFNSMono.ttf。
- 本机 ffmpeg 8.1.1 **无 libass/drawtext**：字幕必须用 Pillow 画进帧。
- 页脚：左下 `frame k/M · dwell <s>`，右下 `ch02-1-6 · A2 · ch02-after (24562da2)`。
- 片头标题板：`第 A2 集 · autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`；场景：`setHeader()` 无参自动探测文件首行为表头（文档推荐组合）；目标：看懂"表头世界"在解析器构造期如何建立；`详见 ch02-1-2 §A组 · ch02-1-3 §2.A2`。
- 片尾断点清单板：`CSVParser.java:637 / :672 / :682 · CSVFormat.java:2207 · 测试:HeadersCharacterizationTest.java:85`，附一句"下一步：VS Code（分支 ch02-after）单步调试本测试"。

## 配音（"我的声音"克隆，本地离线；禁止任何其他 TTS）
- 声音参考 = 依赖清单 A 组的 `{{VOICE_REFERENCE_WAV}}`；**直接使用现成声音档案** `…/qwen-voice/voice/`（由我的朗读原声构建），不要重新裁剪参考音频；档案缺失 → 按硬约束 7 停工。
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 400–500 字；片头板配总起一句、片尾板配总结一句。
- **双文本**（沿用 A2 已验证做法）：每段写两份——字幕文本（烧进画面帧）与发音文本（供克隆引擎；数字、行号、`:637` 等可展开成可读说法）；两份语义一致，`narration.md` 同时保存两列。
- 合成（全部本地离线）：用 `.qwen3-tts/.venv/bin/python`，`sys.path` 加入 `…/qwen-voice` 后 `from clone import VoiceEngine`（一次加载、逐段合成）；参数照抄参考实现：seed=42+段号、temperature=0.7、top_p=0.95、top_k=50、repetition_penalty=1.05、lang_code='Chinese'，输出 24kHz PCM_16 WAV 到 `audio/s<k>.wav`。
- 每站 dwell = max(该段克隆音频去首尾静音后时长 + 0.3s, 3.0s)（与参考实现 `fit()` 一致）。
- 质量筛查：faster-whisper（`.qwen3-tts/models/whisper-small`）逐段听写 vs 发音文本，归一化相似度 ≥0.70；initial_prompt 必须短（≤20 字，如"CSVParser，CSVFormat，VS Code。"——长 prompt 会造成假阴性漏听）；有 prompt / 无 prompt 各听一次取较高者并记录所用模式。
- 响度：拼接全稿归一到 **-16 LUFS / -1.5 dBTP / LRA 9**，48kHz 单声道 AAC。
- 失败处理：某段合成失败 → 换 seed+1 重试一次；仍失败、或相似度 <0.70、或响度不达标 → **停工报告等裁决**；禁止换成任何其他 TTS。
- 参考实现（强烈建议复制到 `./explainer-artifacts/A2/v2/` 后改造，禁止原地修改）：`./explainer-artifacts/A2/my-voice/make_my_voice_video.py`（VoiceEngine 用法、whisper 短 prompt 筛查、静音修剪、响度、缓存复用全套工艺）与同目录 `README.md`。

## 分镜站点表（行号锚 = ch02-after；★ = 片尾断点清单同步列出）
| # | 位置 | 该行语句（原文节选，核对用） | 监视盒 | 讲解要点 |
| --- | --- | --- | --- | --- |
| 1 | 测试:HeadersCharacterizationTest.java:85 起全貌 | `void autoDetectedHeaderMapsNamesAndSkipsHeaderRecord()` | — | 场景总览：builder 链 `setHeader().setSkipHeaderRecord(true)`；标出全部站点 |
| 2 | CSVFormat.java:328 | `return new CSVFormat(this);` | — | `Builder.get()`：格式对象在此定案 |
| 3 | CSVFormat.java:2207 | `public CSVParser parse(final Reader reader) throws IOException {` | — | parse 入口 |
| 4 | CSVParser.java:528 | `this.headers = createHeaders();` | — | 表头在**解析器构造期**建立——数据行还没读 |
| 5 | CSVParser.java:631 | `final String[] formatHeader = format.getHeader();` | `formatHeader = String[0]` | 无参 `setHeader()` 传来空数组 |
| 6 | CSVParser.java:635 | `if (formatHeader.length == 0) {` | — | 空数组 → 走"从文件首行读表头"分支 |
| 7 | CSVParser.java:637 ★ | `final CSVRecord nextRecord = nextRecord();` | `nextRecord=[id, currency, amount]`，`headerMap={}` | **本集最重要一帧**：表头行在此被消费掉 |
| 8 | CSVParser.java:639 | `headerRecord = nextRecord.values();` | `headerRecord=[id, currency, amount]` | 首行的值数组成为表头记录 |
| 9 | CSVParser.java:655 | `for (int i = 0; i < headerRecord.length; i++) {` | `i=0→2` | 逐列建立"名→下标" |
| 10 | CSVParser.java:672 ★ | `headerMap.put(header, Integer.valueOf(i)); // Explicit boxing is intentional` | `headerMap: {} → {id=0, currency=1, amount=2}` | LinkedHashMap 保序；映射在循环中长成 |
| 11 | CSVParser.java:682 ★ | `return new Headers(headerMap, headerNames == null ? …` | `headers 就绪` | 表头世界定案；顺带一句：`skipHeaderRecord` 在自动探测分支其实没参与（A2b 已证） |
| 12 | 运行结果帧 | mvn 输出渲染成终端风格帧 | — | 实测收尾 |

- 站点停留 = max(该站配音时长 + 0.3s, 3.0s)；彩蛋帧内容（一段配音讲完）：① A1：format 完全不配表头时 `headerMap == null`——将来 required 校验的"全缺"形态也是它要报的；② A4b：手工表头忘设 `skipHeaderRecord`，文件表头行会被当成第一条数据记录。

## 真实运行结果帧
- 在 worktree 中执行（注意单引号包住 `$`）：`mvn test -Dtest='HeadersCharacterizationTest$HeaderSources#autoDetectedHeaderMapsNamesAndSkipsHeaderRecord'`
- 取输出中的方法名行与 `Tests run: 1, Failures: 0` 渲染成黑底等宽终端风格帧；配音一句收尾（如"以上，全部实测"）。

## 合成管线（实测过的参考配方，可等价替换，验收标准不变）
1. 讲解词双文本定稿 → 逐段克隆合成 `audio/s<k>.wav` → whisper 逐段筛查（≥0.70，停工保险丝）。
2. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理；每站停留 = max(该段时长+0.3s, 3.0s)）。
3. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
4. 音频：每段 `ffmpeg -i audio/s<k>.wav -af "apad=whole_dur=<d_k>" -ar 48000 -ac 1` 统一规格后按序 concat，整体响度归一（-16 LUFS / -1.5 dBTP / LRA 9）为 `audio.m4a`（AAC）。
5. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy {{OUTPUT_VIDEO}}`（即硬约束 2 的输出文件）。

## 验收（五项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac；音轨实测响度 -16±1 LUFS、真峰值 ≤ -1.5 dBTP。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/A2/v2/review/`。
5. 声音：逐段 whisper 相似度报告全部 ≥0.70（附所用 prompt 模式）；克隆参数与"配音"节一致（同一声音档案、同 seed 规则）——与既有 `ch02-1-6-explainer-A2-my-voice.mp4` 应为同一把声音。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词双文本全文（同存 `narration.md`）、五项验收输出、逐段合成耗时与相似度表、真实踩坑记录。
````

### 4.2 提示词 B1（晚失败痛点：Mapping not found）

````markdown
任务：为 commons-csv 的特征测试 B1（`HeadersCharacterizationTest$NameAccessBoundaries#getByNameWithUnknownNameThrowsMappingNotFound`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。配音全程使用**我的声音**（本地克隆合成，见"配音"与"依赖文件和目录"两节；禁止任何其他 TTS）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录，输出文件名：
   {{OUTPUT_VIDEO}}（本次实际使用：`ch02-1-6-explainer-B1-mapping-not-found.mp4`）
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到 `./explainer-artifacts/B1/`（`frames/`、`audio/`（含逐段克隆 WAV 与缓存签名）、`narration.md`（双文本）、`report.json`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/B1/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md`、`ch02-1-6-*.png`、两版 A2 成片（`ch02-1-6-explainer-A2-auto-detected-header.mp4`、`ch02-1-6-explainer-A2-my-voice.mp4`）及 `explainer-artifacts/A2/` 全目录（其中 `my-voice/` 脚本只可复制后改造）。
7. 配音必须是"我的声音"：用下方"依赖文件和目录"A 组的本地克隆工具链**原地复用**（不复制模型、不重建 venv、不改动旧项目任何文件）合成；开工前先逐一自检该清单各项存在，任一缺失 → **停工报告**（说明缺什么；按操作指南重建需下载约 3.6G，须经我确认后才可进行）；全程**禁止使用任何其他 TTS**（含 edge-tts、macOS `say`）。

## 依赖文件和目录（开工前逐一自检存在；本提示词的全部外部依赖，勿删改）
- **A. 声音克隆链路**（"我的声音"的来源与合成工具，误删风险最高、恢复代价最大）：
  - 我朗读的原声（声音参考源，占位符）：
    {{VOICE_REFERENCE_WAV}}（可以使用 `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/朗琴园 8.m4a`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/voice/`（现成声音档案：`profile.json` + `reference.wav`（11.29s，取自上述原声 00:06.55–00:17.84）+ `reference.txt`；**直接使用，勿改**；仅当档案缺失需重建时才会直接用到上面的原声）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/clone.py`（`VoiceEngine`，及其引用的模型/档案常量）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/.qwen3-tts/`（`.venv` 运行环境 + `models/qwen3-tts-1.7b-base-8bit`（2.9G）+ `models/whisper-small` + `cache/`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/Qwen3-TTS_本机音色克隆操作指南.md`（环境/档案缺失时按此重建——但须先停工报告）
- **B. 本仓库**（当前工作目录）：
  - `./commons-csv`（代码锚：分支 `ch02-after` = `24562da2…`）
  - `./explainer-artifacts/A2/my-voice/`（已验证参考实现：`make_my_voice_video.py`、`verify_my_voice.sh`、`README.md`；**只读，复制到 `explainer-artifacts/B1/` 后改造**）
- **C. 系统级**（系统/homebrew 自带，误删风险低，列出备查）：
  - `/opt/homebrew/bin/ffmpeg`、`/opt/homebrew/bin/ffprobe`
  - 字体：`/System/Library/Fonts/Supplemental/Menlo.ttc`、`/System/Library/Fonts/Hiragino Sans GB.ttc`、`/System/Library/Fonts/SFNSMono.ttf`

## 视频形态（1920×1080，深色底 #1E1E1E）
- 结构与时长：片头标题板(~8s) → 测试全貌帧 → 逐站点分镜 → 真实运行结果帧(~6s) → 彩蛋帧(~8s) → 片尾断点清单板(~10s)。若总长超 180s：先压彩蛋/全貌停留，再合并相邻同类站点，不得删带 ★ 的断点站点。
- 每个站点一帧：该行 ±7 行上下文；当前行整行高亮带 `#264F78` + 行号前红色圆点（建议断点）；顶栏左 `src/.../CSVRecord.java · get(String)`（等宽 SF Mono 25px #9DA0A6），右 `B1 晚失败痛点 · 第 n/N 站`（中文 26px #4EC9B0）；右上"变量监视盒"（圆角面板 #252526/边框 #3F3F46，SF Mono 25px，值用 #9CDCFE，只在站点表标注时更新）；底部字幕。
- 字幕：Hiragino Sans GB 40px、#FFEB3B、2px #141414 描边、无背景块、居中（y≈1006）。
- 代码 Menlo 30px（#D4D4D4，注释 #6A9955，行号 #6E7681，行距 52px，每帧 ≤16 行）。
- 字体路径（实测可加载）：Menlo=/System/Library/Fonts/Supplemental/Menlo.ttc；中文=/System/Library/Fonts/Hiragino Sans GB.ttc；SF Mono=/System/Library/Fonts/SFNSMono.ttf。
- 本机 ffmpeg 8.1.1 **无 libass/drawtext**：字幕必须用 Pillow 画进帧。
- 页脚：左下 `frame k/M · dwell <s>`，右下 `ch02-1-6 · B1 · ch02-after (24562da2)`。
- 片头标题板：`第 B1 集 · getByNameWithUnknownNameThrowsMappingNotFound`；场景：表头齐全，`get("nope")` 取不存在的列名；目标：看懂需求要替换的"晚失败"痛点长什么样；`详见 ch02-1-2 §B组 · ch02-1-3 §2.B1`。
- 片尾断点清单板：`CSVRecord.java:135 / :137 / :140 · 测试:HeadersCharacterizationTest.java:143`，附一句"下一步：VS Code（分支 ch02-after）单步调试本测试"。

## 配音（"我的声音"克隆，本地离线；禁止任何其他 TTS）
- 声音参考 = 依赖清单 A 组的 `{{VOICE_REFERENCE_WAV}}`；**直接使用现成声音档案** `…/qwen-voice/voice/`（由我的朗读原声构建），不要重新裁剪参考音频；档案缺失 → 按硬约束 7 停工。
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 350–450 字（本集站点少，可把节奏放慢、把"为什么这是痛点"讲透）；片头板配总起一句、片尾板配总结一句。
- **双文本**（沿用 A2 已验证做法）：每段写两份——字幕文本（烧进画面帧）与发音文本（供克隆引擎；数字、行号、`:137` 等可展开成可读说法）；两份语义一致，`narration.md` 同时保存两列。
- 合成（全部本地离线）：用 `.qwen3-tts/.venv/bin/python`，`sys.path` 加入 `…/qwen-voice` 后 `from clone import VoiceEngine`（一次加载、逐段合成）；参数照抄参考实现：seed=42+段号、temperature=0.7、top_p=0.95、top_k=50、repetition_penalty=1.05、lang_code='Chinese'，输出 24kHz PCM_16 WAV 到 `audio/s<k>.wav`。
- 每站 dwell = max(该段克隆音频去首尾静音后时长 + 0.3s, 3.0s)（与参考实现 `fit()` 一致）。
- 质量筛查：faster-whisper（`.qwen3-tts/models/whisper-small`）逐段听写 vs 发音文本，归一化相似度 ≥0.70；initial_prompt 必须短（≤20 字，如"CSVParser，CSVFormat，VS Code。"——长 prompt 会造成假阴性漏听）；有 prompt / 无 prompt 各听一次取较高者并记录所用模式。
- 响度：拼接全稿归一到 **-16 LUFS / -1.5 dBTP / LRA 9**，48kHz 单声道 AAC。
- 失败处理：某段合成失败 → 换 seed+1 重试一次；仍失败、或相似度 <0.70、或响度不达标 → **停工报告等裁决**；禁止换成任何其他 TTS。
- 参考实现（强烈建议复制到 `./explainer-artifacts/B1/` 后改造，禁止原地修改）：`./explainer-artifacts/A2/my-voice/make_my_voice_video.py`（VoiceEngine 用法、whisper 短 prompt 筛查、静音修剪、响度、缓存复用全套工艺）与同目录 `README.md`。

## 分镜站点表（行号锚 = ch02-after；★ = 片尾断点清单同步列出）
| # | 位置 | 该行语句（原文节选，核对用） | 监视盒 | 讲解要点 |
| --- | --- | --- | --- | --- |
| 1 | 测试:HeadersCharacterizationTest.java:143 起全貌 | `void getByNameWithUnknownNameThrowsMappingNotFound()` | — | 场景总览：解析成功、记录在手，取值才炸 |
| 2 | CSVRecord.java:131 | `final Map<String, Integer> headerMap = getHeaderMapRaw();` | `headerMap={id=0, currency=1, amount=2}` | 每条记录按名取值，都回指解析器的表头映射 |
| 3 | CSVRecord.java:132 | `if (headerMap == null) {` | — | 对照分支：无表头世界抛 `IllegalStateException`（A1 走这条），本测试不进 |
| 4 | CSVRecord.java:135 ★ | `final Integer index = name == null ? null : headerMap.get(name);` | `name="nope"`, `index=null` | map 查无此名 |
| 5 | CSVRecord.java:137 ★ | `throw new IllegalArgumentException(String.format("Mapping for %s not found, expected one of %s", …` | 异常消息全文 | 真实消息比需求原文长：还带 `expected one of [id, currency, amount]`——**需求痛点原文的出处就是这一行** |
| 6 | CSVRecord.java:140 ★ | `return values[index.intValue()]; // Explicit unboxing is intentional` | — | 对照：合法列名走这条正常返回（呼应彩蛋②） |
| 7 | 测试:143 尾部 assertThrows | 异常类型与消息片段断言 | — | 特征测试钉住现状：类型精确断言、消息只断关键片段 |
| 8 | 运行结果帧 | mvn 输出渲染成终端风格帧 | — | 实测收尾 |

- 站点停留 = max(该站配音时长 + 0.3s, 3.0s)；彩蛋帧内容：① B2a：表头比数据多时，`index` 越界在 :140 被 catch 后转成 `Index for header ... only has ... values`（:143-144）——另一种"取值时才炸"；② B3b：空文件 + `setHeader()` 时 `headerMap` 是**空 Map 不是 null**。结尾点题一句：将来 `setRequiredHeaders` 要做的，就是把这类报错从取值期提前到解析期（本分支没有该功能，不展示其代码）。

## 真实运行结果帧
- 在 worktree 中执行（注意单引号包住 `$`）：`mvn test -Dtest='HeadersCharacterizationTest$NameAccessBoundaries#getByNameWithUnknownNameThrowsMappingNotFound'`
- 取输出中的方法名行与 `Tests run: 1, Failures: 0` 渲染成黑底等宽终端风格帧；配音一句收尾（如"以上，全部实测"）。

## 合成管线（实测过的参考配方，可等价替换，验收标准不变）
1. 讲解词双文本定稿 → 逐段克隆合成 `audio/s<k>.wav` → whisper 逐段筛查（≥0.70，停工保险丝）。
2. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理；每站停留 = max(该段时长+0.3s, 3.0s)）。
3. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
4. 音频：每段 `ffmpeg -i audio/s<k>.wav -af "apad=whole_dur=<d_k>" -ar 48000 -ac 1` 统一规格后按序 concat，整体响度归一（-16 LUFS / -1.5 dBTP / LRA 9）为 `audio.m4a`（AAC）。
5. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy {{OUTPUT_VIDEO}}`（即硬约束 2 的输出文件）。

## 验收（五项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac；音轨实测响度 -16±1 LUFS、真峰值 ≤ -1.5 dBTP。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/B1/review/`。
5. 声音：逐段 whisper 相似度报告全部 ≥0.70（附所用 prompt 模式）；克隆参数与"配音"节一致（同一声音档案、同 seed 规则）——与既有 `ch02-1-6-explainer-A2-my-voice.mp4` 应为同一把声音。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词双文本全文（同存 `narration.md`）、五项验收输出、逐段合成耗时与相似度表、真实踩坑记录。
````

### 4.3 提示词 C1b（早报错先例：parse 时抛出）

````markdown
任务：为 commons-csv 的特征测试 C1b（`HeadersCharacterizationTest$DuplicateAndBlankHeaders#duplicateFileHeaderWithDisallowThrowsAtParserCreation`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。配音全程使用**我的声音**（本地克隆合成，见"配音"与"依赖文件和目录"两节；禁止任何其他 TTS）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录，输出文件名：
   {{OUTPUT_VIDEO}}（本次实际使用：`ch02-1-6-explainer-C1b-duplicate-header-at-parse.mp4`）
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到 `./explainer-artifacts/C1b/`（`frames/`、`audio/`（含逐段克隆 WAV 与缓存签名）、`narration.md`（双文本）、`report.json`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/C1b/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md`、`ch02-1-6-*.png`、两版 A2 成片（`ch02-1-6-explainer-A2-auto-detected-header.mp4`、`ch02-1-6-explainer-A2-my-voice.mp4`）及 `explainer-artifacts/A2/` 全目录（其中 `my-voice/` 脚本只可复制后改造）。
7. 配音必须是"我的声音"：用下方"依赖文件和目录"A 组的本地克隆工具链**原地复用**（不复制模型、不重建 venv、不改动旧项目任何文件）合成；开工前先逐一自检该清单各项存在，任一缺失 → **停工报告**（说明缺什么；按操作指南重建需下载约 3.6G，须经我确认后才可进行）；全程**禁止使用任何其他 TTS**（含 edge-tts、macOS `say`）。

## 依赖文件和目录（开工前逐一自检存在；本提示词的全部外部依赖，勿删改）
- **A. 声音克隆链路**（"我的声音"的来源与合成工具，误删风险最高、恢复代价最大）：
  - 我朗读的原声（声音参考源，占位符）：
    {{VOICE_REFERENCE_WAV}}（可以使用 `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/朗琴园 8.m4a`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/voice/`（现成声音档案：`profile.json` + `reference.wav`（11.29s，取自上述原声 00:06.55–00:17.84）+ `reference.txt`；**直接使用，勿改**；仅当档案缺失需重建时才会直接用到上面的原声）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/clone.py`（`VoiceEngine`，及其引用的模型/档案常量）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/.qwen3-tts/`（`.venv` 运行环境 + `models/qwen3-tts-1.7b-base-8bit`（2.9G）+ `models/whisper-small` + `cache/`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/Qwen3-TTS_本机音色克隆操作指南.md`（环境/档案缺失时按此重建——但须先停工报告）
- **B. 本仓库**（当前工作目录）：
  - `./commons-csv`（代码锚：分支 `ch02-after` = `24562da2…`）
  - `./explainer-artifacts/A2/my-voice/`（已验证参考实现：`make_my_voice_video.py`、`verify_my_voice.sh`、`README.md`；**只读，复制到 `explainer-artifacts/C1b/` 后改造**）
- **C. 系统级**（系统/homebrew 自带，误删风险低，列出备查）：
  - `/opt/homebrew/bin/ffmpeg`、`/opt/homebrew/bin/ffprobe`
  - 字体：`/System/Library/Fonts/Supplemental/Menlo.ttc`、`/System/Library/Fonts/Hiragino Sans GB.ttc`、`/System/Library/Fonts/SFNSMono.ttf`

## 视频形态（1920×1080，深色底 #1E1E1E）
- 结构与时长：片头标题板(~8s) → 测试全貌帧 → 逐站点分镜 → 证据帧 → 真实运行结果帧(~6s) → 彩蛋帧(~8s) → 片尾断点清单板(~10s)。若总长超 180s：先压彩蛋/全貌停留，再合并相邻同类站点，不得删带 ★ 的断点站点。
- 每个站点一帧：该行 ±7 行上下文；当前行整行高亮带 `#264F78` + 行号前红色圆点（建议断点）；顶栏左 `src/.../CSVParser.java · createHeaders()`（等宽 SF Mono 25px #9DA0A6），右 `C1b 早报错先例 · 第 n/N 站`（中文 26px #4EC9B0）；右上"变量监视盒"（圆角面板 #252526/边框 #3F3F46，SF Mono 25px，值用 #9CDCFE，只在站点表标注时更新）；底部字幕。
- 字幕：Hiragino Sans GB 40px、#FFEB3B、2px #141414 描边、无背景块、居中（y≈1006）。
- 代码 Menlo 30px（#D4D4D4，注释 #6A9955，行号 #6E7681，行距 52px，每帧 ≤16 行）。
- 字体路径（实测可加载）：Menlo=/System/Library/Fonts/Supplemental/Menlo.ttc；中文=/System/Library/Fonts/Hiragino Sans GB.ttc；SF Mono=/System/Library/Fonts/SFNSMono.ttf。
- 本机 ffmpeg 8.1.1 **无 libass/drawtext**：字幕必须用 Pillow 画进帧。
- 页脚：左下 `frame k/M · dwell <s>`，右下 `ch02-1-6 · C1b · ch02-after (24562da2)`。
- 片头标题板：`第 C1b 集 · duplicateFileHeaderWithDisallowThrowsAtParserCreation`；场景：文件表头 `id,currency,id` + `DISALLOW`，`parse()` 调用本身抛错；目标：看懂"在读第一条数据记录之前报错"的现成先例——ch02-1-3 称之为"本热身最关键的一个测试"；`详见 ch02-1-2 §C组 · ch02-1-3 §2.C1b`。
- 片尾断点清单板：`CSVParser.java:661 / :665 / :528 · CSVFormat.java:2207 · 测试:HeadersCharacterizationTest.java:210`，附一句"下一步：VS Code（分支 ch02-after）单步调试本测试"。

## 配音（"我的声音"克隆，本地离线；禁止任何其他 TTS）
- 声音参考 = 依赖清单 A 组的 `{{VOICE_REFERENCE_WAV}}`；**直接使用现成声音档案** `…/qwen-voice/voice/`（由我的朗读原声构建），不要重新裁剪参考音频；档案缺失 → 按硬约束 7 停工。
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 420–520 字；片头板配总起一句、片尾板配总结一句。
- **双文本**（沿用 A2 已验证做法）：每段写两份——字幕文本（烧进画面帧）与发音文本（供克隆引擎；数字、行号、`:665` 等可展开成可读说法）；两份语义一致，`narration.md` 同时保存两列。
- 合成（全部本地离线）：用 `.qwen3-tts/.venv/bin/python`，`sys.path` 加入 `…/qwen-voice` 后 `from clone import VoiceEngine`（一次加载、逐段合成）；参数照抄参考实现：seed=42+段号、temperature=0.7、top_p=0.95、top_k=50、repetition_penalty=1.05、lang_code='Chinese'，输出 24kHz PCM_16 WAV 到 `audio/s<k>.wav`。
- 每站 dwell = max(该段克隆音频去首尾静音后时长 + 0.3s, 3.0s)（与参考实现 `fit()` 一致）。
- 质量筛查：faster-whisper（`.qwen3-tts/models/whisper-small`）逐段听写 vs 发音文本，归一化相似度 ≥0.70；initial_prompt 必须短（≤20 字，如"CSVParser，CSVFormat，VS Code。"——长 prompt 会造成假阴性漏听）；有 prompt / 无 prompt 各听一次取较高者并记录所用模式。
- 响度：拼接全稿归一到 **-16 LUFS / -1.5 dBTP / LRA 9**，48kHz 单声道 AAC。
- 失败处理：某段合成失败 → 换 seed+1 重试一次；仍失败、或相似度 <0.70、或响度不达标 → **停工报告等裁决**；禁止换成任何其他 TTS。
- 参考实现（强烈建议复制到 `./explainer-artifacts/C1b/` 后改造，禁止原地修改）：`./explainer-artifacts/A2/my-voice/make_my_voice_video.py`（VoiceEngine 用法、whisper 短 prompt 筛查、静音修剪、响度、缓存复用全套工艺）与同目录 `README.md`。

## 分镜站点表（行号锚 = ch02-after；★ = 片尾断点清单同步列出）
| # | 位置 | 该行语句（原文节选，核对用） | 监视盒 | 讲解要点 |
| --- | --- | --- | --- | --- |
| 1 | 测试:HeadersCharacterizationTest.java:210 起全貌 | `void duplicateFileHeaderWithDisallowThrowsAtParserCreation()` | — | 场景总览：`assertThrows` 包住 `format.parse(...)` |
| 2 | CSVFormat.java:221 | `.setDuplicateHeaderMode(DuplicateHeaderMode.ALLOW_ALL);` | — | 默认 `ALLOW_ALL` = **不检查重复**——所以测试必须显式 `DISALLOW` |
| 3 | CSVFormat.java:2207 | `public CSVParser parse(final Reader reader) throws IOException {` | — | parse 入口：异常将从这次调用本身抛出 |
| 4 | CSVParser.java:528 ★ | `this.headers = createHeaders();` | — | 校验发生在解析器构造期 = 任何数据记录被读之前 |
| 5 | CSVParser.java:637 | `final CSVRecord nextRecord = nextRecord();` | `headerRecord=[id, currency, id]` | 文件表头行进来（自动探测分支，与 A2 同站） |
| 6 | CSVParser.java:661 ★ | `final boolean containsHeader = blankHeader ? observedMissing : headerMap.containsKey(header);` | `headerMap={id=0, currency=1}`，第二个 `id`: `containsHeader=true` | 第二个 `id` 已在 map——重复被识破 |
| 7 | CSVParser.java:663 | `final boolean duplicatesAllowed = headerMode == DuplicateHeaderMode.ALLOW_ALL;` | `duplicatesAllowed=false` | `DISALLOW` 生效 |
| 8 | CSVParser.java:665 ★ | `if (containsHeader && !duplicatesAllowed && !(blankHeader && emptyDuplicatesAllowed)) {` | 三条件全真 | 抛出前的最后判定 |
| 9 | CSVParser.java:666-668 | `throw new IllegalArgumentException(String.format("The header contains a duplicate name: …If this is valid then use CSVFormat.Builder.setDuplicateHeaderMode()."` | 异常消息 | 消息风格值得学：说明问题 + 给修复出口 |
| 10 | 证据帧 | `parse()` 抛出，数据行 `1,USD,2` 从未被消费 | — | **这就是"读第一条记录之前报错"的实证**；将来 `setRequiredHeaders` 照这个时机做（本分支无该功能，不展示其代码） |
| 11 | 运行结果帧 | mvn 输出渲染成终端风格帧 | — | 实测收尾 |

- 站点停留 = max(该站配音时长 + 0.3s, 3.0s)；彩蛋帧内容：① C1a：手工表头重复在 `builder.get()`（`CSVFormat.java:2791-2799`）就抛——表头校验有**两个时机**：build 期（手工）/ parse 期（文件）；② B3b 教训呼应：只判 `headerMap == null` 会漏"空 Map"形态。

## 真实运行结果帧
- 在 worktree 中执行（注意单引号包住 `$`）：`mvn test -Dtest='HeadersCharacterizationTest$DuplicateAndBlankHeaders#duplicateFileHeaderWithDisallowThrowsAtParserCreation'`
- 取输出中的方法名行与 `Tests run: 1, Failures: 0` 渲染成黑底等宽终端风格帧；配音一句收尾（如"以上，全部实测"）。

## 合成管线（实测过的参考配方，可等价替换，验收标准不变）
1. 讲解词双文本定稿 → 逐段克隆合成 `audio/s<k>.wav` → whisper 逐段筛查（≥0.70，停工保险丝）。
2. Pillow 逐站渲 PNG（片头/全貌/证据/结果/彩蛋/片尾板同理；每站停留 = max(该段时长+0.3s, 3.0s)）。
3. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
4. 音频：每段 `ffmpeg -i audio/s<k>.wav -af "apad=whole_dur=<d_k>" -ar 48000 -ac 1` 统一规格后按序 concat，整体响度归一（-16 LUFS / -1.5 dBTP / LRA 9）为 `audio.m4a`（AAC）。
5. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy {{OUTPUT_VIDEO}}`（即硬约束 2 的输出文件）。

## 验收（五项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac；音轨实测响度 -16±1 LUFS、真峰值 ≤ -1.5 dBTP。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/C1b/review/`。
5. 声音：逐段 whisper 相似度报告全部 ≥0.70（附所用 prompt 模式）；克隆参数与"配音"节一致（同一声音档案、同 seed 规则）——与既有 `ch02-1-6-explainer-A2-my-voice.mp4` 应为同一把声音。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词双文本全文（同存 `narration.md`）、五项验收输出、逐段合成耗时与相似度表、真实踩坑记录。
````

### 4.4 提示词 D1（匹配语义：精确匹配与空格）

````markdown
任务：为 commons-csv 的特征测试 D1（`HeadersCharacterizationTest$RequirementAdjacent#headerNameWithSurroundingSpacesNeedsExactMatch`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。配音全程使用**我的声音**（本地克隆合成，见"配音"与"依赖文件和目录"两节；禁止任何其他 TTS）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录，输出文件名：
   {{OUTPUT_VIDEO}}（本次实际使用：`ch02-1-6-explainer-D1-exact-match-with-spaces.mp4`）
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜（特别是站点 6 的默认值区行号，以实测为准）。
5. 中间产物保留到 `./explainer-artifacts/D1/`（`frames/`、`audio/`（含逐段克隆 WAV 与缓存签名）、`narration.md`（双文本）、`report.json`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/D1/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md`、`ch02-1-6-*.png`、两版 A2 成片（`ch02-1-6-explainer-A2-auto-detected-header.mp4`、`ch02-1-6-explainer-A2-my-voice.mp4`）及 `explainer-artifacts/A2/` 全目录（其中 `my-voice/` 脚本只可复制后改造）。
7. 配音必须是"我的声音"：用下方"依赖文件和目录"A 组的本地克隆工具链**原地复用**（不复制模型、不重建 venv、不改动旧项目任何文件）合成；开工前先逐一自检该清单各项存在，任一缺失 → **停工报告**（说明缺什么；按操作指南重建需下载约 3.6G，须经我确认后才可进行）；全程**禁止使用任何其他 TTS**（含 edge-tts、macOS `say`）。

## 依赖文件和目录（开工前逐一自检存在；本提示词的全部外部依赖，勿删改）
- **A. 声音克隆链路**（"我的声音"的来源与合成工具，误删风险最高、恢复代价最大）：
  - 我朗读的原声（声音参考源，占位符）：
    {{VOICE_REFERENCE_WAV}}（可以使用 `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/朗琴园 8.m4a`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/voice/`（现成声音档案：`profile.json` + `reference.wav`（11.29s，取自上述原声 00:06.55–00:17.84）+ `reference.txt`；**直接使用，勿改**；仅当档案缺失需重建时才会直接用到上面的原声）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/qwen-voice/clone.py`（`VoiceEngine`，及其引用的模型/档案常量）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/.qwen3-tts/`（`.venv` 运行环境 + `models/qwen3-tts-1.7b-base-8bit`（2.9G）+ `models/whisper-small` + `cache/`）
  - `/Users/binwu/Movies/my-self-media-topics/2026-10-17-douyin-hot-topics-calendar/Qwen3-TTS_本机音色克隆操作指南.md`（环境/档案缺失时按此重建——但须先停工报告）
- **B. 本仓库**（当前工作目录）：
  - `./commons-csv`（代码锚：分支 `ch02-after` = `24562da2…`）
  - `./explainer-artifacts/A2/my-voice/`（已验证参考实现：`make_my_voice_video.py`、`verify_my_voice.sh`、`README.md`；**只读，复制到 `explainer-artifacts/D1/` 后改造**）
- **C. 系统级**（系统/homebrew 自带，误删风险低，列出备查）：
  - `/opt/homebrew/bin/ffmpeg`、`/opt/homebrew/bin/ffprobe`
  - 字体：`/System/Library/Fonts/Supplemental/Menlo.ttc`、`/System/Library/Fonts/Hiragino Sans GB.ttc`、`/System/Library/Fonts/SFNSMono.ttf`

## 视频形态（1920×1080，深色底 #1E1E1E）
- 结构与时长：片头标题板(~8s) → 测试全貌帧 → 逐站点分镜 → 真实运行结果帧(~6s) → 彩蛋帧(~8s) → 片尾断点清单板(~10s)。若总长超 180s：先压彩蛋/全貌停留，再合并相邻同类站点，不得删带 ★ 的断点站点。
- 每个站点一帧：该行 ±7 行上下文；当前行整行高亮带 `#264F78` + 行号前红色圆点（建议断点）；顶栏左 `src/.../CSVParser.java · createHeaders()` 或对应文件（等宽 SF Mono 25px #9DA0A6），右 `D1 匹配语义 · 第 n/N 站`（中文 26px #4EC9B0）；右上"变量监视盒"（圆角面板 #252526/边框 #3F3F46，SF Mono 25px，值用 #9CDCFE，只在站点表标注时更新；本集请务必让 `header` 值两端空格肉眼可见，如 `[·currency·]` 表示并在字幕里点明）；底部字幕。
- 字幕：Hiragino Sans GB 40px、#FFEB3B、2px #141414 描边、无背景块、居中（y≈1006）。
- 代码 Menlo 30px（#D4D4D4，注释 #6A9955，行号 #6E7681，行距 52px，每帧 ≤16 行）。
- 字体路径（实测可加载）：Menlo=/System/Library/Fonts/Supplemental/Menlo.ttc；中文=/System/Library/Fonts/Hiragino Sans GB.ttc；SF Mono=/System/Library/Fonts/SFNSMono.ttf。
- 本机 ffmpeg 8.1.1 **无 libass/drawtext**：字幕必须用 Pillow 画进帧。
- 页脚：左下 `frame k/M · dwell <s>`，右下 `ch02-1-6 · D1 · ch02-after (24562da2)`。
- 片头标题板：`第 D1 集 · headerNameWithSurroundingSpacesNeedsExactMatch`；场景：表头名 ` currency `（前后空格）对 `get("currency")` 与 `get(" currency ")` 两种取法；目标：确认现状是**精确匹配、不 trim**——这决定将来 required 匹配的语义；`详见 ch02-1-2 §D组 · ch02-1-3 §2.D1`。
- 片尾断点清单板：`CSVParser.java:672 · CSVRecord.java:135 / :137 / :140 · 测试:HeadersCharacterizationTest.java:260`，附一句"下一步：VS Code（分支 ch02-after）单步调试本测试"。

## 配音（"我的声音"克隆，本地离线；禁止任何其他 TTS）
- 声音参考 = 依赖清单 A 组的 `{{VOICE_REFERENCE_WAV}}`；**直接使用现成声音档案** `…/qwen-voice/voice/`（由我的朗读原声构建），不要重新裁剪参考音频；档案缺失 → 按硬约束 7 停工。
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 350–450 字；片头板配总起一句、片尾板配总结一句。
- **双文本**（沿用 A2 已验证做法）：每段写两份——字幕文本（烧进画面帧）与发音文本（供克隆引擎；数字、行号、`" currency "` 的空格可念成"前后各一个空格"等可读说法）；两份语义一致，`narration.md` 同时保存两列。
- 合成（全部本地离线）：用 `.qwen3-tts/.venv/bin/python`，`sys.path` 加入 `…/qwen-voice` 后 `from clone import VoiceEngine`（一次加载、逐段合成）；参数照抄参考实现：seed=42+段号、temperature=0.7、top_p=0.95、top_k=50、repetition_penalty=1.05、lang_code='Chinese'，输出 24kHz PCM_16 WAV 到 `audio/s<k>.wav`。
- 每站 dwell = max(该段克隆音频去首尾静音后时长 + 0.3s, 3.0s)（与参考实现 `fit()` 一致）。
- 质量筛查：faster-whisper（`.qwen3-tts/models/whisper-small`）逐段听写 vs 发音文本，归一化相似度 ≥0.70；initial_prompt 必须短（≤20 字，如"CSVParser，CSVFormat，VS Code。"——长 prompt 会造成假阴性漏听）；有 prompt / 无 prompt 各听一次取较高者并记录所用模式。
- 响度：拼接全稿归一到 **-16 LUFS / -1.5 dBTP / LRA 9**，48kHz 单声道 AAC。
- 失败处理：某段合成失败 → 换 seed+1 重试一次；仍失败、或相似度 <0.70、或响度不达标 → **停工报告等裁决**；禁止换成任何其他 TTS。
- 参考实现（强烈建议复制到 `./explainer-artifacts/D1/` 后改造，禁止原地修改）：`./explainer-artifacts/A2/my-voice/make_my_voice_video.py`（VoiceEngine 用法、whisper 短 prompt 筛查、静音修剪、响度、缓存复用全套工艺）与同目录 `README.md`。

## 分镜站点表（行号锚 = ch02-after；★ = 片尾断点清单同步列出）
| # | 位置 | 该行语句（原文节选，核对用） | 监视盒 | 讲解要点 |
| --- | --- | --- | --- | --- |
| 1 | 测试:HeadersCharacterizationTest.java:260 起全貌 | `void headerNameWithSurroundingSpacesNeedsExactMatch()` | — | 场景总览：同一列名，带不带空格两种取法，结果不同 |
| 2 | CSVParser.java:672 ★ | `headerMap.put(header, Integer.valueOf(i)); // Explicit boxing is intentional` | `headerMap.keySet=[id, " currency ", amount]` | 空格**原样保留**进 map，成为独立 key |
| 3 | CSVRecord.java:135 ★ | `final Integer index = name == null ? null : headerMap.get(name);` | `name="currency"`, `index=null` | 精确匹配查不到（不 trim） |
| 4 | CSVRecord.java:137 ★ | `throw new IllegalArgumentException(String.format("Mapping for %s not found, expected one of %s", …` | 异常消息 | 与 B1 同一条消息——痛点在"看起来该匹配却没匹配" |
| 5 | CSVRecord.java:140 ★ | `return values[index.intValue()]; // Explicit unboxing is intentional` | `name=" currency "` → `index=1` → 值 | 用"全名"（带空格）才取得到 |
| 6 | CSVFormat.java:214-223（Builder.create() 默认值区，行号以实测为准） | 默认 `trim=false`、`ignoreSurroundingSpaces=false` 等 | — | 默认配置不做任何清理——精确匹配是**默认行为**，不是 bug |
| 7 | 运行结果帧 | mvn 输出渲染成终端风格帧 | — | 实测收尾 |

- 站点停留 = max(该站配音时长 + 0.3s, 3.0s)；彩蛋帧内容：① D2：手工表头只认**位置**不认文件文本——校验对象应是汇合后的 `headerMap`，不是文件首行；② 点题：将来 `setRequiredHeaders` 的匹配必须**显式决定** trim 与否——若校验 trim 而取值不 trim，会"校验过了、`get` 取不到"自相矛盾（本分支无该功能，不展示其代码）。

## 真实运行结果帧
- 在 worktree 中执行（注意单引号包住 `$`）：`mvn test -Dtest='HeadersCharacterizationTest$RequirementAdjacent#headerNameWithSurroundingSpacesNeedsExactMatch'`
- 取输出中的方法名行与 `Tests run: 1, Failures: 0` 渲染成黑底等宽终端风格帧；配音一句收尾（如"以上，全部实测"）。

## 合成管线（实测过的参考配方，可等价替换，验收标准不变）
1. 讲解词双文本定稿 → 逐段克隆合成 `audio/s<k>.wav` → whisper 逐段筛查（≥0.70，停工保险丝）。
2. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理；每站停留 = max(该段时长+0.3s, 3.0s)）。
3. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
4. 音频：每段 `ffmpeg -i audio/s<k>.wav -af "apad=whole_dur=<d_k>" -ar 48000 -ac 1` 统一规格后按序 concat，整体响度归一（-16 LUFS / -1.5 dBTP / LRA 9）为 `audio.m4a`（AAC）。
5. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy {{OUTPUT_VIDEO}}`（即硬约束 2 的输出文件）。

## 验收（五项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac；音轨实测响度 -16±1 LUFS、真峰值 ≤ -1.5 dBTP。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/D1/review/`。
5. 声音：逐段 whisper 相似度报告全部 ≥0.70（附所用 prompt 模式）；克隆参数与"配音"节一致（同一声音档案、同 seed 规则）——与既有 `ch02-1-6-explainer-A2-my-voice.mp4` 应为同一把声音。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词双文本全文（同存 `narration.md`）、五项验收输出、逐段合成耗时与相似度表、真实踩坑记录。
````

---

## 5. 使用说明（给你的操作顺序）

1. VS Code 打开 `./commons-csv`，确认分支为 `ch02-after`（行号与视频、ch02-1-2/1-3 全部一致）。
2. 在当前目录下按顺序把 §4.1 → §4.4 的提示词逐份粘贴给新会话的 agent（同等工作目录）；每份独立可执行，顺序无依赖，但按 A2 → B1 → C1b → D1 观看最利于理解递进（来源链 → 痛点 → 先例 → 语义）。agent 开工会先自检提示词内"依赖文件和目录"清单，任一缺失会停工报告（约 3.6G 的重建须经你确认后才进行）。
3. 输出文件名与声音参考路径均以占位符标注（`{{OUTPUT_VIDEO}}` / `{{VOICE_REFERENCE_WAV}}`，各附"本次实际使用"值）；将来路径有变，只需替换占位符所在行。
4. A2 集说明：已有两版成片（v1 edge-tts 版 `ch02-1-6-explainer-A2-auto-detected-header.mp4`、两步换声版 `ch02-1-6-explainer-A2-my-voice.mp4`）；§4.1 是与后三集同构的一步式复现路径，重跑只会新增 `ch02-1-11-explainer-A2-my-voice.mp4` 与 `explainer-artifacts/A2/v2/`，不会覆盖任何既有文件——如无重制需要，可直接跳过 §4.1。
5. 每集看完 → 暂停感兴趣的帧 → VS Code 里按片尾断点清单下断点 → 单步调试同一测试。
6. 改版：直接告诉执行 agent 改哪一帧/哪句讲解词；改某段发音文本后只需重合成该段（参考实现的缓存复用思路），中间产物都在 `explainer-artifacts/<ID>/`（A2 集为 `A2/v2/`），可增量重生成。
