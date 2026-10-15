# Approved Scenarios 实施方案：`setRequiredHeaders` 验收测试的 TDD 落地

> **任务链**：ch03 已产出 ADR（`ch03-2-adr.md`，裁决 D1–D10）与决策表（`ch03-3-decision-tables.md`，11 规则 / 21 用例）。本文档是阶段 A 产出：勘查事实 + fixture DSL 设计 + 三个候选方案 + 推荐。阶段 B 按推荐方案实施（对话 Round 1，Q0=b 连续式授权）。
> **断言口径**（沿用 ch02/ch03 约定）：异常类型精确断言，消息只断言关键片段。

---

## 1. 前置事实（阶段 A1 勘查结果，全部实地核实）

### F1 仓库与环境

| 项 | 事实 | 核实方式 |
| --- | --- | --- |
| git 工作副本 | `./commons-csv`，HEAD `24562da2`，工作区干净，无需 clone | `git log --oneline -1`、`git status` |
| JDK | OpenJDK 21.0.11（Temurin） | `java -version` |
| Maven | 3.9.16 | `mvn -version` |
| JUnit | Jupiter（版本由 commons-parent 管理，本地仓库解析 5.14.x；`pom.xml:33-36` 仅声明 `org.junit.jupiter:junit-jupiter` 无版本号） | `pom.xml` + `~/.m2/repository/org/junit/jupiter/junit-jupiter-api/` |
| VSCode 测试扩展 | `vscjava.vscode-java-test-0.47.0`（**≥ 0.35.0**，满足关键技术决定 #2 的版本要求）；调试扩展 `vscode-java-debug-0.60.0` | `ls ~/.vscode/extensions/` |
| 构建默认目标 | `defaultGoal = clean verify apache-rat:check japicmp:cmp spotbugs:check pmd:check ...`（`pom.xml:139`）——RAT 许可证检查**默认参与构建** | `pom.xml` |

### F2 测试用例清单（ch03-3 Step 7 复核）

共 **21 个用例**：表 A（build 期）5 个（TC-A1、A1a、A2、A3a、A3b）、表 B（parse 期）15 个（TC-B1、B2a/b/c、B3、B3a、B4、B5、B6、B7a/b/c/d/e/f）、表 C（print 期）1 个（TC-C1）。其中 TC-A1a 在 ch03 里覆盖"传 `null`"与"传空数组"两个子输入（D7 归一化），本文实施为 **2 份 fixture**（`TC-A1a-null`、`TC-A1a-empty`），故 fixture 文件总数 = **22**。

### F3 生产代码插入点（行号为 HEAD `24562da2` 当前值，实施后以 grep 复核为准）

| 插入点 | 类/方法 | 当前行号锚点 | 依据 |
| --- | --- | --- | --- |
| Builder 字段 | `CSVFormat.Builder`（`headers` 字段在 `:249`） | 字段声明区，`recordSeparator`（`:265`）之后 | ch03-2 D7 |
| Builder setter | `setHeader(String...)` 在 `:627-630`，用 `CSVFormat.clone(...)`（`:1446-1447`，null 安全但**不吞空数组**——D7 归一化需手工加 `length == 0 → null`） | `setRecordSeparator` 之后 | ch03-2 D7、E12 |
| 复制构造 | `Builder(CSVFormat)` 在 `:284-307`（`this.headers = csvFormat.headers` 在 `:292`） | 对应行 | copy 链 |
| 私有构造 | `CSVFormat(Builder)` 在 `:1653-1677`（`validate()` 调用 `:1676`） | 对应行 | — |
| 实体字段 | `private final String[]` 区（`duplicateHeaderMode` `:1586` 附近） | `recordSeparator` 之后 | — |
| getter | `getHeader()` 在 `:1899-1901`（`clone()` 或 `null`） | 其后 | E12 |
| validate() | `:2771-2805`，现有表头重复检查块 `:2791-2804` | 块后加 D6 检查 | ch03-2 D6 |
| equals/hashCode/toString | `equals` `:1723-1740`（`Arrays.equals(headers,…)` 链）、`hashCode` `:2080-2090`（`Arrays.hashCode(headers)`）、`toString` `:2702-2745`（`Header:` 段） | 对应位置各加一项 | 值对象完整性 |
| **核心校验** | `CSVParser.createHeaders()` `:628-683`，`for` 循环结束 `:679`、`return` `:682` 之间 | 唯一执行点 | ch03-2 D3/D5、E1/E2/E11 |

