# ch02-1-6 Explainer 方案与提示词（4 个优先理解的测试场景）

> - **代码锚**：`./commons-csv` 分支 **`ch02-after`**（`24562da2fff56fefd61ec8f6ce352632fb301957`，即 `ch02-1-2`/`ch02-1-3` 的行号锚；当前工作区已在该分支、工作区干净，2026-10-21 实测）。本文件所有行号均在该分支逐一实测核对。
> - **配套**：决策过程见 `ch02-1-5-dialogs-for-explainers.md`；帧样式样张见 `ch02-1-6-sample-frame-A2.png`（1920×1080，按本文件 §3 规格渲染）。
> - **工具链事实**（均实测）：ffmpeg 8.1.1（**无 libass/drawtext**，字幕须 Pillow 画帧）；Pillow 12.1.1 + 系统字体 Menlo / SF Mono / Hiragino Sans GB 可加载（PingFang 已不可按路径加载）；edge-tts 联网可用；Maven 3.9.16 + JDK 21。

---

## 0. 已审批的决策速览

| 决策 | 结论 | 审批轮次 |
| --- | --- | --- |
| 优先理解的 4 个测试 | **A2 / B1 / C1b / D1**（各理由见 §0.1） | Round 1（Q1–Q4） |
| explainer 深度 | **调试预习演**：顺序地图骨架 + 每集 2–3 个运行时快照 + 每帧"路径:行号"角标与断点红点 | Round 0（Q0） |
| 主方案 | **方案一「逐调用点分镜 · 代码剧场」**，4 集统一 | Round 2（Q10） |
| 配音 | edge-tts `zh-CN-XiaoxiaoNeural`（晓晓），`--rate=-10%` | Round 1（Q5） |
| 字幕/画面 | 深色主题；字幕 Hiragino Sans GB 40px、黄色 `#FFEB3B`、无背景色（2px 深色描边）；代码字体 Menlo（与 VS Code 一致） | Round 0/1（A8、Q6） |
| 观看姿势 | 分屏边看边在 VS Code 对照（→ 1080p、大字号、每帧 ≤16 行） | Round 1（M4） |
| 时长 | 每集硬上限 **180 秒** | Round 1（M5） |
| 片头/片尾 | 4 集统一模板（标题板/断点清单板，含对 ch02-1-2/1-3 的互引） | Round 1（M6） |
| 变量快照 | 右上角"变量监视盒"（IDE watch 风格） | Round 1（Q7） |
| 验收 | 四项自动验收 + 中间产物保留 `explainer-artifacts/<集名>/` | Round 1（Q8） |
| 版本锚 | **`ch02-after` 分支**（= ch02-1-2/1-3 行号锚；VS Code 请切到该分支再对照） | Round 2（Q9） |

### 0.1 四个优先测试及入选理由（摘要，全文见 ch02-1-5 Round 1）

| 组 | 测试（方法名 / 测试文件行号） | 入选理由（与 `setRequiredHeaders` 的相关度） |
| --- | --- | --- |
| A | **A2** `autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`（:85） | 需求主链路：上游对账 CSV 首行为表头 = 自动探测链；完整穿过将来校验插入点 `createHeaders()`（635→637→672），且是 A 组最长主干，其余 A 组测试皆其变奏 |
| B | **B1** `getByNameWithUnknownNameThrowsMappingNotFound`（:143） | 需求要替换的"晚失败"痛点本尊：`Mapping for currency not found` 正是 `CSVRecord.java:137` 这条；看懂它=看懂需求为什么存在 |
| C | **C1b** `duplicateFileHeaderWithDisallowThrowsAtParserCreation`（:210） | ch02-1-3 标注"本热身最关键的一个测试"：`parse()` 调用本身抛错、数据行从未被读——"读第一条记录之前报错"的现成先例，`setRequiredHeaders` 照此时机做 |
| D | **D1** `headerNameWithSurroundingSpacesNeedsExactMatch`（:260） | 直接决定 required 的匹配语义：现状精确匹配不 trim；若校验 trim 而取值不 trim，会"校验过了、`get` 取不到"——新功能必须显式决策的唯一语义点 |

---

## 1. 三个候选方案

### 1.1 方案一「逐调用点分镜 · 代码剧场」（主方案）

