# ch03-1 对话记录

> 由 OpenCode 会话在每轮暂停等待用户澄清回复时自动追加，供用户在回复前回顾完整对话。

---

## Round 0 — 用户（原始请求）

（内容与工作目录下 `ch03-0-prompt.md` 相同，为保持本文件自包含，原文照录如下。）

当前目录为

```
@/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3
```

。请按照下面的要求完成任务，并在你每一次停下来等待我回复你的澄清问题时，将上一次追加前你我之间的完整对话（包括下面的Round 0）以markdown格式追加到

```
<DIALOGS>.md（可以使用./ch03-1-dialogs.md）
```

文件（如果这个文件不存在，就新建）末尾，以便我在回复你的问题前仔细阅读。下面是要求：

## 1. Round 0（假设体检）

在开始设计树之前，先执行 Round 0（假设体检）。

1.1 列出我下面要求里没有明说、但你已默认成立的假设（逐条编号，形如：A1、A2、A3……）；
1.2 列出你还缺哪些关键信息，并说明每条信息会如何改变你的方案（逐条编号，形如：M1、M2、M3……）；
1.3 指出人们处理这类问题时最常犯的一个错误；
1.4 只提一个最关键的问题 —— 这个问题要能帮你搞清我的真实目标和具体处境，而并非最后给我一份谁都能套用的通用建议。这个问题的格式如下：

```
❓ **Q0** - **<问题标题>**: <问题正文，可能包含多个段落及选项>

➡️ <你的建议答案>
```

## 2. 推进设计树

Round 0 只问上述这一个问题，不要提前问别的。我回答后，你再按追问的常规轮次（frontier / 编号问题 / 推荐答案）推进设计树，直到前沿清空。

## 3. 追问

按下面追问的要求追问我的诉求：

---
名称: 追问
描述: 针对某项计划、决策或想法，对用户进行深入且严密的追问。适用于用户希望压力测试其思路，或使用了任何触发"追问"模式的关键词句时。
---

对用户进行持续、深入的追问，直到双方达成共识。将此过程构建为一棵**决策树**：每一项决策都会衍生出后续相关的决策分支。

按**轮次**推进这棵树的构建。**前沿（frontier）**指的是那些前提条件已确定的决策——即你可以**立即**提问、而无需猜测尚未获知答案的问题。在每一轮中，提出"前沿"上的所有问题：为每个问题编号并给出你的建议答案。随后等待用户回答，再进入下一轮。

每个问题的格式应如下所示：

```
❓ **Q1** - **<问题标题>**: <问题正文，可能包含多个段落及选项>

➡️ <你的建议答案>
```

用户在每一轮的回答都会重塑决策树：已确定的决策会将"前沿"向外推进，并解锁那些依赖于这些决策的问题。重新计算"前沿"并进行下一轮提问。如果某个问题的答案依赖于本轮中尚未确定的另一个问题，则该问题应归入**后续**轮次，而非当前轮次。

发掘**事实**是你的职责，绝非用户的职责。当"前沿"上的某个问题需要获取环境（如文件系统、工具等）中的事实信息时，应指派子代理（sub-agent，如果有的话）去查找；切勿向用户询问你自己就能查到的信息。不要因此停滞不前：正在进行的探索属于尚未确定的前提条件，因此只有依赖于该探索结果的后续问题才需要等待子代理的报告；你可以立即提出"前沿"上的其他问题。**决策**权在于用户：将每一项决策提交给用户，并等待其回应。

## 4. 我的诉求

任务：用决策表测试法为 commons-csv 的 `required headers` 新需求设计验收测试用例

你是一名资深测试架构师，要为 Apache Commons CSV 代码库里一个尚未实现的新需求，设计验收测试用例。你要用**决策表测试法**（Decision Table Testing）来保证测试用例推导过程清晰、全面、不遗漏，而并非凭直觉随手列几个例子。

本提示词末尾的"附录 A：决策表测试法指南"包含你需要的全部方法论知识，**不要去网上搜索其他资料，只依据附录 A 和你自己对代码库的实地核查来完成任务**。

