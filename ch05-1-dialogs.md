# ch05-1 对话记录

> 由 OpenCode 会话在每轮暂停等待用户澄清回复时自动追加，供用户在回复前回顾完整对话。
> **口径沿用 ch03 Round 1 的 M5 决定**：较长的初始提示词只存摘要 + 指向存档文件；之后的较短对话逐字记录。

---

## Round 0 — 用户（原始请求，摘要）

（完整原文见工作目录下 `ch05-0-prompt.md` 存档。摘要如下：）

- **任务**：资深测试工程师，两阶段。**阶段 A**：为 `./commons-csv` 上 ch03-3 决策表 Step 7 对应的验收测试（ch04 已实现并提交，HEAD `9a1af060`）设计 3 个故障注入测试方案，存 `./ch05-2-solutions-for-fault-injection.md`。**阶段 B**（方案确认后）：按推荐方案实现"注入→验证变红→撤销→验证变绿"可重复自动化脚本 + 手工故障注入指南 `./ch05-3-fault-injection-guide.md`（每测试一条：类名+行号、注入前后代码、期望报错）。
- **两个用途**：① 自动化闭环脚本（注入语义对应故障→测试红且报错信息与被保护行为相关→撤销→绿）；② 人类可读手工注入资料（VSCode 单步用，加深对生产代码理解）。
- **硬约束**：故障必须与测试保护意图**语义对应**，明确反对机械随机变异；3 方案按"故障怎么注入、怎么撤销"技术路线区分；设计前必须事实核查（读调试指南、grep 核实行号、查 pom 是否已集成 PITest）并写进"背景与已确认的前提"；若注入后测试仍绿必须如实说明原因；方案设计阶段不动生产代码、不创建方案文档之外的文件。
- **留空占位符**（须自提建议值并征询）：用途定位、方案区分维度、脚本实现语言、校验严格度。
- **交互协议**：Round 0 假设体检只问一个问题 → 追问轮次推进设计树到前沿清空 → 每次停下把对话追加到本文件；非交互环境可直接采用推荐方案连续执行。

---

## Round 0 — 助手（假设体检 + Q0）

**开场事实核查（非假设，已实地验证）**：

1. `./commons-csv` 存在，HEAD `9a1af060`（"feat: Implement required headers validation in CSVParser and add acceptance tests using approved scenarios"）——**ch04 的生产实现 + 测试 + fixture 已被用户提交入库**，工作区干净；
2. 调试指南（`ch04-3`）关键行号 grep 实地复核**仍然准确、未漂移**：`CSVFormat.java:888`（D7 归一化）、`:2851-2852`（D6 矛盾检查）、`CSVParser.java:687`（命中判定）、`:692`（CSVException 消息）；
3. 被保护对象在位：`RequiredHeadersApprovedScenariosTest`（3 个入口方法）+ `RequiredHeadersScenario`（fixture 解析/执行器）+ **22 份** `.approved.md` fixture（table-a 6 / table-b 15 / table-c 1）；
4. `pom.xml` 只有 JUnit Jupiter + maven-surefire-plugin，**未集成任何变异测试框架**（无 PITest）——"引入变异框架"类方案按从零集成计成本；
5. `ch05-0-prompt.md` 已存档本次提示词原文。

### 1.1 我已默认成立的假设