**默认值源码复核**（关键技术决定 #4——不信文档、只信源码；与 ch03 文档的声明逐条比对）：

| 配置 | 源码事实 | ch03 文档说法 | 一致？ |
| --- | --- | --- | --- |
| `allowMissingColumnNames` | `Builder` 字段 `:235` 无初始化器 → `false`；`Builder.create()` `:214-222` 未设置 | "默认 false（抛空名）" | ✅ |
| `duplicateHeaderMode` | `Builder.create()` 显式 `ALLOW_ALL`（`:221`） | "默认 ALLOW_ALL（不查重复）" | ✅ |
| `ignoreHeaderCase` / `trim` / `ignoreSurroundingSpaces` / `skipHeaderRecord` | Builder 字段无初始化器 → `false` | "默认 false" | ✅ |
| `headers` 空数组语义 | `getHeader()` javadoc `:1897`"the empty array if to be read from the file" | E8 同 | ✅ |

（ch03 文档无"DISALLOW 默认"类错误——当时即按源码记录；本表作为双重核查留档。）

### F4 fixture 先例

`src/test/resources/org/apache/commons/csv/` 下已有**按主题/issue 编号的目录约定**（`CSV-141/`、`CSV-259/`、`CSVFileParser/`、`empty.txt` 等，全部是**纯数据文件**）。**不存在**"markdown fixture + 解析执行"的 approved/golden-file 模式先例——Approved Scenarios 是**全新引入**。RAT `<inputExcludes>`（`pom.xml:170-198`）已有逐文件豁免与一个通配符先例（`src/test/resources/**/*.bin`），新 fixture 目录照后者加一条通配符即可。

### F5 三条硬约束的落实位置

1. 禁 `@TestFactory`/`DynamicTest`，用 `@ParameterizedTest(name="{0}") + @MethodSource + Named.of`（关键技术决定 #1/#2）→ 落在测试入口类；
2. JUnit 5 参数化调用需先整体 Run 一次才在 Testing 面板展开子节点（#3）→ 写进调试指南 `ch04-3`；
3. 手工表头模式的数据区不重复写表头行（#5）→ 落在 fixture 约定（TC-B3a 设了 skip 所以可以有表头样首行；TC-B7e 故意不设 skip，数据首行会被当数据读——但该用例异常在读数据前抛出，fixture 内加 `Note:` 说明）。

---

## 2. fixture DSL 设计（中文评审者优化，M2）

### 2.1 文件与目录

```
src/test/resources/org/apache/commons/csv/requiredheaders/
  ├── table-a/   # 表 A：build 期（6 份）
  ├── table-b/   # 表 B：parse 期（15 份）
  └── table-c/   # 表 C：print 期（1 份）
```

文件名：`<用例ID>[-子变体]-<英文slug>.approved.md`（如 `TC-A1a-empty-null-normalized.approved.md`）。`.approved.md` 后缀沿袭 Approved Scenarios 命名惯例。

### 2.2 DSL 结构（每份 fixture 的骨架）

```markdown
# <用例ID>：<中文一句话标题>

- 规则：<表-规则号>（<决策表名 · 决策点>）
- 裁决：<ADR 编号>
- Note: <可选的评审提示，如默认值差异、数据构造原因>

## 配置

- header: (auto)
- requiredHeaders: date, amount, currency
- <其余仅写"显式设置"的项，未写 = 用源码默认值>

## CSV 数据

（fenced 代码块原样存放 CSV；或占位符）

## 预期结果

- 结果：parse 失败
- 异常类型：org.apache.commons.csv.CSVException
- 消息包含：Missing required header(s) [currency]
- 消息包含：in [date, amount]
```

### 2.3 占位符语义（在 fixture 与本文档各存一份）

