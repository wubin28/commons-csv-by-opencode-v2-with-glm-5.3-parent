# VSCode 单步调试指南：`setRequiredHeaders` 验收套件（Approved Scenarios）

> **配套产物**：方案设计见 `ch04-2-solutions-for-approved-scenarios.md`（推荐方案二：三个测试入口镜像 ch03 决策表 A/B/C——本指南的分组结构正是该推荐的落地印证）。断言行号基于本次实现后的工作区（未提交，M3 口径），每处均用 grep 实地核实，对照表见文末。
> **本机环境事实**（M5：需要向读者声明验证边界）：`vscjava.vscode-java-test 0.47.0`（≥ 0.35.0，单 invocation 调试早已支持）、`vscjava.vscode-java-debug 0.60.0`、JDK Temurin 21.0.11、Maven 3.9.16。若你的扩展版本不同，行为以"先整体 Run 一次"的通用提醒为准（下节）。

---

## 1. 打开仓库与 Testing 面板

1. VSCode → File → Open Folder… → 选择 `./commons-csv`（注意：是仓库目录本身，不是上级章节目录）。
2. 等待右下角 Java 项目导入完成（语言服务器首次索引约 30–60 秒）。
3. 左侧 Activity Bar 点击**烧杯图标**（Testing）。找到 `org.apache.commons.csv` → `RequiredHeadersApprovedScenariosTest`，会看到三个测试方法：
   - `tableA_buildPhase`（表 A：build 期决策点，6 个用例）
   - `tableB_parsePhase`（表 B：parse 期决策点，15 个用例）
   - `tableC_printPhase`（表 C：print 期决策点，1 个用例）

> ⚠️ **必读：先 Run 一次，子节点才出现**。JUnit 5 的参数化调用是**运行时**才计算的——首次展开时方法下没有子节点是 JUnit 5 的机制而非 bug。对某个方法点击 ▶ Run 一次后，每个 fixture 会展开为独立的子节点（显示名 = `用例ID · 中文标题`，来自 fixture 的 H1 行，经 `Named.of` 包装）。之后每个子节点都可以单独 ▶ 重跑，或**右键 → Debug Test** 单步调试。改了 fixture 内容后，重新 Run 所在方法刷新。

---

## 2. 三个核心断点（生产代码，先设好再按用例进入）

| # | 断点 | 位置 | 命中意味着 |
| --- | --- | --- | --- |
| **BP-1** | `setRequiredHeaders` 归一化 | `CSVFormat.java:888` — `this.requiredHeaders = clone == null \|\| clone.length == 0 ? null : clone;` | 程序正在决定"必需表头名单"的存储形态（D7 三态归一） |
| **BP-2** | build 期配置矛盾检查 | `CSVFormat.java:2851` — `if (requiredHeaders != null && headers == null) {` | 程序正在检查"设了必需列却没启用任何表头"的自相矛盾（D6） |
| **BP-3** | parse 期核心校验 | `CSVParser.java:687` — `if (!headerMap.containsKey(requiredHeader) && !missing.contains(requiredHeader)) {` | 程序正在做**命中判定**——这一行是整个需求的心脏（D2：复用 headerMap，天然跟随 `ignoreHeaderCase`） |

补充观察点（不是断点，单步路过时看一眼）：
- `CSVParser.java:692` — `throw new CSVException("Missing required header(s) %s in %s", missing, …)`：消息组装处（D1 模板；`missing` 是"按声明序去重"的缺失名单，D7）。
- `CSVParser.java:615-619` — `createEmptyHeaderMap()`：`ignoreHeaderCase ? TreeMap(CASE_INSENSITIVE_ORDER) : LinkedHashMap`——D2 大小写语义的生效点。
- `CSVParser.java:659 / :666` — 空名 / 重复名检查：它们在 `for` 循环**内部**、先于 BP-3 执行（D3 结构错误优先的技术根源）。

---

## 3. 每条用例的断点与观察