- **A1 仓库状态冻结**：`./commons-csv` @ `9a1af060`、工作区干净；ch04 全部产出作为"被保护对象"原样使用，故障注入不得对它留下永久改动。
- **A2 "每个测试"的指代**：ch03-3 Step 7 的 21 个用例 = 22 份 fixture（TC-A1a 拆 null/empty 两份）——具体粒度是 Q0，本条只假设"被测集合就是这批"。
- **A3 注入对象是生产代码**（`CSVFormat`/`CSVParser`/`CSVPrinter` 中 required-headers 相关逻辑），**不包括**测试基础设施（`RequiredHeadersScenario` 执行器和 fixture 不是注入对象）。
- **A4 闭环零残留**：全部循环跑完后 `git status` 应回到干净态，除非用户另有要求。
- **A5 四个占位符（用途定位/区分维度/实现语言/校验严格度）视为留空**→ 先给建议值，按提示词要求逐项在追问前沿征询。
- **A6 阶段 A→B 之间有硬检查点**：本章提示词明说"等待我确认选哪个方案再进入实现阶段"（与 ch04 的连续式不同，本章写死了检查点，不再就此发问）。
- **A7 断言口径沿用** ch03/ch04：异常类型精确 + 消息片段——"报错信息与保护意图相关"的机器判定也按消息片段级别做。
- **A8 手工指南读者** = 中文用户、VSCode 单步场景（ch04 M2 先例），条目格式沿用调试指南风格（类名+行号+前后代码+期望报错）。
- **A9 产出落位**：`ch05-2`/`ch05-3`/本 dialogs 文件都在上级章节目录，不进 commons-csv 仓库；自动化脚本与故障配方的落位待问（M7）。
- **A10 回归基线** = ch04 绿证据 #4（`Tests run: 1025, Failures: 0, Skipped: 11`）：注入期间允许只跑目标测试，但最终态必须能复现该基线。

### 1.2 我还缺的关键信息

- **M1 —— "每个测试"的粒度（→ Q0，本轮唯一提问）**：22 份 fixture 逐一 / 约 6–8 个生产代码故障点各选代表 fixture / 3 个入口方法各 1 个。决定闭环数量、手工指南条目数、"红"的判定方式。
- **M2 —— 用途定位（占位符留空）**：一次性教学演示（本书第 5 章素材）vs 长期回归资产 vs 兼顾。影响：脚本健壮性等级、要不要提交进仓库/进 CI、错误处理与日志措辞。
- **M3 —— 方案区分维度（占位符留空）**：预设按"故障怎么注入、怎么撤销的技术路线"（源码级改写+git 撤销 / 构建期替换 / 运行期注入 / 变异框架）区分三方案，需确认或换维。
- **M4 —— 脚本实现语言（占位符留空）**：候选 zsh/bash、Python、Java（JUnit Platform launcher）。结合 Maven+JUnit 生态有倾向，待征询。
- **M5 —— 校验严格度（占位符留空）**：红 = 所在方法失败即可（弱）vs 指定 fixture 的失败信息必须含期望片段（强，机器判定"报错与保护意图相关"）。决定脚本对 surefire 报告的解析深度。
- **M6 —— 故障期间"运行该测试"的隔离范围**：`@ParameterizedTest` 的单个 fixture 无法用 surefire 直接过滤，需设计隔离机制（方法级运行+报告解析 vs JUnit launcher 按显示名过滤）；跑所在方法还是全量 1025 也待定。影响每循环时长与脚本复杂度。
- **M7 —— 脚本与 22 条故障配方的落位/提交策略**：进 commons-csv 仓库（受 RAT/spotbugs 门禁约束，ch04 有 RAT 拦截 fixture 的先例）还是留在上级目录？配方文件什么格式（这本身也是三方案的差异点之一）。

### 1.3 人们处理这类问题最常犯的一个错误

**只验证"变红"，不验证"红的原因"。** 让测试变红太容易了——编译错误、初始化失败、NPE 全都能让测试红，机械变异更是随手就能制造红色。但闭环第二步（失败信息与被保护行为相关）才是区分"测试在保护这段逻辑"和"测试只是能感知到某种变化"的关键。最隐蔽的形态：注入点在路径 A、测试红的原因却是路径 B 的断言——表面"变红→变绿"闭环成立，保护关系其实是错的。

### 1.4 唯一的关键问题

❓ **Q0 - 「依次对每个测试」的粒度——22 份 fixture 全量闭环，还是按生产代码故障点做代表性闭环**: 提示词写"依次对每个测试……为每一个测试提供一份人类可读的故障注入信息"。但 22 份 fixture 的生产代码落点其实只有约 6 处（`CSVFormat:888` 归一化 / `:2851` D6 检查 / `CSVParser:687` 命中判定 / `:692` 消息组装 / `:615-619` map 工厂 / `CSVPrinter:120` 写方向）。同一落点的不同 fixture 保护的是**同一行代码的不同语义侧面**——例如 TC-B7b 保"缺失名单按声明序"（故障可设计成"对 missing 排序"），TC-B7f 保"名单去重"（故障是"删掉 `!missing.contains` 条件"），两个不同故障、同一落点。你要哪种粒度？