## 背景资料

- 子域分析文档：
```
<SUBDOMAINS_DOC_PATH>（即上一章的产出./ch02-2-2-subdomains.md）
```
（请阅读该文档以了解 CSVFormat / CSVParser / CSVRecord / Lexer 等类在这个代码库里分别承担什么职责，哪些是"核心业务逻辑"，哪些是"支撑性配置"）

- 影响分析文档：
```
<IMPACT_ANALYSIS_DOC_PATH>（即上一章的产出./ch02-2-3-impact-analysis.md）
```
（请阅读该文档以了解这次新需求会牵动哪些类、哪些类不受影响）

## 代码库

本机路径：

```
<COMMONS_CSV_REPO_PATH>（即上一章使用的./commons-csv）
```

把仓库克隆到你当前的工作目录下，然后在克隆下来的副本里做下面的"代码核查"。

**重要：你只能做调研和设计，不能修改/实现这个需求的源码**（即不要去改 `CSVFormat.java`、`CSVParser.java` 等任何生产代码文件）。你唯一要产出的是两份 Markdown 设计文档（见下文"产出要求"）。

## 需求描述

> 我在维护 Apache Commons CSV。我们对账时，上游 CSV 文件应当包含若干固定列（比如 `date`、`amount`、`currency`）。我想给 `CSVFormat.Builder` 加一个新方法 `setRequiredHeaders(String...)`：解析 CSV 时，一旦发现表头缺少这些列，就在读到第一条记录之前抛出一个清楚说明"缺了哪些列"的错误，而不用等业务代码调用 `record.get("currency")` 时才报一个语言含糊的"Mapping for currency not found"式的错误。

这个需求目前**完全没有在源码里实现**（`requiredHeaders`、`setRequiredHeaders` 这两个名字在代码库里还不存在）。

## 第一步：代码核查（在写任何文档之前必须先做）

在你克隆后的上述代码库的本地副本里，至少核查以下事实，并在后续文档里引用你核查到的具体证据（类名、方法名、真实的异常消息文本），而并非凭空假设：

1. `CSVParser.java` 里 `createHeaders()` 方法（或等价的构建表头映射的方法）现在是怎么处理"空列名"和"重复列名"这两类表头结构问题的——抛什么类型的异常？异常消息长什么样？检查发生在循环的什么位置（逐列检查还是全部读完才检查）？
2. `CSVFormat.java` 里 `validate()`（或等价的构造期自检方法）现在校验哪些内容？这些校验是否都不依赖"真实输入数据"，只依赖"声明本身的形状"？
3. `ignoreHeaderCase` 这个配置项，在构建"列名 → 列序号"映射表时是怎么生效的（具体看用的是什么 `Map` 实现、什么比较器）？
4. 表头到底有几种配置模式（例如"自动从首行解析"vs"手工指定表头数组"），这几种模式最终是否会汇入同一段处理逻辑？
5. 和重复表头相关的枚举/配置（如果存在）有哪几个取值？各自的语义是什么？
6. 现有的异常体系里，是否存在"受检异常"和"非受检异常"两类，分别用在什么场景？

把这些核查结果当作你接下来所有设计决策的**事实依据**——你后面写的每一条决策理由，都应该能够追溯到这一步核查到的具体代码行为，而并非"我觉得应该这样"。

## 第二步：先处理需求里没有讲清楚的开放设计问题（产出 ADR 文档 1）

这类"需求挂在一个类的 API 上，但真正的业务规则该不该落在别的类里、该不该与现有某个配置项交互"的问题，往往有好几个关键细节是需求原文没有明说的。在动笔设计决策表之前，你需要先自己识别并裁决这些开放问题（**务必优先**点对点回答上述“影响分析文档”`<IMPACT_ANALYSIS_DOC_PATH>（即上一章的产出./ch02-2-3-impact-analysis.md）`列出的“开放设计问题”），形式上做成一份轻量的 ADR（Architecture Decision Record，架构决策记录）。

