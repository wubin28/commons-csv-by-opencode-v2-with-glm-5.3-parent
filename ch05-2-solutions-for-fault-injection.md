# `setRequiredHeaders` 验收套件 · 故障注入测试三方案设计

> **任务定位**：为 ch03-3 决策表 Step 7 对应的 22 份验收 fixture（ch04 已实现并提交）建立"注入→验证变红→撤销→验证变绿"的可重复闭环，外加一份供 VSCode 手工单步使用的故障注入指南。
> **方案区分维度**（对话 M3 已确认）：**"故障怎么注入、怎么撤销"的技术路线**——三个方案分别代表源码级改写、框架级编译期变异、运行期字节码替换三条本质不同的路线。
> **配套对话**：`ch05-1-dialogs.md`（Round 0–2）。

---

## 0. 背景与已确认的前提（事实核查结果 + 已锁定决策）

### 0.1 代码库与文档事实（全部本地实地核实，非转引）

| # | 事实 | 核实方式 |
| --- | --- | --- |
| F1 | `./commons-csv` HEAD = `9a1af060`（"feat: Implement required headers validation in CSVParser and add acceptance tests using approved scenarios"），工作区干净——ch04 的生产实现 + 测试 + fixture **已提交入库** | `git log` / `git status` |
| F2 | 调试指南（`ch04-3`）全部关键行号**仍然准确，无漂移**：`CSVFormat.java:886-890`（setter，`:888` D7 归一化）、`:2851-2852`（D6 矛盾检查）、`:1939-1941`（getter）；`CSVParser.java:615-619`（`createEmptyHeaderMap` map 工厂）、`:659`（空名 IAE）、`:666-668`（重复名 IAE）、`:683-694`（required 校验块，`:687` 命中判定、`:692` CSVException）；`CSVPrinter.java:120-122`（表头输出） | `grep -n` + 逐段读取源文件 |
| F3 | 被保护对象在位：`RequiredHeadersApprovedScenariosTest`（3 个 `@ParameterizedTest` 入口）+ `RequiredHeadersScenario`（fixture 解析/执行器）+ 22 份 `.approved.md`（table-a 6 / table-b 15 / table-c 1） | `find src/test` |
| F4 | `pom.xml` **未集成任何变异测试框架**（无 PITest 等）——"引入变异框架"类方案按从零集成计成本。已有：JUnit Jupiter 5.14.4（surefire XML classpath 实证）、maven-surefire-plugin（版本随 commons-parent 105 管理）、RAT `inputExcludes` 含 ch04 加的 `requiredheaders/**/*.approved.md` 豁免（`pom.xml:193`）；`defaultGoal` = `clean verify apache-rat:check japicmp:cmp spotbugs:check pmd:check pmd:cpd-check javadoc:javadoc checkstyle:check` | `grep pom.xml` + 运行产物 |
| F5 | **方法级隔离成立**：`mvn -q test -Dtest='RequiredHeadersApprovedScenariosTest#tableA_buildPhase'` 只跑 6 个参数化调用（`Tests run: 6`）；surefire XML 中每个调用是独立 `<testcase name="tableA_buildPhase(RequiredHeadersScenario)[k]">`；`fixtures()` 用 `Files.list(dir).sorted()` → **索引 k ↔ 排序后文件名是确定性映射**，脚本可自行计算，不改任何测试代码 | 实际运行 + 读 XML + 读测试源码 |
| F6 | **失败信息形态**（读 `RequiredHeadersScenario.java`）：消息片段断言失败时输出 `"<caseId>: 消息应包含 <片段>，实际是 <实际消息>"`（`assertFragments`，`:257-263`）——**失败消息自带 caseId 前缀**，强校验可锚定到具体 fixture；"预期异常未抛"时 `assertThrows` 报 `Expected ... to be thrown, but nothing was thrown`；getter 断言失败带 `"<caseId>: getRequiredHeaders() ..."`；"parse 成功"类 fixture 被故障击中时以 `<error>`（异常穿透）形态出现在 XML | 读源码 `:228-263` |
| F7 | 本机 `python3` 3.14.6 在位（Homebrew）；macOS / iTerm2 / zsh | `which python3` |

### 0.2 已锁定的决策（对话 Round 0–2，编号沿用）