| 占位符 | 出现位置 | 含义（执行器行为） |
| --- | --- | --- |
| `(none)` | `header` / `requiredHeaders` / `CSV 数据` | 未调用对应 setter（字段保持 `null`）/ 本用例无输入 |
| `(empty)` | `requiredHeaders` | 调用 `setRequiredHeaders()`（空数组）——**与 `(none)` 运行时等价**，专测 D7 归一化 |
| `(auto)` | `header` | 调用 `setHeader()` 无参（空数组 = 自动从首行解析，E8） |
| `(null)` | `requiredHeaders` | 调用 `setRequiredHeaders(null)`——与 `(none)`/`(empty)` 三态归一（D7） |
| `(default)` | 布尔/枚举配置 | 不调用该 setter，使用源码默认值（默认值以 F3 复核表为准） |
| 空 fenced 块 `(empty)` | `CSV 数据` | 零字节输入（TC-B7d 空文件） |

### 2.4 预期结果的五种"结果"取值与对应断言

| `结果：` | 执行器动作 | 可选附加断言键 |
| --- | --- | --- |
| `build 通过` | `builder.get()` 正常返回 | `getRequiredHeaders：`（`(null)` 或名单，含顺序） |
| `build 失败` | `assertThrows(<异常类型>, builder::get)` | `消息包含：`（可多行） |
| `parse 成功` | `format.parse(new StringReader(csv))` 构造成功并 `close` | `headerMap 键：`（按序全量比较）；`首条记录：`（可多行 `名=值`） |
| `parse 失败` | `assertThrows(<异常类型>, () -> format.parse(...))` | `消息包含：` |
| `print 成功` | `format.print(sw)` + `printRecord(打印数据)` | `输出：`（fenced 块，按行比较，行结束符不敏感）；`打印数据：` |

**解析器与执行器分离**（阶段 B.3 要求）：`RequiredHeadersScenario` 内部 `parse()` 只做 markdown → 场景对象（纯数据），`execute()` 只做场景对象 → 真实 API 调用与断言；两者互不依赖对方实现细节。

---

## 3. 三个候选方案（差异维度：测试入口如何组织）

> 大前提（Approved Scenarios + `@ParameterizedTest + Named.of`）已由提示词定死，不作为方案差异点。

### 方案一：单入口全量扫描

- **内容**：一个测试类、一个 `@ParameterizedTest` + 一个 `@MethodSource`，递归扫描 `requiredheaders/` 下全部 22 份 fixture，每个 fixture 用 `Named.of("TC-xx · 标题", scenario)` 包装。
- **优势**：脚手架最少（一个方法）；目录即全部真相；新增用例零代码改动（任何子目录丢文件即生效）。
- **劣势**：VSCode Testing 面板里 22 个子节点平铺在一个方法下，无分组——对照 ch03 的三张决策表导航时要靠命名前缀肉眼聚类；任何一个 fixture 解析失败会让整个方法报 error，其余用例结果被淹没。
- **适用场景**：用例数 < 10、或单一决策表、或 CI 为主人工调试为辅。
- **不适用场景**：本任务这种"多决策表 + 22 用例 + 以 VSCode 逐条调试为核心诉求"的形态。

### 方案二：按决策表分组的三个入口（**推荐**）

- **内容**：一个测试类、三个 `@ParameterizedTest(name="{0}")` 方法（`tableA_buildPhase` / `tableB_parsePhase` / `tableC_printPhase`），各自 `@MethodSource` 只扫 `table-a/`、`table-b/`、`table-c/` 子目录；共用同一个 `RequiredHeadersScenario`（解析器+执行器）。
- **优势**：Testing 面板结构 = ch03 决策表结构的镜像（三个组节点各挂 6/15/1 个用例子节点），从面板直达"哪张表哪条规则"；单表可整组 Run/Debug（回归定位粒度 = 决策表）；一个 fixture 损坏只影响所在表的入口，故障隔离；新增用例仍只需丢文件，零代码改动。
- **劣势**：比方案一多两个方法（约 15 行脚手架）；三张表的执行顺序在面板里按方法名字母序而非 A→B→C 语义序（可通过命名 `tableA_/tableB_/tableC_` 前缀解决，本方案即如此）。
- **适用场景**：测试组织需要反映设计文档结构、且调试体验优先的项目——本任务原样命中。
- **不适用场景**：决策表后续拆得更细（比如 >8 张子表）时，方法数膨胀，应退回方案一的目录约定 + 显示名分组。

