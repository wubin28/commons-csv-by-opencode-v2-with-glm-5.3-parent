# ch04-1 对话记录

> 由 OpenCode 会话在每轮暂停等待用户澄清回复时自动追加，供用户在回复前回顾完整对话。
> **口径沿用 ch03 Round 1 的 M5 决定**：较长的初始提示词只存摘要 + 指向存档文件；之后的较短对话逐字记录。

---

## Round 0 — 用户（原始请求，摘要）

（完整原文见工作目录下 `ch04-0-prompt.md`，306 行级别存档。摘要如下，供快速回顾：）

- **任务**：资深 Java 测试工程师，两阶段。**阶段 A**：对 `./commons-csv` 做 6 项必做勘查（git 状态 / ch03-3 Step 7 用例清点 / 插入点行号 / `src/test/resources` 先例 / IDE 扩展版本 / 前置事实小节），设计 3 个方案（差异维度 = "测试入口如何组织"）+ 推荐一个，存 `./ch04-2-solutions-for-approved-scenarios.md`。**阶段 B**：按推荐方案 TDD 实现生产代码 + markdown fixture DSL + 解析器/执行器 + `@ParameterizedTest + @MethodSource + Named.of` 测试入口类，全量回归（不许 `--no-verify` 绕过），产出 `./ch04-3-debug-guide-for-approved-scenarios.md` 调试指南（每用例真实行号断点 + 行号对照表）。
- **需求**：`CSVFormat.Builder.setRequiredHeaders(String...)`——解析时发现表头缺列，在读第一条记录之前抛出说明缺失清单的错误（ch03 已完成 ADR D1–D10 + 决策表 11 规则/21 用例设计）。
- **硬约束**：Approved Scenarios 模式（fixture 即评审材料即测试唯一输入）；TDD 红/绿/重构；每用例在 VSCode Testing 面板独立可 Debug；**禁用 `@TestFactory + DynamicTest`**（vscjava 扩展已知缺陷，issue #1282/#1643）；用 `@ParameterizedTest(name="{0}") + Named.of`；不轻信文档默认值必须查源码（真实踩坑：文档 DISALLOW vs 源码 ALLOW_ALL）；显式表头时 CSV 数据不重复写表头行（除非设 skip）；RAT 许可证插件需给 fixture 目录加白名单。
- **交互协议**：Round 0 假设体检只问一个问题 → 追问轮次推进设计树到前沿清空 → 每次停下把对话追加到本文件。非交互环境下可直接采用推荐方案连续执行。

---

## Round 0 — 助手（假设体检 + Q0）

**开场事实核查（非假设）**：

1. `./commons-csv` 存在，HEAD `24562da2`（kata 特征测试提交），工作区干净；
2. 上级仓库已把 ch03 全部产出**原样提交**（commit `9368c84` "docs: generate adr and decision table docs"，`git diff` 为空——两份文档零修改）；
3. `ch04-0-prompt.md` 已存档（本次提示词原文）；
4. `src/test/resources/` 存在（内含 `org/` 目录）——fixture 有现成资源目录先例可循；
5. `src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` 存在（ch02 热身产物，ch03 文档的安全网基线引用它）。

### 1.1 我已默认成立的假设

- **A1 仓库复用**：`./commons-csv`（HEAD `24562da2`，工作区干净）直接使用，不重新 clone；每阶段开工前复核状态。
- **A2 实施规格冻结**：规格 = `ch03-3-decision-tables.md` Step 7 的 **21 个用例** + `ch03-2-adr.md` 的 **D1–D10**（含消息模板）——只转化、不重新设计（提示词明说）。
- **A3 基线已被你接受**：你把 ch03 产出**原样提交**（`9368c84`，零修改），我视作"评审通过、基线冻结"；若有异议，随 Q0 答复指出裁决编号（D1–D10）或用例编号。
- **A4 本章解除生产代码禁令**：ch03 的"只调研不改码"在本章解除；改动范围以 ch03-2 影响清单为参考上限（`CSVFormat` 字段/Builder/getter/`validate` 一条 + `CSVParser.createHeaders` 末尾校验）。
- **A5 dialogs 口径沿用 ch03**：初始提示词只存摘要+指向 `ch04-0-prompt.md`，之后的短对话逐字记录。
- **A6 环境事实我自查**：JDK/maven/JUnit 版本、RAT 插件配置、`src/test/resources` 先例（已确认存在 `org/` 目录）、VSCode 扩展版本——全部在阶段 A1 勘查，不问你。
- **A7 落位跟随先例**：新增测试代码落在 `kata` 包先例旁（`org.apache.commons.csv.kata` 已存在，`HeadersCharacterizationTest` 是上一章热身的产物），命名随仓库风格。
- **A8 调试入口技术已定死**：`@ParameterizedTest(name="{0}") + @MethodSource + Named.of`（关键技术决定 #2），不是方案变量。
- **A9 git 提交有先例**：commons-csv 仓库内的 kata 测试提交（`24562da2`）与上级仓库按章提交都存在——本章默认沿用 TDD 小步提交（粒度见 M3）。
- **A10 断言口径沿用**：异常类型精确断言、消息只断言关键片段（ch03/热身约定）。