| 决策 | 内容 |
| --- | --- |
| Q0=(a) | **22 份 fixture 全量逐一闭环**：每份 fixture 一个按其保护意图独立设计的语义故障（同落点不同语义侧面允许不同故障），手工指南 22 条 |
| M2 | 用途定位 = **一次性教学演示**（本书第 5 章素材）——脚本健壮性以"本机可重复"为标尺，不按 CI 工程化 |
| M3 | 三方案按**注入/撤销技术路线**区分 |
| D-M4（M4 授权） | 自动化用 **Python 3 单文件脚本（仅 stdlib）**，zsh 里一条命令执行 |
| M5 | 强校验：**指定 fixture 的失败信息必须含期望片段** |
| D-M6（M6 授权） | 隔离 = **方法级运行 + surefire XML 按索引定位**；22 循环后跑全量 `mvn test` 对照基线 `Tests run: 1025, Failures: 0, Errors: 0, Skipped: 11`（A10） |
| M7 | 脚本进 `./commons-csv` 仓库，且 `mvn test` 必须仍然全绿 |
| Q1=(a) | **不提交、留工作区**（ch04 M3 先例：用户评审后自己提交）；生产代码零残留（A4） |
| Q2=(a) | **连带变红集合精确核对**：每条配方声明预期变红清单，实际集合 ≠ 预期集合即闭环失败 |
| Q3=(a) | 运行台账落盘 `./ch05-4-fault-injection-run.log`（沿用 `mvn-baseline.log` 先例） |

### 0.3 方法论红线（三方案共同遵守）

- **语义对应**：每条故障必须回答"这个 fixture 到底在保护哪段行为"，故障就打在那段行为上；禁止无语义考量的随机算子变异。
- **闭环三步缺一不可**：变红（目标 fixture 失败）→ 报错对应（失败信息含期望片段）→ 变绿（撤销后全绿）；连带集合核对（Q2）作为第二重证据。
- **如实记录**：若某故障注入后目标 fixture 仍绿，或连带面与推演不符，台账与指南如实记录并分析原因，不悄悄换故障。

---

## 1. 方案一：源码精确文本替换 + git 撤销（编译期·手工语义故障）

### 主要内容

**技术路线**：编译期 code modification（附录分类）——用脚本把生产源文件里的**精确代码片段**替换为故障片段，`mvn test` 正常编译运行让故障生效；撤销 = `git checkout -- <文件>` 精确恢复到 HEAD。

**交付物（全部落在仓库内新目录 `fault-injection/`，untracked）**：

1. `fault-injection/faults.json` —— 22 条故障配方，每条字段：
   - `caseId`（如 `TC-B7b`）与所在入口方法（`tableB_parsePhase`）；
   - `file`（目标生产文件相对路径）；
   - `original` / `faulted`：**原代码片段与故障代码片段**——`original` 必须在文件中恰好出现一次（脚本按精确文本匹配定位，不依赖行号，天然抗行号漂移；匹配数 ≠1 即安全中止）；
   - `expectedFailureFragments`：注入后该 fixture 失败信息**必须包含**的片段（利用 F6：断言消息自带 caseId 前缀，可锚定到具体 fixture）；
   - `expectedRedSet`：预期变红集合（目标 fixture + 推演出的连带 fixture，Q2）；
   - `rationale`：故障为什么与该 fixture 的保护意图语义对应（中文，供手工指南引用）。
2. `fault-injection/run_faults.py` —— Python 3 stdlib 驱动器，对每条配方执行循环：
   1. **preflight**：`git status --porcelain -- <生产文件>` 必须干净，否则拒绝开始；
   2. **注入**：读源文件 → 精确匹配 `original`（恰好一次）→ 替换为 `faulted` → 写回；
   3. **变红验证**：`mvn -q test -Dtest='RequiredHeadersApprovedScenariosTest#<方法>'` → 解析 `target/surefire-reports/TEST-*.xml` → 按 F5 的确定性索引定位目标 `<testcase>` → 三重断言：目标 fixture 失败、失败信息含全部期望片段、**实际变红集合 == 预期集合**；
   4. **撤销**（try/finally 保证执行）：`git checkout -- <生产文件>`；
   5. **变绿验证**：重跑同一方法，`failures=0, errors=0`；
   22 循环后跑全量 `mvn test` 对照基线 1025/0/0/11（A10），台账写 `./ch05-4-fault-injection-run.log`（Q3）。