选项：

- **(a) 22 份 fixture 全量逐一**：每份 fixture 一个按其保护意图独立设计的故障（允许同落点不同故障），22 个闭环 + 手工指南 22 条。最完整、与 ch03-3"21 用例全覆盖"口径一致；代价是脚本 22×(注入→红→撤销→绿) 个循环，且个别故障较"刁钻"（如 TC-B1"特性默认关闭"只能靠"拆掉门卫条件"反向构造）。
- **(b) 按生产代码故障点约 6–8 个代表性闭环**：每点选信息量最大的 1 个 fixture 做完整闭环，手工指南按故障点组织，每条注明"其余哪些 fixture 也会因此变红"。经济、每个故障典型，但不满足"每一个测试"的字面。
- **(c) 3 个入口方法各 1–2 个**（≤6 个，最小演示）。

➡️ **建议选 (a)。** 理由：本章要把"变红→报错对应→变绿"闭环本身做成可复现的方法论证据（教学素材），粒度 = 22 才能让"每一个测试都在保护对应代码"被**逐条验证**而非抽样验证；而且同落点的"语义侧面故障"（排序 vs 去重）恰好最能演示"语义对应 vs 机械变异"的差异——正是本章的核心命题。代价可承受：自动化循环 22 次在脚本里是分钟级；"刁钻"故障（如 B1 的门卫条件）反而是手工指南的好素材——逼你说清"这个故障为什么这样设计"。

---

**本轮停止**：等待用户答复 Q0（M1）。M2–M7 将在 Q0 答复后作为下一轮前沿问题提出。

---

## Round 1 — 用户（答复 Round 0 的 Q0 与 M1–M7）

M1: 见Q0。
M2: 一次性教学演示。
M3: 按照"故障怎么注入、怎么撤销的技术路线"区分。
M4: 在本机macOS iterm2 zsh里实现起来最为便利的方式选取，用你的最佳判断即可。
M5: 需要"指定 fixture 的失败信息必须含期望片段"。
M6: 用你的最佳判断即可。
Q0: 同意你的建议。

（即：Q0=(a) 22 份 fixture 全量闭环；M2 教学演示；M3 区分维度=注入/撤销技术路线；M4/M6 授权助手判断；M5 强校验；M7 脚本进 commons-csv 仓库且 `mvn test` 不破。）

---

## Round 1 — 助手（前沿重算 + 授权项判断 + 剩余前沿问题 Q1–Q3）

**已锁定**：Q0=(a) 22 份 fixture 全量闭环；M2 一次性教学演示；M3 按"故障怎么注入、怎么撤销"的技术路线区分三方案；M5 强校验（目标 fixture 失败信息必须含期望片段）；M7 脚本进 `./commons-csv` 且 `mvn test` 不破。

**本轮新验证的事实（非假设）**：

1. `mvn -q test -Dtest='RequiredHeadersApprovedScenariosTest#tableA_buildPhase'` 只跑 6 个参数化调用（`Tests run: 6`）——方法级隔离成立；
2. surefire XML（`TEST-*.xml`）里每个参数化调用是**独立的 `<testcase name="tableA_buildPhase(RequiredHeadersScenario)[k]">`**——按调用序号索引；
3. `fixtures()` 用 `Files.list(dir).sorted()`（`RequiredHeadersApprovedScenariosTest.java` `fixtures` 方法）——**索引 k ↔ 排序后的 fixture 文件名是确定性映射**，脚本可自行计算，无需改任何测试代码；
4. 本机 `python3` 3.14.6 在位（Homebrew）；RAT `inputExcludes` 已有 ch04 加的 `requiredheaders/**/*.approved.md` 豁免先例（`pom.xml:193`）。

### 授权项判断（M4/M6，已定，可否决）