**至少要覆盖以下问题**（如果你在第一步核查代码时发现了需求原文没提到、但确实需要裁决的额外问题，也要一并补充进来，不要漏掉）：

1. 异常类型：复用现有的异常类型（保持风格一致），还是新增一个专门的异常类型（让调用方可以精确 `catch`）？两者各有什么代价？
2. 大小写敏感性：必需列的名字比较，要不要尊重 `ignoreHeaderCase` 这个已有配置？
3. 与现有"重复列名""空列名"校验的交互顺序：如果同一次解析里，既有结构性表头错误，又缺必需列，应该先报哪个错？为什么？
4. 对称性问题：如果有人用同一份配置去"写" CSV（而并非"读"），要不要也校验一下要写的数据包含这些必需列？
5. 表头的"自动解析"模式和"手工指定"模式下，必需列校验的时机和行为是否应该一致？
6. 配置本身的自洽性：如果调用方设置了必需列，却完全没有启用任何表头模式，这种"自相矛盾"的配置应该在什么时候被发现（构造配置对象时，还是等到真正解析数据时）？
7. 空值/未设置语义：必需列这个新配置项，传 `null` 或空数组应该是什么含义？会不会和代码库里其他配置项的"空数组"特殊含义（如果第一步核查发现有的话）产生混淆？

对每一个问题：
- 给出一个**具体、可执行**的决策（不能是"看情况"这种模糊回答）；
- 用第一步核查到的**具体代码事实**作为理由支撑这个决策（引用真实的方法名、类名、异常消息文本）；
- 如果这条决策会影响后面决策表的"条件"或"动作"，要点明是哪一条。

**产出文件**：把这份 ADR 保存为当前工作目录下的

```
<ADR_DOC_PATH>（可以使用./ch03-2-adr.md）
```

（Markdown 格式），结构建议：
- 开头一段核查证据清单（对应上面"第一步"的发现）
- 每条决策单独一个二级标题，包含"决策"和"理由"两部分
- 结尾一张"决策记录汇总表"（问题 / 决策 / 依据的证据）

## 第三步：用决策表测试法设计验收测试用例（产出 Decision Table 文档 2）

基于 `<SUBDOMAINS_DOC_PATH>（即上一章的产出./ch02-2-2-subdomains.md）` 中列出的各个类的职责，严格按照附录 A 里"How to Create a Decision Table: Step by Step"的 7 个步骤来做，不要跳步，每一步都要把结果和理由写出来：

1. **先选定决策表类型，并给出理由**。一共有 5 种类型（Limited / Extended / Condition Action / Switch / Rule Based）。你要对照你的任务的真实复杂度（条件数量、条件之间是否存在互相影响/门控关系）来挑选，并在文档里明确说："因为……所以我选……"，不能跳过这一步直接开始画表。
2. **Step 1：识别所有条件**——条件要能追溯到第一步的代码核查结果和第二步的 ADR 决策，不能是含糊的描述。同时要明确写出"哪些看起来像条件、但其实不影响结果、因此被我排除掉了"的维度，并说明排除理由（这一点很重要，是判断你有没有真正理解系统行为、还是只是在堆砌组合的关键标志）。
3. **Step 2：定义每个条件的具体取值**——每个取值都要精确、可测试（例如"缺 1 列"和"缺全部列"算同一个取值还是不同取值，要讲清楚判断依据），不能是"差不多""大概"这种模糊说法。
4. **Step 3：计算规则数**——写出理论上的笛卡尔积是多少，再写出利用条件之间的依赖/门控关系消除掉多少"不可能"或"无意义"的组合之后，实际剩下多少条规则，每一步化简都要讲理由。
5. **Step 4：识别所有动作**——包括正常路径（成功）和异常路径（各种报错），每个异常动作要写清楚具体的异常类型和消息格式（可以参考你在 ADR 里定下来的格式）。
6. **Step 5：填充决策表**——正式画出表格（用 Markdown 表格语法），每一列是一条规则，行是条件和动作。**如果你发现一张表装不下全部逻辑（条件太多、或者有些条件只在特定的决策点才有意义），可以拆成多张表**，但必须在文档里清楚说明这几张表之间的关系（比如：表 A 的某个结果是表 B 成立的前提条件；或者表 A、表 B 是同一个判断逻辑在不同输入组合下的两个独立决策点）。
7. **Step 6：尽可能化简**——用"don't care"（用"–"表示）标记那些在某条规则下不影响结果的条件，并对**每一个**"–"都写一句话理由（不能只是机械地标，要让人看出"为什么这个条件在这里真的不重要"）。同时检查表里是否存在逻辑上不可能出现的组合，如果有，要剔除并说明理由。
8. **Step 7：把每条规则转成一个验收测试用例**——用结构化的文字/表格描述（前置条件 / 测试数据 / 预期结果），**不需要写可编译运行的代码骨架**。如果同一条规则下有几种不同的具体测试数据值得分别测一下（比如"缺 1 列"和"缺全部列"是同一个判断逻辑，但消息内容不同，值得各写一个测试用例），可以在同一条规则下派生出多个测试用例变体，并说明它们是变体而并非新规则。