- **特点**：把该测试触发的调用链拆成 8–14 个"站点"，每站一帧：深色代码截屏（该行 ±7 行上下文、当前行高亮带、建议断点红点）、顶部"路径 · 方法 · 第 n/N 站"角标、右上角变量监视盒（每集 2–3 次更新）、底部黄色字幕；每站一段 edge-tts 配音，帧停留时长 = 配音时长 + 0.3s（下限 3s）。每集结构：统一片头标题板（约 8s：场景编号+测试名+一句话目标+文档互引）→ 测试代码全貌帧（标出全部站点）→ 逐站点分镜 → 真实运行结果帧（worktree 里实测 mvn 输出）→ 邻居彩蛋帧 → 片尾"建议断点清单 + 互引"板（约 10s）。
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

## 2. 推荐方案及理由

**推荐：方案一「逐调用点分镜 · 代码剧场」，4 集统一采用。**

1. **唯一满足全部已确认硬约束**：Q0(c) 调试预习演（顺序骨架 + 少量快照 + 行号锚点）、M5 ≤180s、M4 分屏可读（1080p 大字号 ≤16 行/帧）、A8 深色+黄色无底字幕、Q7 监视盒、Q8 四项自动验收——方案二受限于时长预算，方案三受限于每帧行数与生成稳定性。
2. **管线最简、一次成功率最高**：Pillow 渲帧 + edge-tts 分段配音 + ffmpeg 拼装，三个环节均已在本机端到端实测通过（含"无 libass → 字幕画帧"的绕行方案）。
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
- **配音**：edge-tts `zh-CN-XiaoxiaoNeural`、`--rate=-10%`（≈3.5–4 字/秒）；每站一段；讲解词正文 400–550 字。
- **合成**：变长帧 concat demuxer（每帧 `duration`，末帧重复一次）+ 每段配音 `apad=whole_dur=<该站时长>` 后串接 → `ffmpeg -f concat -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy out.mp4`。
- **验收四项**：① `ffprobe` 时长 ≤180s 且 h264+aac；② 抽 3 个代码帧重读 `git show ch02-after:<path>` 对应行逐字符比对；③ 每站停留 ≥3.0s、Σ停留与总时长差 ≤0.5s；④ 存 3 张样张 PNG 到 `explainer-artifacts/<ID>/review/`。
- **中间产物**：`explainer-artifacts/<ID>/`（`frames/`、`audio/`、`narration.md`、生成脚本、构建日志）。

---

## 4. 四份提示词（每份独立自包含，可分别复制粘贴给新会话的 agent）

> 使用方式：在**本工作目录**（`/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3`）打开 agent，一次粘贴一份。建议顺序：A2 → B1 → C1b → D1。

### 4.1 提示词 A2（表头从哪来：自动探测链）

````markdown
任务：为 commons-csv 的特征测试 A2（`HeadersCharacterizationTest$HeaderSources#autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉（worktree 别放仓库和当前工作目录里）。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录：`ch02-1-6-explainer-A2-auto-detected-header.mp4`。
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到 `./explainer-artifacts/A2/`（`frames/`、`audio/`、`narration.md`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/A2/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md` 与 `ch02-1-6-*.png`。

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

## 配音（edge-tts，联网）
- 安装：`python3 -m venv .edge-tts-venv && .edge-tts-venv/bin/pip install -q edge-tts`（venv 放 `explainer-artifacts/A2/` 下更整洁）。
- 每站一段：`.edge-tts-venv/bin/edge-tts --voice zh-CN-XiaoxiaoNeural --rate=-10% --text "<该站讲解词>" --write-media audio/s<k>.mp3`
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 400–500 字；片头板配总起一句、片尾板配总结一句。
- edge-tts 联网失败：重试一次；仍失败则停止并报告，禁止悄悄换成 `say`。

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
1. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理）。
2. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
3. 音频：每段 mp3 `ffmpeg -i s<k>.mp3 -af "apad=whole_dur=<d_k>" -ar 24000 -ac 1` 统一规格后按序 concat 成 `audio.m4a`（AAC）。
4. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy ch02-1-6-explainer-A2-auto-detected-header.mp4`

## 验收（四项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/A2/review/`。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词全文（同存 `narration.md`）、四项验收输出、真实踩坑记录。
````

### 4.2 提示词 B1（晚失败痛点：Mapping not found）