- **D-M4 实现语言 = Python 3 单文件驱动脚本（仅 stdlib）**。理由：macOS 自带 python3（已验证 3.14.6）；surefire XML 解析、Java 源码的精确字符串替换、22 条配方（JSON）加载，在 Python stdlib 里都是一等公民；zsh 做这三件事要 sed/grep 拼凑，对"故障点精确到行、替换必须幂等"的场景太脆，教学演示的可读性也差。zsh 里的用法就是一条 `python3 fault-injection/run_faults.py`。
- **D-M6 隔离机制 = 方法级运行 + surefire XML 按索引定位**。故障期间只跑 fixture 所在入口方法（`-Dtest=...#tableX_...Phase`，秒级），从 XML 找第 k 个 `<testcase>`，判定"该 fixture 是否失败 + 失败信息是否含配方声明的期望片段"；22 个循环全部结束后跑一次**全量** `mvn test` 对照基线（1025/0/0/11，A10）。不改任何测试基础设施代码。

### 剩余前沿问题

❓ **Q1 - M7 的"进仓库"是否包含 git commit**: "需要进 commons-csv 仓库"有两种读法：文件放进仓库目录（git 不追踪或未提交），或做成一个正式提交。

选项：

- **(a) 不提交、留工作区**：文件落在仓库内新目录（如顶层 `fault-injection/`），`git status` 保持"untracked/modified"状态，用户评审后自己提交——ch04 的 M3 先例（用户后来自己提交了 `9a1af060`）。
- **(b) 阶段 B 完成后助手直接 commit**：跑完全量回归确认绿后，做一个 `test: add fault injection ...` 提交。
- **(c) 放进仓库但立即加进 `.gitignore`**：不污染 git 状态，但也永远进不了版本历史。

➡️ **建议选 (a)。** 与 ch04 工作流一致（用户保留评审-再提交的控制权）；且注入循环依赖"生产代码文件在循环开始时干净"，脚本会做 preflight 检查，untracked 的脚本文件不干扰 `git checkout --` 撤销。顺带声明：无论选哪个，都会照 ch04 先例给新目录加 RAT 豁免，保证 `mvn verify`（defaultGoal 会跑 `apache-rat:check`）也不破。

❓ **Q2 - "连带变红集合"要不要纳入精确核对（M5 的最后一档）**: 注入 TC-B7b 的"对 missing 排序"故障时，只有 ≥2 个缺失名的 fixture 会红（B7b、B7c…），单个缺失的 B7a 保持绿——**故障的影响面恰好等于"保护同一语义侧面的 fixture 集合"**，这是"语义对应"最强的机器证据。但有些故障（如 TC-B1 的"拆掉门卫条件"）会让表 B 一大片变红。强校验要不要再进一档？

选项：

- **(a) 纳入**：每条配方声明"预期变红清单"（含目标 fixture + 连带 fixture），脚本核对实际变红集合**恰好等于**预期清单（多了少了都算闭环失败）。影响面推演由助手做、写进配方；若实测与推演不符，修推演或如实记录并分析原因。
- **(b) 不纳入**：只核"目标 fixture 红 + 消息含片段；撤销后全绿"。连带红多少不管。

➡️ **建议选 (a)。** 这是本章最能区分"语义对应故障"与"机械变异"的证据：机械变异的连带红面是随机的，语义故障的连带红面是可推演的。22 张影响面推演本身也是手工指南里"为什么这个故障这样设计"的最佳素材。代价是阶段 B 要逐条推演（助手来做），且推演错误的迭代成本由脚本运行暴露（这恰是想要的）。

❓ **Q3 - 运行证据要不要落盘为章节产物**: 脚本跑 22 个闭环会产出"注入→红（含消息片段比对）→撤销→绿"的完整台账。

选项：

- **(a) 落盘**：脚本自动写一份运行台账到章节目录（如 `./ch05-4-fault-injection-run.log`，沿用 `mvn-baseline.log` 先例），作为本书红/绿证据的可追溯存档。
- **(b) 只在终端打印**：不留文件。

➡️ **建议选 (a)。** ch04 的红/绿证据靠对话记录留档（人工转述）；本章有脚本，可以自动生成结构化证据（每个 fixture 一行：注入点、红/绿判定、消息片段命中、连带集合核对结果），对教学演示（M2）价值直接。

---

**本轮停止**：等待用户答复 Q1–Q3。答复后前沿预计清空，进入阶段 A（事实核查 + 三方案设计文档 `./ch05-2-solutions-for-fault-injection.md`）。

---