3. `pom.xml` 唯一改动：`inputExcludes` 加一行 `fault-injection/**`（照 `pom.xml:193` 的 ch04 先例；`mvn test` / `mvn verify` 均不破，M7）。

**配方示例（说明"语义对应"长什么样，正式 22 条在阶段 B 逐条推演）**：

- **TC-B7b（缺失名单按声明序）**：`CSVParser.java:690` 循环后插入 `missing.sort(null);` → 缺失名单变字母序 → 仅 ≥2 个缺失名的 fixture 变红（B7b、B7c、B7d、B7e…），单缺失的 B7a 保持绿——连带面恰好等于"保护消息顺序语义"的 fixture 集合；
- **TC-B4（默认大小写敏感）**：`createEmptyHeaderMap()` 的三元条件改为恒走 `TreeMap(CASE_INSENSITIVE_ORDER)`（`CSVParser.java:616-618`）→ B4 期望的 `CSVException` 不再抛出（`assertThrows` 报 nothing was thrown）→ B5/B6 不受影响（B5 本来就折叠；空白仍不折叠）；
- **TC-B1（特性默认关闭）**：拆掉 `:684` 门卫的 `requiredHeaders != null` 条件 → 未设名单也进校验循环 → NPE 穿透为 `<error>`——故障打在"B1 保护的就是这道门"上。

### 优势

1. **手工指南与自动化 100% 同构**：故障就是源码 diff，指南里的"注入前/注入后代码"就是脚本实际注入的内容，VSCode 单步复现零转换成本——直接满足用途 ②（A8）；
2. **零新依赖、构建零侵入**：不改构建逻辑、不加插件（pom 仅一行 RAT 豁免且有 ch04 先例），Python 3 本机自带（F7），`mvn test` 行为完全不变（M7 最稳）；
3. **强校验天然落地**：脚本直接解析 surefire XML 的 per-fixture `<failure>/<error>`，M5 的消息片段断言与 Q2 的连带集合核对都在同一份数据上完成（F5/F6 是现成地基）；
4. **撤销精确且可验证**：`git checkout --` 恢复到 HEAD 是字节级精确的，"零残留"可以用 `git status` 机器验证（A4）；try/finally + preflight 双保险防中途崩溃；
5. **配方抗漂移**：定位靠"精确片段恰好出现一次"而非行号，上游代码一变脚本就安全中止，绝不错误注入。

### 劣势

1. **循环期间生产代码短暂处于故障态**：工作区在注入→撤销窗口内是"脏"的（与方案二的零接触相反），该窗口内不能并行其他构建/调试；脚本崩溃虽有三重兜底（finally 撤销 + 下轮 preflight 拦截 + 退出前全量检查），但"需要兜底"本身就是成本；
2. **配方与源码文本强耦合**：上游对 `CSVParser`/`CSVFormat` 的任何重构都会让 `original` 匹配失败——安全但需要人工更新 22 条配方（一次性教学演示 M2 下可接受，长期资产则要维护契约）；
3. **每循环两次 Maven 运行**（变红一次、变绿一次）：22 条 × 2 次方法级运行 + 末尾全量，总时长分钟级——比方案三的"换属性即换故障"慢，但仍远快于方案二的全量变异分析。

### 适用场景

- 教学/演示场景，要求"脚本注入的东西"与"人手工注入的东西"完全一致；
- 逐测试的语义故障闭环 + 报错片段强校验 + 连带面核对（本任务全部硬要求）；
- 小型代码库、本机快速循环、fault 数量在几十条的量级。

### 不适用场景

- 注入期间要求工作区绝对干净（共享工作区、CI 禁止脏树策略）——选方案三；
- 想要"整套测试对几百个机械变异的杀死率"这类定量覆盖评估——选方案二；
- fault 数量上百、追求故障切换零编译延迟的常态化变异监控——方案一每循环都要重编译，不经济。

---

## 2. 方案二：PITest 变异测试框架（编译期·框架生成故障，跑完即消失）