**产出文件**：把这份决策表和测试用例保存为当前工作目录下的

```
<DECISION_TABLE_DOC_PATH>（可以使用./ch03-3-decision-tables.md）
```
（Markdown 格式），结构建议：
- 开头一段：决策表类型选择与理由，以及（如果拆成多张表）各表之间关系的说明图/说明文字
- Step 1 到 Step 7 依次成节，每节标注对应的 Step 编号
- 结尾一张汇总表：每张决策表产出了几条规则、派生了几个测试用例、对应 ADR 里的哪条决策

## 质量标准（自检清单，交付前检查一遍）

- [ ] 每一条设计决策、每一个决策表条件，都能在文档里找到"这是根据代码库里哪个具体事实/哪条 ADR 决策得出的"的说明，并非凭空猜测。
- [ ] 没有把互相独立、对结果没有交互影响的维度（比如两种等价的"允许"配置取值）硬塞成决策表的新条件，导致规则数不必要地膨胀。
- [ ] 没有把一个条件的"取值集合"写得含糊不清（例如"大小写差异较大"这种无法直接变成测试数据的说法）。
- [ ] 每一条规则都对应一个真实可达的程序状态，不存在"理论组合但实际不可能发生"却没有被剔除或说明的规则。
- [ ] 第 7 步产出的测试用例，任何一个拿去跟同事复述，对方都能明确说出"这个测试用例在验证哪条业务规则、输入什么、期望输出什么"，不需要再追问你。
- [ ] 两份产出文件（`adr.md` 和 `decision-table.md`）都是独立可读的 Markdown 文档，不依赖你在对话里说过的话才能看懂。

# 附录 A：决策表测试法指南（节选自 "What Is Decision Table Testing? Types and Examples"）

## Key Components of a Decision Table（决策表的四个核心组成部分）

### 1. Conditions（条件）

Conditions are the input variables that influence the system's behavior. Each condition represents a factor that the system evaluates when making a decision. In a loan approval system, conditions might include credit score, annual income, and employment status. In an e-commerce checkout, conditions might include payment method, shipping address validity, and coupon code applicability.

Each condition has a defined set of possible values. For binary conditions, these are typically True or False (sometimes represented as Y or N). For multi-valued conditions, these might be categories like High, Medium, or Low, or specific ranges like "income above $50,000" versus "income below $50,000."

### 2. Actions（动作）

Actions are the system's expected responses when a particular combination of conditions is met. Actions represent what the system does, not what it evaluates. In the loan approval example, actions might include "approve loan," "reject loan," or "refer to manual underwriting." In the e-commerce example, actions might include "process payment," "display error message," or "apply discount."

### 3. Rules（规则）

Rules are the columns of the decision table. Each rule defines one specific combination of condition values and the corresponding action or actions the system should execute. If a decision table has three binary conditions, the table will have up to eight rules (2^3), with each rule representing a unique test case.

### 4. Condition Alternatives and Action Entries（条件取值与动作条目）