## Round 2 — 用户（答复 Round 1 的 Q1–Q3）

Q1-Q3: 都同意你的建议。

（即：Q1=(a) 不提交留工作区；Q2=(a) 连带变红集合精确核对；Q3=(a) 台账落盘 `./ch05-4-fault-injection-run.log`。前沿清空，进入阶段 A。）

---

## Round 2 — 助手（前沿清空 → 执行阶段 A → 产出方案文档 → 停在检查点）

**前沿重算**：Q1/Q2/Q3 均采纳建议。设计树的全部决策节点已定：Q0=(a) 22 全量 / M2 教学 / M3 路线区分 / D-M4 Python3 / M5 强校验 / D-M6 方法级+XML 索引 / M7 进仓库 / Q1=(a) / Q2=(a) / Q3=(a)。**前沿清空**，按协议执行阶段 A。

**阶段 A 补充事实核查**（在 Round 0/1 已核事实之上）：

1. 生产代码五个落点逐段读取确认（与 ch04-3 调试指南完全一致，无漂移）：`CSVFormat.java:886-890`（setter+`:888` 归一化）、`:2851-2852`（D6）、`CSVParser.java:615-619`（map 工厂）、`:683-694`（required 校验块）、`CSVPrinter.java:120-122`（表头输出）。
2. `RequiredHeadersScenario.java` 全文读取——**失败信息形态**确认：`assertFragments` 失败消息自带 `"<caseId>: 消息应包含 <片段>，实际是 <…>"` 前缀（`:257-263`），强校验可锚定到具体 fixture；"预期异常未抛"报 `Expected ... to be thrown, but nothing was thrown`；"parse 成功"类 fixture 被击中时以 `<error>` 形态（异常穿透）出现。
3. `pom.xml`：parent = commons-parent 105；surefire 仅配了 excludes；JUnit Jupiter 5.14.4（classpath 实证）；无 PITest；defaultGoal 含 `apache-rat:check` 等。

**三方案设计**（区分维度 = M3"注入/撤销技术路线"，详见 `./ch05-2-solutions-for-fault-injection.md`）：

- **方案一：源码精确文本替换 + git 撤销**（编译期·手工语义故障）——`fault-injection/faults.json`（22 条配方：original/faulted 精确片段、期望失败片段、预期连带变红集合、设计理由）+ `run_faults.py`（stdlib：preflight→注入→方法级跑测试→XML 三重断言→try/finally `git checkout` 撤销→变绿验证→全量基线对照→台账落盘）；pom 仅加一行 RAT 豁免。
- **方案二：PITest 变异测试框架**（编译期·框架生成故障）——pom 加 `pitest-maven` + `pitest-junit5-plugin`，字节码算子级变异 + killing 报告；源码零接触、有 survived 盲区清单，但语义对应/逐 fixture 片段校验/连带集合核对/手工同构四项硬要求全踩。
- **方案三：运行期 Java Agent 字节码替换**——影子源码 + javac 预编译 + premain ClassFileTransformer 按 `-Dfault=` 换字节码，`-DargLine` 挂 agent；工作区零接触、故障切换零重编译，但四层设施认知负担最高、VSCode 行号错位、一条命令复现最弱。

**推荐：方案一**。理由逐条对应背景决策（文档 §4 给出 11 条对应 + 对照表）：M5+Q2 强校验只有方案一/三能落地，M7 构建侵入最小（1 行 RAT 豁免），A8 手工同构是方案一独占优势（故障=源码 diff=指南内容），M2/M4 一条 `python3 fault-injection/run_faults.py` 复现；方案二与任务红线（语义对应）正面冲突，方案三与教学演示定位倒挂。

**本轮停止**（阶段 A→B 硬检查点，A6）：等待用户确认方案。确认方案一后进入阶段 B：逐条推演 22 条语义故障（含连带面）→ 实现 `faults.json` + `run_faults.py` → 跑全量闭环产出台账 → 产出 `./ch05-3-fault-injection-guide.md`。

---

## Round 3 — 用户（确认方案）

确认方案一

---

## Round 3 — 助手（阶段 B：实现 → 两轮全量闭环 → 手工指南 → 交付）