### 主要内容

**技术路线**：编译期框架级变异——引入 PITest（`pitest-maven` 插件 + `pitest-junit5-plugin`，JUnit 5 必需），在编译后的字节码上按**变异算子**（条件取反、边界替换、移除 void 调用、常量替换等）批量生成变异体，逐个运行目标测试并输出 killed / survived 报告。"注入"由框架完成、"撤销"无需任何动作（变异体只存在于 PITest 进程内存中，源码与工作区零接触）。

**接入步骤**（当前 pom 未集成 PITest，F4——从零全额成本）：

1. `pom.xml` `<plugins>` 加 `pitest-maven`（较新版本以支持 Java 21 + JUnit 5.14），`<dependencies>` 内挂 `pitest-junit5-plugin`；
2. 配置 `targetClasses` 限定 `org.apache.commons.csv.CSVParser` / `CSVFormat`，`targetTests` 限定 `RequiredHeadersApprovedScenariosTest`，选定 mutators 子集；
3. `mvn org.pitest:pitest-maven:mutationCoverage` 生成 HTML/XML 报告；
4. 人工从报告里挑"位于被保护行上的变异体"，把"被方法 X 杀死"近似映射为"方法 X 的 fixture 保护该行"——22 个闭环的"故障"从 killing 报告反向挑选；
5. 手工指南只能以"变异算子 + 代码行"的方式描述故障（如"第 687 行 NegateConditionalMutator"），无法给出注入前后源码。

### 优势

1. **源码与工作区全程零接触**：不存在"忘记撤销"的可能，也不需要 preflight / finally 兜底——三方案中唯一"注入"动作完全无痕的；
2. **额外产出定量盲区清单**：survived 变异体直接暴露"测试没保护到的等价变化"，这是方案一/三（只测预定义故障）给不了的附加价值；
3. **报告基础设施现成**：HTML/XML/CSV 报告、逐变异体的杀死归因、行级覆盖，不用自己写解析器；
4. **故障量大且可复跑**：一次运行生成几十上百个变异体，适合回答"这套测试整体上有多强"。

### 劣势

1. **与本任务核心要求正面冲突**：变异体是算子级机械变异（`&&`→`||`、`<`→`<=`），不回答"这个 fixture 在保护什么行为"——任务红线（0.3）与提示词明确反对的正是这一点；"语义对应"只能靠人工事后挑选近似，红线的满足是名义的；
2. **强校验（M5 + Q2）无法落地**：PITest 的归因单位是测试方法（`tableB_parsePhase` 整体），参数化调用聚合报告——"指定 fixture 的失败信息含期望片段"与"连带变红集合核对"在 PITest 报告里根本没有对应字段；
3. **构建侵入最重**：pom 加 1 个插件 + 1 个插件依赖（M7 要求 `mvn test` 不破，但插件解析、版本兼容 Java 21/JUnit 5.14 都是新变量），且每次全量 `verify` 之外的专项运行是分钟级起步——比方案一单循环慢一个量级；
4. **手工指南无法同构**：VSCode 里无法"单步复现"一个字节码变异体，指南退化成变异算子语义说明，用途 ②（加深对生产代码理解）落空。

### 适用场景

- 想要"这套测试整体的变异杀死率"定量评估，可接受方法级归因；
- 团队已把 PITest 纳入日常构建（此时接入成本趋零），把它当作测试强度的常规定量仪表；
- 寻找测试盲区（survived 清单）驱动补测试。

### 不适用场景

- 本任务的硬组合：逐 fixture 语义闭环 + 报错片段强校验 + 连带面核对 + 手工单步同构——四项全踩；
- 一次性演示场景（为跑 22 个闭环引入一套构建框架，成本收益倒挂）；
- Java/插件版本前沿组合下不愿承担兼容性排障的场合。

---

## 3. 方案三：运行期 Java Agent 字节码替换（运行期注入，摘参数即撤销）

### 主要内容

**技术路线**：运行期注入（附录分类）——生产源码不动，用 JDK `java.lang.instrument` 写一个小 agent（premain），在类加载时按系统属性（如 `-Dfault=TC-B4`）把目标类字节码替换为**预编译的故障版字节码**。"注入" = 给 surefire 挂 `-javaagent` 参数；"撤销" = 去掉参数重跑（不涉及 git，源码零接触）。