> 用法：在 §2 设好断点 → Testing 面板 Run 一次展开 → 右键目标子节点 → Debug Test。下表"观察变量"列出该用例到达断点时的关键状态与预期值，以及它验证的规则（规则号/裁决号 → ch03-3 / ch03-2 文档）。

### 表 A 组（build 期决策点）——主断点 BP-1、BP-2

| 用例 | 断点 | 观察变量 → 预期 | 验证什么 |
| --- | --- | --- | --- |
| TC-A1 / TC-A1a-null / TC-A1a-empty | BP-1 不命中（从未调用 setter）；BP-2 的 `requiredHeaders == null` | `CSVFormat` 构造后 `getRequiredHeaders()` → `null` | **A-R1 / D7**：未调用、传 null、传空数组三态归一为 null——尤其空数组**不会**获得 `setHeader()` 空数组"自动探测"的含义（ch03-2 E8 陷阱） |
| TC-A2 | BP-2 命中 | `:2851` 处 `requiredHeaders` = `[date, amount, currency]`，`headers` = `null` → 条件为 true；`:2852` 抛出，消息含 `Required headers [date, amount, currency] are set but no header is defined` | **A-R2 / D6**：配置矛盾在 build 期 fail-fast，类型是 `IllegalArgumentException`（与 `validate()` 全部先例同类） |
| TC-A3a / TC-A3b | BP-1 命中后单步过；BP-2 条件为 **false** | BP-1 处 `clone` = 3 元素（TC-A3b 为 2 元素）；BP-2 处 `headers != null` → 不抛，`builder.get()` 正常返回 | **A-R3 / D5**：手工表头也**不**在 build 期做必需列交叉检查——单点校验拒绝双时机（避免与 parse 期大小写语义分叉，ch03-2 E5 教训） |

### 表 B 组（parse 期决策点）——主断点 BP-3