````markdown
任务：为 commons-csv 的特征测试 B1（`HeadersCharacterizationTest$NameAccessBoundaries#getByNameWithUnknownNameThrowsMappingNotFound`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录：`ch02-1-6-explainer-B1-mapping-not-found.mp4`。
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到 `./explainer-artifacts/B1/`（`frames/`、`audio/`、`narration.md`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/B1/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md` 与 `ch02-1-6-*.png`。

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

## 配音（edge-tts，联网）
- 安装：`python3 -m venv .edge-tts-venv && .edge-tts-venv/bin/pip install -q edge-tts`（venv 放 `explainer-artifacts/B1/` 下更整洁）。
- 每站一段：`.edge-tts-venv/bin/edge-tts --voice zh-CN-XiaoxiaoNeural --rate=-10% --text "<该站讲解词>" --write-media audio/s<k>.mp3`
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 350–450 字（本集站点少，可把节奏放慢、把"为什么这是痛点"讲透）；片头板配总起一句、片尾板配总结一句。
- edge-tts 联网失败：重试一次；仍失败则停止并报告，禁止悄悄换成 `say`。

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
1. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理）。
2. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
3. 音频：每段 mp3 `ffmpeg -i s<k>.mp3 -af "apad=whole_dur=<d_k>" -ar 24000 -ac 1` 统一规格后按序 concat 成 `audio.m4a`（AAC）。
4. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy ch02-1-6-explainer-B1-mapping-not-found.mp4`

## 验收（四项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/B1/review/`。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词全文（同存 `narration.md`）、四项验收输出、真实踩坑记录。
````

### 4.3 提示词 C1b（早报错先例：parse 时抛出）

````markdown
任务：为 commons-csv 的特征测试 C1b（`HeadersCharacterizationTest$DuplicateAndBlankHeaders#duplicateFileHeaderWithDisallowThrowsAtParserCreation`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录：`ch02-1-6-explainer-C1b-duplicate-header-at-parse.mp4`。
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜。
5. 中间产物保留到 `./explainer-artifacts/C1b/`（`frames/`、`audio/`、`narration.md`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/C1b/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md` 与 `ch02-1-6-*.png`。

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

## 配音（edge-tts，联网）
- 安装：`python3 -m venv .edge-tts-venv && .edge-tts-venv/bin/pip install -q edge-tts`（venv 放 `explainer-artifacts/C1b/` 下更整洁）。
- 每站一段：`.edge-tts-venv/bin/edge-tts --voice zh-CN-XiaoxiaoNeural --rate=-10% --text "<该站讲解词>" --write-media audio/s<k>.mp3`
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 420–520 字；片头板配总起一句、片尾板配总结一句。
- edge-tts 联网失败：重试一次；仍失败则停止并报告，禁止悄悄换成 `say`。

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
1. Pillow 逐站渲 PNG（片头/全貌/证据/结果/彩蛋/片尾板同理）。
2. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
3. 音频：每段 mp3 `ffmpeg -i s<k>.mp3 -af "apad=whole_dur=<d_k>" -ar 24000 -ac 1` 统一规格后按序 concat 成 `audio.m4a`（AAC）。
4. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy ch02-1-6-explainer-C1b-duplicate-header-at-parse.mp4`

## 验收（四项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/C1b/review/`。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词全文（同存 `narration.md`）、四项验收输出、真实踩坑记录。
````

### 4.4 提示词 D1（匹配语义：精确匹配与空格）

````markdown
任务：为 commons-csv 的特征测试 D1（`HeadersCharacterizationTest$RequirementAdjacent#headerNameWithSurroundingSpacesNeedsExactMatch`）生成一集"逐调用点分镜 · 代码剧场"讲解视频，供我看完后到 VS Code（分支 `ch02-after`）单步调试同一测试前，建立"调用顺序地图 + 运行时预期"。全程用中文讲解词（代码标识符保留英文）。

## 硬约束（违反任何一条即失败）
1. 代码库在 `./commons-csv`（相对当前工作目录）。**只读**：禁止修改仓库内任何文件、禁止切分支、禁止提交。
   - 校验锚点：`git -C ./commons-csv rev-parse ch02-after` 必须输出 `24562da2fff56fefd61ec8f6ce352632fb301957`。
   - 读取源码一律 `git -C ./commons-csv show ch02-after:<path>`，不要依赖当前 checkout 状态。
   - 跑 mvn 用临时 worktree：`git -C ./commons-csv worktree add <系统临时目录>/cc-ch02 ch02-after`，结束后 `git -C ./commons-csv worktree remove` 掉。