**交付物**：

1. `fault-injection/shadow/` —— 影子源码：22 个"故障版"目标类源文件（从 HEAD 版本拷贝 + 应用与方案一同款语义故障）；
2. `fault-injection/build_shadow.sh` —— 用 `javac` 以项目 classpath 把影子源码编译成 `.class`（一次性，或源码变更后重建）；
3. `fault-injection/FaultAgent.java` + 打包的 `agent.jar` —— premain 里读 `-Dfault=`，`ClassFileTransformer` 拦截目标类加载并替换为对应影子字节码；
4. 运行方式：`mvn -q test -Dtest='RequiredHeadersApprovedScenariosTest#tableB_parsePhase' -DargLine="-javaagent:fault-injection/agent.jar -Dfault=TC-B4"`（surefire 的 `argLine` 参数绑定 `${argLine}` 属性，可命令行注入，pom 不用改）；
5. 校验层与方案一同源（surefire XML 按索引定位 + 片段断言 + 连带集合核对），台账同样落盘。

### 优势

1. **工作区全程最干净**：生产源码、git 状态在注入/撤销全程零变化（撤销甚至不涉及 git），三方案中唯一满足"注入期间工作区绝对干净"的路线；
2. **故障切换零项目重编译**：agent 与影子类一次构建后，切换故障只换 `-Dfault=` 属性值，连续探索 22 个故障的循环最快；
3. **强校验可完整落地**：校验层与方案一共用（surefire XML per-fixture 解析），M5 + Q2 不打折；
4. **教学上有独立示范价值**：完整演示附录里 run-time 注入类别（instrumentation 触发）在 JVM 上的真实形态，与方案一/二构成"编译期 vs 运行期"的方法论对照。

### 劣势

1. **实现复杂度三方案最高**：agent + 影子源码 + 影子编译 + 字节码替换四层设施；且故障定义的**源头仍是源码编辑**（影子源码 = 方案一的故障片段写到副本里），等于方案一的全部工作外再加一层机械设施——出故障面（类版本不匹配、模块系统拦截、字节码版本、agent 打包）显著更大；
2. **手工指南不同构**：VSCode 单步看到的是被替换后的类，行号表与原源文件错位（除非额外维护 SourceDebugExtension），指南只能以影子源码呈现"注入前后"，开发者手工复现门槛最高——用途 ② 打折最多；
3. **"一条命令复现"变弱**：agent.jar 的构建/影子类编译需要额外脚本先行，教学演示的开场成本高（M2 下是负资产）；一旦影子源码与 HEAD 漂移，还会出现"影子类行为与主源码不一致"这类最难排查的静默错误；
4. **故障与源码的耦合并没有消失**：影子源码同样随上游重构失效（与方案一劣势 2 相同），但失效方式更隐蔽（编译失败或运行期行为漂移，而非方案一的安全中止）。

### 适用场景

- 注入期间生产文件绝不允许被改动的合规/共享环境；
- 想演示运行期注入机制本身（instrumentation / ClassFileTransformer）的教学场合；
- 故障数量大、需要在不重编译项目的前提下高频切换故障的探索性实验。

### 不适用场景

- 本任务的主诉求（教学演示 + 手工单步同构 + 一条命令复现）——认知负担与设施成本最高；
- 快速搭建一次性闭环（为 22 个故障建四层基础设施，投入产出倒挂）；
- 团队无字节码工具链经验、排障时间预算有限的场合。

---

## 4. 推荐方案

**推荐：方案一（源码精确文本替换 + git 撤销）。**

三方案对照（同一判据下的相互印证）：