| 用例 | 断点 | 观察变量 → 预期 | 验证什么 |
| --- | --- | --- | --- |
| TC-B1 | BP-3 **不命中** | `CSVParser.java:683` 处 `format.getRequiredHeaders()` 返回 `null` → 整个 `if` 块跳过 | **B-R1 / D7**：特性默认关闭，解析路径与现状零差异（数据记录正常产出） |
| TC-B2a / TC-B2b / TC-B2c | BP-3 **不命中**（先在 `:659` 或 `:666` 抛出） | 断点打在 `:659`（TC-B2a/c 空名版）或 `:666`（TC-B2b 重复版）：循环内逐列命中即抛 `IllegalArgumentException`——**执行流根本到不了 BP-3** | **B-R2 / D3**：结构性错误绝对优先；TC-B2c 特别证明"required 全部命中"也改变不了这个顺序（决策表 B-R2 行 C4 = don't care 的实证） |
| TC-B3 / TC-B3a | BP-3 命中，循环走完 | `:687` 处 `headerMap`：TC-B3 = `{date=0, amount=1, currency=2}`（LinkedHashMap 保插入序）；TC-B3a 同样内容——**注意它来自手工名单，与文件首行无关**（文件首行 `DATE,AMT,CUR` 已被 skip）；`missing` 保持空 → `:691` 条件 false → 不抛 | **B-R3 / D2、D5、D9**：命中判定查的就是 `get()` 查的那张 map；手工/自动两模式在同一行代码汇合 |
| TC-B4 | BP-3 命中 | `:687` 处 `requiredHeader` 依次为 `date`/`amount`/`currency`；`headerMap` 的键是 `Date`/`AMOUNT`/`currency`（`LinkedHashMap` 精确匹配）→ 前两次 `containsKey` 为 false；`:688` 后 `missing` = `[date, amount]`（声明序）；`:692` 消息 `Missing required header(s) [date, amount] in [Date, AMOUNT, currency]` | **B-R4 / D2**：默认大小写敏感；缺失名单只列未命中项、按声明序（D1 消息确定性） |
| TC-B5 | BP-3 命中 | 路过 `:615-619`：这次 map 是 `TreeMap(CASE_INSENSITIVE_ORDER)`；`:687` 处 `containsKey("date")` 对键 `Date` 返回 **true**（大小写折叠）→ `missing` 为空 → 通过。随后的取值断言里 `get("amount")` 与 `get("AMOUNT")` 返回同一个值 `2` | **B-R5 / D2、E6**：大小写语义的生效点是 Map 实现——required 校验与按名访问共用一张表，不会"校验过了 get 还是失败" |
| TC-B6 | BP-3 命中 | `:687` 处 `headerMap` 的第三个键是 `" currency "`（**带前后空格**，默认 trim=false 不剥）；`containsKey("currency")` 为 false → `missing` = `[currency]`；`:692` 消息里实际表头可见 `[date, amount,  currency ]`（双空格——Arrays.toString 的分隔符 + 键的前导空格） | **B-R6 / D2、E7**：不引入第二套比较逻辑——不 trim、不忽略空白；消息把"为什么缺"直接展示给排障者 |
| TC-B7a | BP-3 命中 | `missing` 逐步累积：`[currency]`（只缺 1 个）；`:692` 消息 `… [currency] in [date, amount]` | **B-R7 / D1**：异常类型 `CSVException`（受检，`parse()` 已有的 `throws IOException` 语义内）+ 消息含缺失名单与实际表头 |
| TC-B7b | BP-3 命中 | `missing` = `[amount, currency]`——**按 setRequiredHeaders 声明序**而非字母序 | **B-R7 / D1**：消息确定性（同一名单永远同一条消息，可精确断言） |
| TC-B7c | BP-3 命中 | `missing` = `[date, amount, currency]` 全量；实际表头 `[foo, bar]` | **B-R7 / D1**：缺全部的极端形态 |
| TC-B7d | BP-3 命中 | `:683` 前路过 `:637-641`：空文件 → `nextRecord()` 返回 null → `headerMap` 是**空 map 而非 null**；`missing` = 全量；`:692` 消息 `… in []`（`headerNames == null` 时用 `Collections.emptyList()`，ch03-2 D8 的落点） | **B-R7 / D8**：空文件不特判，统一走"缺全部" |
| TC-B7e | BP-3 命中 | `headerMap` = `{date=0, amount=1}`——**来自手工名单**；文件首行内容此刻尚未被读取（`createHeaders()` 在构造函数内、先于任何数据记录，ch03-2 E11）；`missing` = `[currency]` | **B-R7 / D9**：对照对象是手工名单建立的映射，文件里"其实有 currency"不算数 |
| TC-B7f | BP-3 命中 | `requiredHeaders` = `[currency, currency]`（名单本身带重复）；`missing` 仍只有 `[currency]`——`:687` 的第二个条件 `!missing.contains(…)` 在去重 | **B-R7 / D7**：名单重复不抛配置错、不特判；报缺失时去重且保序 |

### 表 C 组（print 期决策点）

| 用例 | 断点 | 观察变量 → 预期 | 验证什么 |
| --- | --- | --- | --- |
| TC-C1 | BP-2 命中且条件 false；BP-3 **不命中**；在 `CSVPrinter.java:120` — `if (format.getHeader() != null && !format.getSkipHeaderRecord())` 停下 | `format.getRequiredHeaders()` 有值，但 `CSVPrinter` 全程**没有任何代码读它**；`:121` `printRecord(format.getHeader())` 照常输出表头行，随后打印数据记录 | **C-R1 / D4、E13**：写方向把 header 当**输出物**——必需列是读方向对输入的断言，语义不对称，零校验零干扰 |

---

## 4. 测试执行逻辑本身的关键断点（理解"fixture 如何变成断言"）