2. 视频总时长 ≤ 180 秒（硬上限），H.264(`yuv420p`)+AAC 的 `.mp4`，输出到当前工作目录：`ch02-1-6-explainer-D1-exact-match-with-spaces.mp4`。
3. 所有代码帧的代码文本必须**程序化取自** `git show ch02-after:<path>` 的对应行，禁止手抄改写。
4. 先逐一核对下述站点表的"行号 + 语句原文"双锚；不符时以 git show 实测为准修正站点表并在交付报告注明，不要猜（特别是站点 6 的默认值区行号，以实测为准）。
5. 中间产物保留到 `./explainer-artifacts/D1/`（`frames/`、`audio/`、`narration.md`、生成脚本、构建日志）。
6. 除视频和 `explainer-artifacts/D1/` 外，不要在工作目录留下其他文件；不要改动任何既有 `ch02-*.md` 与 `ch02-1-6-*.png`。

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

## 配音（edge-tts，联网）
- 安装：`python3 -m venv .edge-tts-venv && .edge-tts-venv/bin/pip install -q edge-tts`（venv 放 `explainer-artifacts/D1/` 下更整洁）。
- 每站一段：`.edge-tts-venv/bin/edge-tts --voice zh-CN-XiaoxiaoNeural --rate=-10% --text "<该站讲解词>" --write-media audio/s<k>.mp3`
- 讲解词：中文短句、直给，只用最简单的词（Karpathy 提倡的 ASD-STE100 精神，写中文即可）；类名/方法名/变量名口播英文；每站 1–3 句；正文 350–450 字；片头板配总起一句、片尾板配总结一句。
- edge-tts 联网失败：重试一次；仍失败则停止并报告，禁止悄悄换成 `say`。

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
1. Pillow 逐站渲 PNG（片头/全貌/结果/彩蛋/片尾板同理）。
2. `frames.txt`（concat demuxer）：每帧 `file 'frames/f<k>.png'` + `duration <d_k>`，最后一帧再重复一次 `file` 行。
3. 音频：每段 mp3 `ffmpeg -i s<k>.mp3 -af "apad=whole_dur=<d_k>" -ar 24000 -ac 1` 统一规格后按序 concat 成 `audio.m4a`（AAC）。
4. `ffmpeg -y -f concat -safe 0 -i frames.txt -i audio.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -tune stillimage -c:a copy ch02-1-6-explainer-D1-exact-match-with-spaces.mp4`

## 验收（四项全过才算完成，结果写进交付报告）
1. `ffprobe`：duration ≤ 180s，流 = h264 + aac。
2. 抽 3 个代码帧：记录行号区间，重新 `git -C ./commons-csv show ch02-after:<path> | sed -n 'a,bp'` 逐字符比对一致。
3. 每站停留 ≥3.0s；Σ站点停留 + 固定板时长 与最终 duration 差 ≤0.5s。
4. 保存片头/中间/片尾 3 张样张 PNG 到 `explainer-artifacts/D1/review/`。
交付报告（对话里输出）：视频路径与时长、站点表核对结果（含修正记录）、讲解词全文（同存 `narration.md`）、四项验收输出、真实踩坑记录。
````

---

## 5. 使用说明（给你的操作顺序）

1. VS Code 打开 `./commons-csv`，确认分支为 `ch02-after`（行号与视频、ch02-1-2/1-3 全部一致）。
2. 在当前目录下按顺序把 §4.1 → §4.4 的提示词逐份粘贴给新会话的 agent（同等工作目录）；每份独立可执行，顺序无依赖，但按 A2 → B1 → C1b → D1 观看最利于理解递进（来源链 → 痛点 → 先例 → 语义）。
3. 每集看完 → 暂停感兴趣的帧 → VS Code 里按片尾断点清单下断点 → 单步调试同一测试。
4. 改版：直接告诉执行 agent 改哪一帧/哪句讲解词，中间产物都在 `explainer-artifacts/<ID>/`，可增量重生成。