**事实补充**（实现前）：22 份 fixture 全文读取（B2a 与 B2c 数据完全相同；B7b 声明序恰为字母序；各 fixture 的消息片段断言各不相同——直接影响连带面推演）；`CSVFormat.java:2851-2853` 精确文本；22 个候选注入片段在源码中的唯一性逐一 grep 核实（初测两处缩进猜错即改）。

**实现（均在 `./commons-csv` 内，Q1=(a) 不提交留工作区）**：

1. `fault-injection/faults.json`——22 条配方：`id` / `table` / `method` / `file` / `line`（注入前行号）/ `original`+`faulted`（精确片段，要求恰好出现一次）/ `expectedFragments` / `expectedRedSet` / `why`（故障与保护意图的语义对应说明）。
2. `fault-injection/run_faults.py`——Python 3 stdlib 驱动器：preflight（git 干净 + 片段唯一）→ 注入（bytes 安全替换）→ 方法级 `mvn test -Dtest=...#method` → 解析 surefire XML（`fixtures()` 的 `Files.list().sorted()` 确定性排序 ↔ XML `<testcase>` 文档序，逐 fixture 定位）→ 三重校验（目标失败 / 失败消息含全部期望片段 / **实际变红集合 == 推演集合**）→ try/finally `git checkout` 撤销 + 字节级还原校验 → 变绿验证；末尾全量 `mvn test` 对照基线；台账写 `../ch05-4-fault-injection-run.log`；支持单条运行（`python3 fault-injection/run_faults.py TC-B4`）。
3. `pom.xml` 加一行 RAT 豁免 `fault-injection/**`（照 ch04 先例，`mvn verify` 亦不破）。

**第一轮全量：19/22**。三个失败全是表 A 的 getter 断言类，且全是"故障对了、预测的失败层/连带面错了"：

- TC-A1a-empty / TC-A1a-null：故障确实击中目标且连带面正确，但失败发生在 `builder.get()` 的 **D6 检查**（`Required headers [] are set...`）而非预判的 getter `assertNull`——归一化失效后未归一名单被 D6 更早拦截，本身是 D7×D6 联动的更好证据 → 修正配方期望片段。
- TC-A1（Builder 字段默认值 `= new String[0]`）：实测 `ExceptionInInitializerError`，表 A 6/6 全红——`CSVFormat` 静态构造也走 Builder，D6 在类初始化期拒绝非 null 默认值。连带面与保护意图无关，判为不合格语义故障 → **换故障点**：改打 `getRequiredHeaders()` 的 null 分支（连带面 = 3 个 getter null 契约用例）。

**第二轮全量：22/22 全部闭环成功**（变红 + 片段命中 + 连带集合精确相等 + 撤销后变绿），末尾全量回归 `Tests run: 1025, Failures: 0, Errors: 0, Skipped: 11` 与 ch04 基线一致。台账：`./ch05-4-fault-injection-run.log`。代表性连带面（实测=推演）：TC-B3 命中判定故障红 7 个"命中侧"用例（本就缺列的 B7c/d/e/f 保持绿）；TC-B7a 单缺失阈值故障红 4 个"单缺失家族"；TC-B7b/B7c 同落点不同侧面（顺序 vs 完整性）连带面相同（B4/B7b/B7c/B7d）；TC-B1/TC-B7f 是全表最窄故障（仅目标自身）。TC-B1 的 JVM helpful NPE 消息直接点名 `requiredHeaders`。

**手工指南**：`./ch05-3-fault-injection-guide.md`——22 条逐一：类名+行号（附 grep 重定位命令）、注入前/后代码、设计理由、**实测**期望报错、连带变红清单与机制；§4 如实记录三处修正（含第一版 TC-A1 引爆类初始化的教训与揭示的代码事实）；§5 零残留与基线；§6 行号时效。

**工作区终态**：`M pom.xml`（RAT 豁免一行）+ untracked `fault-injection/`（脚本+配方），生产 Java 代码零改动；ch04 产出未被触碰。

**本轮停止**：等待用户评审四份产出（`ch05-2` 方案文档 / `fault-injection/` 脚本与配方 / `ch05-3` 手工指南 / `ch05-4` 运行台账）。确认后可自行提交（Q1=(a) 口径：评审-再提交的控制权在用户）。