### 方案三：每用例手写独立方法

- **内容**：为 22 个用例各写一个 `@Test` 方法（或一方法一 fixture 直连），fixture 退化为纯数据附件。
- **优势**：每用例一个静态可见的方法节点，面板不依赖参数化展开；单个用例的断言可以完全定制。
- **劣势**：**违背 Approved Scenarios 的核心价值**——"Validate the test execution logic once. After that, adding new test cases only requires reviewing fixtures"（附录原文）：每加一个用例都要改 Java 代码 + 重新评审执行逻辑；22 个方法的断言代码与 fixture 预期结果双轨维护，正是该模式要消灭的脱节；且提示词"fixture 是测试真正读取并执行的唯一输入"在此方案下不成立。
- **适用场景**：用例逻辑高度异构、无法归一到一种执行器的领域（如混合 UI/DB/文件的 E2E）。
- **不适用场景**：本任务——22 个用例共享同一种"配置 → 动作 → 断言"形状，异构性为零。

## 4. 推荐方案与理由

**推荐方案二。** 三条理由：

1. **调试体验（提示词的优先权重维度）**：三个分组入口让 Testing 面板成为决策表的镜像，评审者/调试者从 ch03 文档的任一规则出发都能在面板里直接定位同名子节点单独 Debug——这正是"每条用例独立可调试"之上的可导航性红利；关键技术决定 #1/#2 的 `@ParameterizedTest + Named.of` 保证每个子节点可独立右键 Debug（本机扩展 0.47.0 ≥ 0.35.0 已核实）。
2. **故障隔离与回归粒度**：单表损坏不影响他表；改 `CSVParser.createHeaders()` 后可只 Run 表 B 快速回归。
3. **保持 Approved Scenarios 的零代码扩用例性质**：与方案三的致命缺陷相反，加用例 = 往对应子目录丢一份 `.approved.md`，评审 = 读 markdown diff。

**实施映射**：阶段 B 的 TDD 循环按"表 A 组 → 表 B 组 → 表 C 组"推进（与三个入口一一对应），生产代码改动严格按 F3 插入点清单 + M4 最小实现（`CSVFormat` 新维度全套 [字段/Builder/getter/复制链/equals/hashCode/toString/validate 一条] + `CSVParser.createHeaders` 末尾校验；`CSVPrinter`/`Lexer`/`CSVRecord` 零改动）。

## 5. CI/CD 如何运行这些测试

- **入口类遵循 Surefire 命名约定**（`*Test.java`），`mvn test` 自动纳入，无需额外配置。
- **RAT**：`pom.xml` 的 RAT 检查默认参与构建（F1）；在 `<inputExcludes>` 既有注释块"These files are used as test data and test result specifications."下、照 `src/test/resources/**/*.bin` 的通配符先例追加一条 `src/test/resources/org/apache/commons/csv/requiredheaders/**/*.approved.md`。fixture 是纯 markdown 测试数据，非可授权源码，与既有豁免同性质。**不使用** `--no-verify` 或跳过插件的方式绕过（关键技术决定 #6）。
- **本地验收命令**：`mvn test`（全量单测）+ `mvn apache-rat:check`（许可证门禁）——两者合计等价于 `mvn verify` 中与本次改动相关的门禁；不跑 `japicmp:cmp`/`spotbugs` 等其余 defaultGoal 目标（与 ch02 基线口径一致，避免无关噪音）。
- **VSCode**：JUnit 5 项目被 `vscode-java-test` 自动发现；首次需对入口类整体 Run 一次以展开参数化子节点（关键技术决定 #3，详见 `ch04-3` 调试指南）。

## 6. 新增测试用例时如何操作

1. 在 `requiredheaders/table-{a,b,c}/` 对应子目录新建 `<用例ID>-<slug>.approved.md`，按 §2.2 骨架填写；
2. 评审该 markdown（这就是全部评审工作量——Approved Scenarios 的核心价值）；
3. 无需改任何 Java 代码：`@MethodSource` 扫描目录、显示名取自 H1 标题；
4. 在 VSCode 里对入口类 Run 一次刷新子节点，即可单独 Debug 新用例。