| 判据（来源） | 方案一 源码替换+git | 方案二 PITest | 方案三 Java Agent |
| --- | --- | --- | --- |
| 语义故障逐 fixture 设计（红线 0.3） | ✅ 配方即语义 | ❌ 算子级机械变异 | ✅ 影子源码即语义（多一层设施） |
| 消息片段强校验 M5 | ✅ XML per-fixture | ❌ 方法级聚合，无消息 | ✅（校验层同方案一） |
| 连带集合核对 Q2=(a) | ✅ | ❌ | ✅ |
| 手工指南同构 A8/用途② | ✅ 源码 diff 即指南 | ❌ 无法复现字节码变异 | ⚠️ 行号错位，门槛最高 |
| 工作区干净 | ⚠️ 循环窗口内脏（有兜底） | ✅ 零接触 | ✅ 零接触 |
| 构建侵入 M7 | 仅 1 行 RAT 豁免 | pom 加插件 + 依赖 | 不改 pom，但需影子构建设施 |
| 一条命令复现 M2/M4 | ✅ `python3 run_faults.py` | ⚠️ 专项 mojo + 报告解读 | ⚠️ 需先构建 agent + 影子类 |

**逐条理由（对应 0.2 的每项决策）**：

1. **对应 Q0=(a)（22 份全量）**：方案一的配方粒度天然就是"每 fixture 一条语义故障"，同落点不同侧面（B7b 排序 vs B7f 去重）在 `original`/`faulted` 精确片段下各自成立；方案二无法为"每个 fixture"定制故障（算子不认识语义侧面），方案三能做但每个侧面都要一份完整影子源码，22 份影子文件的维护面不成比例。
2. **对应 M2（一次性教学演示）**：方案一的概念清单最短（改文本→跑测试→还原），演示时讲解成本最低；方案三的四层设施与方案二的框架接入都是"为一次性演示引入常设复杂度"，与 M2 的定位相反。
3. **对应 M3（技术路线区分）**：三方案恰好覆盖编译期手工替换 / 编译期框架变异 / 运行期注入三条路线，方案一在这条谱系里是"最直接表达故障语义"的一端。
4. **对应 D-M4（Python 3 stdlib，zsh 一条命令）**：`python3 fault-injection/run_faults.py` 即全量闭环；F7 已确认本机 python3 3.14.6 在位。
5. **对应 M5（强校验）**：只有方案一/三能把"失败信息必须含期望片段"逐 fixture 断言（F5 确定性索引 + F6 失败消息自带 caseId 前缀是现成地基）；方案二的报告单位是测试方法，M5 无法落地。
6. **对应 D-M6（方法级隔离 + XML 索引）**：方案一的循环直接建立在该机制上（F5 已实测）；方案三共用此校验层；方案二不适用。
7. **对应 M7（进仓库且 `mvn test` 不破）**：方案一只新增 untracked 文件 + 照 `pom.xml:193` 先例加一行 RAT 豁免，`mvn test`/`mvn verify` 行为零变化；方案二要动构建插件栈（M7 风险最高）；方案三不动 pom 但引入 agent.jar 构建链条。
8. **对应 Q1=(a)（不提交留工作区）**：preflight 干净检查 + try/finally 撤销与"untracked 脚本目录 + 干净生产文件"的工作区形态完全兼容；`git checkout --` 只触碰被注入的 tracked 生产文件。
9. **对应 Q2=(a)（连带集合精确核对）**：与 M5 同理，只有逐 fixture 的失败数据（F5/F6）支撑得起集合核对；方案二的方法级聚合直接出局。
10. **对应 Q3=(a)（台账落盘）**：方案一/三的驱动器都在本机掌握全部循环数据，写 `ch05-4` 台账是顺手的事；方案二的"台账"只能转抄 PITest 报告，格式不受控。
11. **对应 A8/用途②（VSCode 手工同构）**：这是方案一的独占优势——故障=源码 diff，指南的"注入前/后代码"就是脚本注入的内容，手工单步与自动化看到的失败现场完全一致；方案三行号错位、方案二无法复现。

**已知代价与对策**（如实陈述）：循环窗口内工作区短暂脏（劣势 1）——以 preflight + try/finally + 退出前全量核对三重兜底；配方与源码文本强耦合（劣势 2）——对一次性教学演示（M2）可接受，脚本遇漂移安全中止而非错误注入。

---

*下一步（阶段 B，待方案确认后执行）：按方案一实现 `fault-injection/faults.json`（22 条语义故障逐条推演，含连带面推演）+ `run_faults.py` → 跑全量闭环产出台账 → 产出 `./ch05-3-fault-injection-guide.md`（22 条：类名+行号、注入前后代码、期望报错、故障设计理由）。*