Condition alternatives are the specific values assigned to each condition within a rule. Action entries indicate which actions are triggered (or not triggered) for each rule. Together, they populate the body of the table and define the complete decision logic under test.

## Types of Decision Tables（决策表的五种类型）

### 1. Limited Decision Table（有限决策表）

A limited decision table restricts condition values to binary states: True/False or Yes/No. This is the simplest form and works well for systems with straightforward, independent conditions.

典型例子：User Authentication System（用户名有效性 × 密码有效性 → 四种组合，四个测试用例）。

### 2. Extended Decision Table（扩展决策表）

An extended decision table allows conditions to have multiple values beyond binary. This is essential for systems where inputs are categorical or range-based.

典型例子：Insurance Policy Underwriting（年龄分段 × 理赔历史 → 不同的核保结论和保费档位）。

### 3. Condition Action Table（条件-动作表）

A condition action table maps each condition directly to a specific outcome, making it particularly useful when the relationship between inputs and outputs is clear and one to one.

典型例子：E-commerce Discount Engine。

### 4. Switch Table（开关/分支表）

A switch table applies when a single controlling condition determines the outcome through multiple branches. It simplifies decision logic into a lookup structure.

典型例子：Shipping Method Selection（按运输方式这一个主控条件分支）。

### 5. Rule Based Decision Table（规则型决策表）

Rule based decision tables combine multiple interacting conditions to handle complex, layered business logic. They are the most comprehensive form and are commonly used in financial services, healthcare, and insurance systems where regulatory compliance demands complete traceability.

典型例子：Healthcare Patient Triage System——症状严重程度和既往病史会共同决定"是否立即收治"和"是否触发专科会诊提醒"这两个动作，每条路径都要能被显式定义和测试。

## How to Create a Decision Table: Step by Step（七步法）

### Step 1: Identify All Conditions

Start by listing every input condition that influences the system's decision. Review requirements documents, user stories, and business rules to ensure completeness. For an enterprise loan origination system, conditions might include credit score range, debt to income ratio, employment verification status, and loan amount requested.

### Step 2: Define Condition Values

For each condition, define the complete set of possible values. Binary conditions have two values. Multi-valued conditions might have three, four, or more. Be precise: "credit score above 700" is testable; "good credit score" is not.

### Step 3: Calculate the Number of Rules

For a limited decision table with binary conditions, the number of rules equals 2^n, where n is the number of conditions. For extended tables, multiply the number of values for each condition. Three conditions with 2, 3, and 2 values respectively produce 2 × 3 × 2 = 12 rules.

### Step 4: Identify All Actions

List every possible action the system can take. Include both positive outcomes (approve, process, route) and negative outcomes (reject, display error, escalate). Include compound actions where the system performs multiple responses for a single rule.

### Step 5: Populate the Table

Fill in the condition alternatives for each rule, ensuring every unique combination is represented. Then assign the correct action or actions for each rule based on the business logic.

### Step 6: Simplify Where Possible

Some conditions may be irrelevant for certain rules. If the outcome is the same regardless of a condition's value, that condition can be marked as "don't care" (often represented with a dash) for those rules. This reduces redundancy without sacrificing coverage.

### Step 7: Convert Rules to Test Cases

Each column (rule) becomes one test case. Define the specific test data, expected results, and preconditions for each. This traceability from business rule to test case is one of decision table testing's greatest strengths.

## Limitations of Decision Table Testing（局限性，设计时要主动规避）

### 1. Exponential growth with many conditions

A system with 10 binary conditions produces 1,024 rules. With multi-valued conditions, the number grows even faster. Large tables become difficult to create, review, and maintain without tool support or optimization techniques.

### 2. Weak fit for continuous or range based data

Decision tables work best with discrete, categorical inputs. Conditions involving continuous ranges (temperature, price, time) require equivalence partitioning or boundary value analysis to reduce values to testable categories before a decision table can be applied.

### 3. Assumption of condition independence

Standard decision tables assume conditions are independent. When the value of one condition constrains the possible values of another (for example, if "account type = savings" limits "overdraft eligibility" to "no"), the table may include invalid combinations that must be identified and removed.