### 1.2 我还缺的关键信息

- **M1 —— 放行节奏（→ Q0，本轮唯一提问）**：阶段 A 文档完成后，是停下等你批准方案再进阶段 B，还是连续执行到最后一起评审？影响整个执行结构与两次交付的间隔。
- **M2 —— fixture DSL 的评审语言**：fixture 是"产品经理评审材料"——评审者是中文的你，还是未来英文的上游社区（若此成果计划提 PR 回 commons-csv）？影响 21 份 fixture 的字段名/说明语言及调试指南的侧重。
- **M3 —— TDD 提交粒度**：每个红绿循环一个 commit / 全部完成后单 commit / 不提交留工作区？影响 git 历史、"红"证据的留存方式（不提交则红只能靠对话记录佐证）。
- **M4 —— 生产实现规模**：我预计最小实现 ≈ ch03-2 改动清单（`CSVFormat` 新维度 + `createHeaders` 末尾校验，含 equals/hashCode/toString 复制链是否维护由我在方案文档里裁决并说明）；若你有更大/更小的预期，随 Q0 说明。影响 diff 大小与红绿循环步数。
- **M5 —— 调试指南的"已验证"边界**：我会在本机核实行号与行为；你的 VSCode 扩展版本若与我核查到的不同，"先整体 Run 一次再展开子节点"的提醒是否要按版本写死？影响指南措辞的适用范围声明。

### 1.3 人们处理这类问题最常犯的一个错误

**把自己的设计文档当成已核实的代码事实。** 提示词关键技术决定 #4 记录的真实案例——文档写"默认 DISALLOW"、源码实际 `ALLOW_ALL`——就是它。本任务里这个错误更隐蔽：ch03 的 ADR 和决策表**正是我自己上一章写的**，"作者盲信"比"读者盲信"更难自我察觉（我写时核实过，但代码、行号、记忆三者都可能漂移）。解毒剂就是阶段 A1 的强制勘查：每个默认值、每个插入点行号，都重新打开源码数一遍，而不是引用自己文档里的引用。

### 1.4 唯一的关键问题

❓ **Q0 - 放行节奏——阶段 A 之后要不要停下来等你批准**: 你的提示词写"阶段 B（在方案确定后）……如果非交互式环境，直接采用推荐方案继续"——交互环境下这个"方案确定"可以有三种解读。你希望哪种节奏？

选项：

- **(a) 检查点式**：我完成阶段 A 的勘查 + 三方案设计文档后**停下**，你批准推荐方案（或改选），我再进阶段 B。
- **(b) 连续式**：全授权连续执行 A→B，产出全部四份交付（方案文档、fixture+代码、调试指南、dialogs），你最后统一评审（ch03 的 Q0=c 先例）。
- **(c) 混合式**：阶段 A 文档我先交付，但只在对话里给你"推荐方案 + 三条理由"的摘要；你不回复即视为默认，我继续 B（避免阻塞，但留否决窗口）。

➡️ **建议选 (b)。** 理由：本任务的方案差异维度被提示词收得很窄——只在"测试入口如何组织"，且关键技术决定 #1/#2 已把实现钉死在 `@ParameterizedTest + Named` 上；**生产代码行为则完全由已冻结的 ch03 ADR 决定，与方案选择无关**。也就是说，选错方案的返工面只剩测试脚手架（一个测试入口类 + fixture 组织），成本很小——而检查点式给你带来的等待成本反而更高。加上你在 ch03 明确选择了"授权制 + 最终评审"且实践顺利（产出原样提交、零修改），(b) 与你的实际工作流最匹配。M2–M5 若无特别说明，我将按建议答案处理（中文为主英文键的 fixture DSL、每红绿循环一 commit、按 ch03-2 清单的最小实现、指南按通用措辞+附本机版本事实）。

---

## Round 1 — 用户（答复 Round 0 的 Q0 与 M1–M5）

M1: 见Q0。
M2: 评审者是中文的我。
M3: 不提交留工作区。
M4: 按你说的最小实现即可。
M5: 需要。
Q0: 同意你的建议。

---

## Round 1 — 助手（前沿清空 → 连续执行阶段 A + 阶段 B → 交付）

**前沿重算**：Q0=(b) 连续式；M2 中文评审者（fixture DSL 中文键）；M3 **不提交、留工作区**（红/绿证据以测试运行输出留档）；M4 最小实现；M5 调试指南需含"先 Run 展开"提醒 + 本机版本事实。前沿清空，按约定连续执行。