| # | 断点 | 位置 | 观察什么 |
| --- | --- | --- | --- |
| **T-1** | fixture 解析入口 | `RequiredHeadersScenario.java:89` — `static RequiredHeadersScenario parse(final Path path)` | 入参 `path` 是哪份 `.approved.md`；单步过循环看 markdown 如何变成 `config`/`expectations`/`csvData` 三个纯数据结构——**这里没有任何 CSV API 调用**（解析器/执行器分离约定） |
| **T-2** | 执行分发 | `RequiredHeadersScenario.java:166` — `switch (single("结果"))` | `single("结果")` 的值决定走哪条路径；在此之前 `applyConfig`（:193）已把中文配置键翻译成 `Builder` 调用——单步 `applyConfig` 可看 `(auto)` → `setHeader()`、`(null)` → `setRequiredHeaders((String[]) null)` 等占位符的真实语义 |
| **T-3** | 断言终点 | `RequiredHeadersScenario.java:257` — `private void assertFragments(final Throwable thrown)` | `thrown.getMessage()` 与 fixture 里每条 `消息包含:` 片段的逐个比对——**任何用例的红/绿最终都收敛到这几行**；断言失败时的消息会同时打印"期望片段"与"实际消息"，是排障第一现场 |

## 5. 行号对照表（断点坐标 ↔ 代码内容 ↔ 决策依据）

| 文件 | 行号 | 代码内容（截取） | 对应裁决/规则 |
| --- | --- | --- | --- |
| `CSVFormat.java` | 886-889 | `public Builder setRequiredHeaders(final String... requiredHeaders) { final String[] clone = CSVFormat.clone(requiredHeaders); this.requiredHeaders = clone == null \|\| clone.length == 0 ? null : clone; …}` | D7（归一化）、E12（拷贝惯例） |
| `CSVFormat.java` | 1939-1941 | `public String[] getRequiredHeaders() { return requiredHeaders != null ? requiredHeaders.clone() : null; }` | D7、E12 |
| `CSVFormat.java` | 2851-2853 | `if (requiredHeaders != null && headers == null) { throw new IllegalArgumentException(String.format("Required headers %s are set but no header is defined", …)); }` | D6（A-R2 / AC-1） |
| `CSVFormat.java` | 1769 / 2125 / 2788-2791 | equals / hashCode / toString 各补一维 | 值对象完整性（ch04-2 §F3） |
| `CSVParser.java` | 615-619 | `createEmptyHeaderMap()`：`ignoreHeaderCase ? TreeMap(CASE_INSENSITIVE_ORDER) : LinkedHashMap` | E6 / D2 |
| `CSVParser.java` | 659 / 666-668 | 空名 / 重复名 `IllegalArgumentException`（既有代码，未改动） | E1 / E2 / D3 |
| `CSVParser.java` | 683-693 | `final String[] requiredHeaders = format.getRequiredHeaders(); … containsKey … throw new CSVException("Missing required header(s) %s in %s", …)` | **D1、D2、D3、D5、D7、D8 的落点**（B-R4~B-R7 / AC-4） |
| `CSVPrinter.java` | 120-122 | `if (format.getHeader() != null && !format.getSkipHeaderRecord()) { this.printRecord((Object[]) format.getHeader()); }`（既有代码，未改动） | D4 / E13（C-R1 / AC-5） |
| `RequiredHeadersScenario.java` | 89 / 166 / 193 / 257 | `parse` / `execute` 的 switch / `applyConfig` / `assertFragments` | 解析器-执行器分离（ch04-2 §2.4） |
| `RequiredHeadersApprovedScenariosTest.java` | 61 / 67 / 73 / 89 | 三个入口方法 / `fixtures` 扫描 | 方案二（三入口镜像三决策表，ch04-2 §4 推荐理由 1） |

> **行号时效**：以上行号对应"实现完成、未提交"的工作区（`git status` 可见全部改动）。任何后续对 `CSVFormat.java` / `CSVParser.java` 的编辑都会使 2851 / 687 等行号漂移——重跑 `grep -n "requiredHeaders != null && headers == null"` 或 `grep -n "containsKey(requiredHeader)"` 即可重新定位。