### 4. Maintenance overhead in fast changing systems

When business rules change frequently, decision tables require constant updates. This overhead can become a bottleneck, particularly for large enterprise systems with hundreds of decision points.

## Best Practices for Enterprise Decision Table Testing（最佳实践）

### 1. Start with the business rules, not the UI

Decision tables should be derived from documented business rules and requirements, not from observing the application's interface. This ensures the table tests intended behavior, not incidental behavior.

### 2. Apply equivalence partitioning before building the table

For conditions with continuous ranges, use equivalence partitioning to reduce the range to representative categories. Then build the table using those categories. This prevents the table from growing unmanageably large while maintaining meaningful coverage.

### 3. Always test boundary conditions

After building the decision table, supplement it with boundary value analysis for any condition that involves a range. If a condition threshold is "income above $50,000," test at $49,999, $50,000, and $50,001. Boundaries are where defects cluster.

### 4. Eliminate impossible combinations

Review the completed table for rules that represent logically impossible combinations of conditions. Remove or mark them to avoid wasting test execution time on invalid scenarios.

### 5. Automate with data driven testing

Convert the decision table into a data source (CSV, database, or API) and feed it into an automation platform that supports parameterized execution. This transforms the table from a planning document into an executable test suite.

## 补充：常见问答（FAQ 节选）

**How many test cases does a decision table produce?**
The number of test cases equals the number of rules (columns) in the table. For a limited decision table with n binary conditions, this is 2^n. For extended tables, multiply the number of possible values for each condition. Three conditions with 2, 3, and 4 values respectively produce 2 × 3 × 4 = 24 test cases.

**What is the difference between a limited and extended decision table?**
A limited decision table restricts all conditions to binary values (Yes/No or True/False), producing a fixed number of rules calculated as 2^n where n is the number of conditions. An extended decision table allows conditions to have multiple values (such as High, Medium, Low), which increases the number of rules but provides more granular coverage of complex business logic.

**How does decision table testing relate to equivalence partitioning and boundary value analysis?**
These techniques are complementary. Equivalence partitioning reduces continuous input ranges into representative categories, which are then used as condition values in the decision table. Boundary value analysis supplements the table by testing the edges of those categories, where defects are most likely to occur. Used together, they produce comprehensive coverage that is both efficient and thorough.---

## Round 0 — 助手（假设体检 + Q0）

**开场动作（事实核查，非假设）**：已确认工作目录状态——`./commons-csv` 存在，HEAD `24562da2`（`1.15.0-SNAPSHOT`），与 `ch02-2-2-subdomains.md`、`ch02-2-3-impact-analysis.md` 的分析基线一致，工作区干净；两份上游文档已通读；`ch03-1-dialogs.md` 此前不存在，本文件为首次创建。

### 1.1 我已默认成立的假设（未见诸你的文字，但我按此执行）

- **A1 仓库已就位，不重新克隆**：任务说"把仓库克隆到当前工作目录下"，但 `./commons-csv` 已存在，HEAD `24562da2` 与两份上游文档的分析基线完全一致、工作区干净——我默认直接使用它。
- **A2 上游文档可信但只作导航，引用前逐一复核**：`ch02-2-2-subdomains.md` / `ch02-2-3-impact-analysis.md` 给的行号锚点、异常消息文本，我会在"第一步：代码核查"里到源码中重新核实后才写进 ADR，不盲抄。
- **A3 产出语言为中文**，文档风格（证据口径、锚点表、mermaid 图）对齐上游两章。
- **A4 交付时序**：追问轮次推进到**前沿清空**、达成共识之后，才动笔写 `ch03-2-adr.md` 和 `ch03-3-decision-tables.md`；中途不交半成品。
- **A5 验收测试用例 = 结构化文字描述**（前置条件 / 测试数据 / 预期结果），不写可编译代码（你的 Step 7 明说）；断言口径沿用热身章已确认的约定——**异常类型精确断言、消息只断言关键片段**。
- **A6 我只产出三份 Markdown**（dialogs / adr / decision-tables），不碰 `commons-csv` 的任何生产代码与测试代码。
- **A7 方法论唯一来源是附录 A**，不上网搜决策表资料；代码事实只来自本地核查。
- **A8 决策表以"读方向"的新行为契约为中心**；写方向（`CSVPrinter`）是否入表，跟随 ADR 对开放问题 4 的裁决。
- **A9 文档读者** = 将来实现该需求的工程师 + 评审同事，两份文档必须独立可读。
- **A10 用例描述的框架语境 = 仓库现状 JUnit 5**：用 `assertThrows` 这类词汇表达断言意图，但不落成完整代码。