**阶段 A（勘查 + 方案，产出 `./ch04-2-solutions-for-approved-scenarios.md`）**，关键事实：

1. 环境：JDK Temurin 21.0.11、Maven 3.9.16、JUnit Jupiter（commons-parent 管理，本地解析 5.14.x）、`vscjava.vscode-java-test-0.47.0`（≥0.35.0 ✓）、`vscode-java-debug-0.60.0`。
2. ch03-3 Step 7 复核：21 用例（表 A 5 / 表 B 15 / 表 C 1）；TC-A1a 含 null/空数组两个子输入 → 落地为 2 份 fixture，共 **22 份**。
3. 默认值双重核查（关键技术决定 #4）：ch03 文档全部默认值声明与源码一致（`allowMissingColumnNames=false`、`duplicateHeaderMode=ALLOW_ALL`、`ignoreHeaderCase/trim/skipHeaderRecord=false`），无 DISALLOW 类错误——勘查表留档。
4. `src/test/resources` 有按 issue 编号的数据目录先例，但**无** markdown fixture 执行先例——Approved Scenarios 全新引入；RAT `<inputExcludes>` 有通配符先例（`**/*.bin`）。
5. 三方案（差异维度 = 测试入口组织）：① 单入口全量扫描；② **按决策表分组的三个入口（推荐）**——Testing 面板镜像 ch03 三张决策表、单表可整组回归、保持"加用例零代码"性质；③ 每用例手写方法——违背 Approved Scenarios 核心价值（加用例要改代码），排除。
6. DSL：中文键（表头/必需表头/忽略表头大小写/…/结果/异常类型/消息包含/表头映射键/首条记录/输出行/打印数据）+ 英文占位符（`(none)/(null)/(empty)/(auto)`）。

**阶段 B（TDD 实现，全部改动未提交——M3）**：

- **循环 0（存储桩）**：`CSVFormat` 加 Builder 字段/setter（含 D7 归一化：null/空数组→null）/getter/复制链——纯存储，无校验。写 22 份 fixture + `RequiredHeadersScenario`（解析器/执行器分离）+ `RequiredHeadersApprovedScenariosTest`（3 个 `@ParameterizedTest(name="{0}") + @MethodSource + Named.of` 入口）。
- **红证据 #0a**：RAT 拦截 22 个 UNAPPROVED fixture（关键技术决定 #6 预判命中）→ 照 `**/*.bin` 先例在 `pom.xml` 加 `requiredheaders/**/*.approved.md` 通配豁免（不用任何 skip 绕过）。
- **红证据 #0b**：编译错误两处——项目目标是 Java 8，`Path.of` 不可用（换 `Paths.get`）；方法引用不能抛受检异常（加 `parseUnchecked` 包装）。又一课：不假设环境。
- **红证据 #1**：`Tests run: 22, Failures: 9`——TC-A2（预期 IAE 未抛）+ 表 B 8 例（预期 CSVException 未抛），其余 13 绿。中途发现并修复执行器自身 bug（`表头映射键` 未切分，导致 B3/B3a/B5 误红）后得到精确 9 红。
- **绿证据 #2**：`validate()` 加 D6 检查（`CSVFormat.java:2851-2853`）→ 8 红。
- **绿证据 #3**：`createHeaders()` 末尾加核心校验（`CSVParser.java:683-693`，结构检查循环之后、return 之前）→ `Tests run: 22, Failures: 0`。
- **重构**：equals/hashCode/toString 各补一维（值对象完整性）。
- **绿证据 #4（全量回归）**：`mvn test` → **`Tests run: 1025, Failures: 0, Errors: 0, Skipped: 11`**（基线 1003 + 新 22，跳过数与基线一致），BUILD SUCCESS，RAT 随生命周期放行。
- **产出 `./ch04-3-debug-guide-for-approved-scenarios.md`**：3 个生产断点（BP-1 `CSVFormat.java:888` 归一化 / BP-2 `:2851` D6 / BP-3 `CSVParser.java:687` 命中判定）+ 22 用例逐一的观察变量与规则对应 + 测试执行逻辑 3 断点（T-1 `RequiredHeadersScenario.java:89` 解析 / T-2 `:166` 分发 / T-3 `:257` 断言终点）+ 行号对照表（行号全部 grep 实地核实）。
- **工作区改动**（未提交）：`pom.xml`、`CSVFormat.java`（+49）、`CSVParser.java`（+14）、新增 2 个测试类 + 22 份 fixture。

**本轮停止**：等待用户评审四份产出（方案文档 / fixture+代码 / 调试指南 / 本对话记录）。任何裁决级修改（如消息模板、归一化语义）只需改 fixture 期望与对应生产行，追溯链见调试指南 §5。