### 1.2 我还缺的关键信息（及各自如何改变方案）

- **M1 —— 7 个 ADR 开放问题的裁决权归属**（→ 本轮 Q0 唯一提问）。它决定后续每一轮的形态：是你逐条拍板，还是对我基于代码证据的推荐做确认/否决。
- **M2 —— 用例数量预算**：化简后预计规则 10–20 条、含变体总用例 20–40 个。若你有"必须 ≤ N 条"的硬约束（如需人工逐条评审），我会收紧 Step 7 的变体派生。
- **M3 —— 交付节奏**：前沿清空后一次性交付两份文档，还是 ADR 先交、审完再写决策表。默认前者。
- **M4 —— "安全网回归"是否属于本次验收范围**（`get("nope")` 晚失败不回归、全量 1003 例零破坏——影响分析文档的映射表里有这一行）。影响：决策表文档是否多一张"回归护栏"表。
- **M5 —— dialogs 文件"完整对话"的口径**：我默认逐字照录你的原始提示词（与 ch02-2-1 的做法一致），文件会较大；如只要摘要，请说明。

### 1.3 人们处理这类问题最常犯的一个错误

**跳过"先裁决开放设计问题 + 先核查代码事实"这两步，凭直觉画一张笛卡尔积大表。** 症状有二：(a) 表里混入逻辑上不可达的组合——例如"自动探测表头 × build 期抛错"，build 时代码根本看不见文件，这条规则对应的程序状态不存在；(b) 测试期望里悄悄写进未经裁决的语义——比如默认"表头应该 trim 再比较"，把个人想象钉成了行为契约。附录 A"局限性第 3 条（条件间约束会产生不可能组合）"和你的自检清单第 4 条，防的正是这个错误。

### 1.4 唯一的关键问题

❓ **Q0 - 裁决权归属——ADR 的 7 个开放设计问题由谁拍板**: 你的任务提示词第二步要求我"**自己识别并裁决**这些开放问题"；但上一章影响分析文档第 6 节又明确说这 6 个问题"均无唯一正确答案，只摆权衡……**实现 agent 应把用户的决定写成验收测试**"。两处指挥权冲突：这次你想要哪种协作模式？

选项：

- **(a) 推荐制**：我在追问轮次里逐条给出"决策 + 代码证据 + 对决策表条件/动作的影响"，你确认或改写；ADR 最终记录的是双方共识。
- **(b) 拍板制**：你在轮次里亲自逐条决定，我只摆证据与权衡，不预设倾向（影响分析文档的做法）。
- **(c) 授权制**：全部由我裁决并在 ADR 里自证，你只在最终文档上验收。

➡️ **建议选 (a)。** 理由：这 6+1 个开放问题正是决策树最自然的"前沿"——上一章已把权衡摆清、前提已定，天然适合立即提问；(b) 会把你拖回上一章已完成一遍的权衡工作，(c) 又违背影响分析文档"把你的决定写成验收测试"的约定。(a) 是两者矛盾的调和：**决策权由你行使，事实与推荐由我承担**——这也正贴合追问协议"发掘事实是我的职责、决策权在你"的分工。

---

## Round 1 — 用户（答复 Round 0 的 Q0 与 M1–M5）

M1: 见Q0。
M2: 没有硬约束，少而精即可。
M3: 前沿清空后一次性交付两份文档。
M4: "安全网回归"不属于本次验收范围，因为不修改生产代码。
M5: 较长的初始提示词摘要即可，我之后较短的对话内容，逐字记录。
Q0: C。基于你的最佳判断一次性裁决，并提供理由，我最后评审文档即可。

---

## Round 1 — 助手（前沿重算：清空 → 执行全任务 → 交付）

**前沿重算**：Q0=(c) 授权制把 7 个 ADR 开放问题、决策表类型、条件取舍、变体派生全部划归我的裁决权；M2/M3/M4/M5 已闭环；无其他前提未定的用户决策。**前沿清空**，按 M3 约定一次性执行并交付。

**第一步（代码核查）**——在 `./commons-csv`（HEAD `24562da2`，与上游文档基线一致，工作区干净）核实 6 个事实域，关键发现：

1. `createHeaders()` 的空名/重复名检查都是**逐列、循环内、遇首个即抛**（`CSVParser.java:655-659` / `:661-669`，空名先于重复），没有任何"全读完后统一检查"的环节；
2. `validate()`（`CSVFormat.java:2771-2805`）只查声明形状（方言互斥 + 手工表头重复），javadoc 自述"not all conditions can be tested here"；其重复检查用**大小写敏感 HashSet**（`:2792`），与 parse 期可大小写不敏感的 `headerMap` 存在**既有分叉**；
3. `ignoreHeaderCase` 的生效点就是 Map 实现（`:615-619`：`TreeMap(CASE_INSENSITIVE_ORDER)` vs `LinkedHashMap`）；且表头 key 的 trim 由 `format.trim` 在映射建立**之前**决定（`addRecordValue` `:595`）；
4. 表头三模式（null=无 / 空数组=自动探测 / 非空=手工）汇入同一段循环（`:629-679`）；`getHeader()` javadoc 明示"the empty array if to be read from the file"——**空数组在 `setHeader` 有特殊含义**；
5. `DuplicateHeaderMode` 三值：`ALLOW_ALL`（默认，不查）/ `ALLOW_EMPTY` / `DISALLOW`；
6. 异常分界线清晰：配置期+结构期用非受检 `IllegalArgumentException`，读入期数据坏用受检 `CSVException extends IOException`（`createHeaders()` 本就 `throws IOException`，抛它零签名改动）。

**第二步 + 第三步**——产出两份文档（完整内容见文件，此处不重复）：

- `./ch03-2-adr.md`：证据清单 E1–E15 + 裁决 D1–D10（覆盖任务点名的 7 问 + 核查中发现的 3 个额外问题）+ 汇总表。核心裁决：缺列抛 `CSVException`（消息 `Missing required header(s) [x] in [实际表头]`）、配置矛盾（设 required 却无表头）build 期抛 `IllegalArgumentException`、匹配语义完全复用 `headerMap`（跟随 `ignoreHeaderCase`、不 trim）、结构错误绝对优先、写方向不校验、读入期单点校验（自动/手工行为一致）、null/空数组归一化为"未设置"。
- `./ch03-3-decision-tables.md`：选 **Rule Based** 型（条件有门控、动作跨三决策点分层）；拆表 A（build 期，3 规则）/ 表 B（parse 期，7 规则，32→7 化简过程全展示）/ 表 C（print 期，1 规则），关系为"A 通过是 B/C 的前提，B/C 是同一 format 的互斥使用方向"；Step 1 含 9 类**排除维度**清单；Step 7 产出 **11 条规则、21 个用例**（含变体），每个用例标注前置/数据/预期与所钉住的裁决编号。

**交付前自检**（对照任务的自检清单，逐项通过）：每条决策/条件可三级追溯（规则→ADR→证据行号）；无独立维度硬塞成条件（排除清单）；条件取值用谓词定义（如"仅大小写"= `h.equalsIgnoreCase(r) && !h.equals(r)`）；无不可达组合（32→7 化简逐步给理由 + Step 6 边界核对）；用例可复述；两份文档独立可读。

**本轮停止**：等待用户评审两份文档。若某条裁决被否决，受影响的规则/用例将按同一追溯链局部更新，无需重做全表。
