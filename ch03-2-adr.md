# ADR：`CSVFormat.Builder.setRequiredHeaders(String...)` 的开放设计裁决

> **分析基线**：`./commons-csv`，HEAD `24562da2`（`1.15.0-SNAPSHOT`），与 `ch02-2-2-subdomains.md`、`ch02-2-3-impact-analysis.md` 的基线一致；本次核查行号均在该 HEAD 复核。
> **协作模式**：用户授权（ch03-1 对话 Round 0，Q0 = c 授权制）——本文所有裁决由测试架构师基于代码证据作出，用户在最终文档评审时行使否决权。
> **读法**：§1 是证据清单（E1–E13），§2 每条裁决（D1–D10）都引用证据编号，§3 是汇总表。本文档独立可读，不依赖对话上下文。

---

## 1. 核查证据清单（第一步的实地核查结果）

按任务要求的 6 个核查项组织；每条证据给出文件、行号、关键代码/消息原文。

### 1.1 `createHeaders()` 对空列名与重复列名的处理（核查项 1）

**E1 空列名检查——逐列、循环内、遇首个即抛**（`CSVParser.java:655-659`）：

```java
final boolean blankHeader = CSVFormat.isBlank(header);
if (blankHeader && !format.getAllowMissingColumnNames()) {
    throw new IllegalArgumentException("A header name is missing in " + Arrays.toString(headerRecord));
}
```

- `isBlank` 的定义（`CSVFormat.java:1480-1482`）：`value == null || value.trim().isEmpty()`——null、空串、纯空白串都算"缺失"。
- 默认 `allowMissingColumnNames = false`（`Builder` 字段 `:235` 无初始化器，boolean 默认 false；`Builder.create()` `:214-222` 也未设置它）→ **默认即抛**。

**E2 重复列名检查——同一循环内、位于空名检查之后、遇首个即抛**（`CSVParser.java:661-669`）：

```java
final boolean containsHeader = blankHeader ? observedMissing : headerMap.containsKey(header);
final DuplicateHeaderMode headerMode = format.getDuplicateHeaderMode();
final boolean duplicatesAllowed = headerMode == DuplicateHeaderMode.ALLOW_ALL;
final boolean emptyDuplicatesAllowed = headerMode == DuplicateHeaderMode.ALLOW_EMPTY;
if (containsHeader && !duplicatesAllowed && !(blankHeader && emptyDuplicatesAllowed)) {
    throw new IllegalArgumentException(String.format(
            "The header contains a duplicate name: \"%s\" in %s. If this is valid then use CSVFormat.Builder.setDuplicateHeaderMode().",
            header, Arrays.toString(headerRecord)));
}
```

- 空白列名的重复用 `observedMissing` 标志追踪（`:654、:661、:670`），非空白列名用 `headerMap.containsKey`。
- **关键时序事实**：两类检查都是**逐列**（`for (int i = 0; i < headerRecord.length; i++)`）在**同一次遍历**内完成，空名检查（`:658`）先于重复检查（`:665`）作用于同一列；抛出后循环终止，后续列不再检查。**没有任何"全部读完再统一检查"的环节。**

**E3 last-wins 与 blank 列的入 map 规则**（`CSVParser.java:671-677`）：`headerMap.put(header, i)` 后写覆盖前写；只有 `header != null` 才入 map——注意判据是 `null` 而非 `isBlank`，所以非 null 的空白串（如 `" "`）在 `allowMissingColumnNames=true` 时是合法 key。

### 1.2 `validate()` 校验什么、是否只依赖声明形状（核查项 2）

**E4** `CSVFormat.validate()`（`CSVFormat.java:2771-2805`，由私有构造 `:1676` 调用，`Builder.get()` `:327-329` 触发）校验：

1. 方言字符互斥：quote/escape/comment 与 delimiter 两两互斥、quote≠comment、escape≠comment、`QuoteMode.NONE` 必须配 escape（`:2772-2789`）；
2. **手工表头的重复列名**（`:2791-2804`）：仅当 `headers != null && duplicateHeaderMode != ALLOW_ALL` 时检查。

全部校验只读 Builder 字段（声明的形状），**不接触任何输入数据**。其 javadoc（`:2765-2766`）自述理由："Because an instance can be used for both writing and parsing, not all conditions can be tested here. For example, allowMissingColumnNames is only used for parsing, so it cannot be used here."

**E5 validate() 与 createHeaders() 的一个既有不对称**：`validate()` 的重复检查用普通 `HashSet`（`:2792`，**大小写敏感**），而 `createHeaders()` 的重复检查用 `headerMap`（`ignoreHeaderCase=true` 时**大小写不敏感**，见 E7）。即：同一份 `["A","a"]` 手工表头，`ignoreHeaderCase=true` 时 build 期不报、parse 期报。这是"双时机校验会产生语义分叉"的现存实例。

### 1.3 `ignoreHeaderCase` 如何生效（核查项 3）

**E6**（`CSVParser.java:615-619`）：

```java
private Map<String, Integer> createEmptyHeaderMap() {
    return format.getIgnoreHeaderCase() ?
            new TreeMap<>(String.CASE_INSENSITIVE_ORDER) :
            new LinkedHashMap<>();
}
```

大小写语义的生效点就是"列名→序号"映射表本身：`ignoreHeaderCase=true` 时 `"Currency"` 与 `"currency"` 折叠为同一个 key。**所有按名访问（`get`、`isMapped`）都查这张表**，没有第二套比较逻辑。

**E7 表头 key 的"trim"其实由现有方言参数决定**：自动探测的表头行经 `nextRecord()` → `addRecordValue()`（`CSVParser.java:595`）`final String input = format.trim(reusableToken.content.toString())`——即 `format.setTrim(true)`（以及 Lexer 层的 `ignoreSurroundingSpaces`）会改变表头 key 的形态，且发生在映射建立**之前**。默认 `trim=false` 时 key 保留前后空白（D 组热身场景 D1 已实证 `" currency "` 是独立 key）。

### 1.4 表头的配置模式与汇合点（核查项 4）

**E8**（`CSVParser.java:629-650` + `getHeader()` javadoc `CSVFormat.java:1897`）三种模式：

| 模式 | 配置形态 | 行为 |
| --- | --- | --- |
| 无表头 | `headers == null`（从未调 `setHeader`） | `headerMap` 保持 `null`（`:629-632` 不初始化），按名访问抛 `IllegalStateException` |
| 自动探测 | `setHeader()` 无参 → **空数组** | 读文件首行作表头（`:635-641`）；空文件时 `headerRecord == null`，`headerMap` 是**空 map 而非 null**（`:633` 已初始化，`:682` 返回） |
| 手工指定 | `setHeader("a","b")` 非空数组 | 不读文件首行作表头（`+skipHeaderRecord` 时先读弃首行 `:643-648`），`headerRecord = formatHeader`（`:649`） |

`getHeader()` javadoc 原文："A copy of the header array; `null` if disabled, **the empty array if to be read from the file**"——**空数组在 `setHeader` 语义里 = 自动探测**，这是本库既有的"空数组特殊含义"（对 D7 至关重要）。三模式的列名最终汇入**同一段** `for` 循环（`:651-679`）建立映射。

### 1.5 重复表头相关枚举（核查项 5）

**E9** `DuplicateHeaderMode`（`DuplicateHeaderMode.java:28-44`）三个取值：

| 取值 | 语义 | 默认？ |
| --- | --- | --- |
| `ALLOW_ALL` | 允许一切重复 | **是**（`Builder.create()` `:214-222` 显式设置；E2 中 `duplicatesAllowed` 仅在此值时为 true → 默认不查重复） |
| `ALLOW_EMPTY` | 仅空白/空/null 列名允许重复 | 否 |
| `DISALLOW` | 完全禁止重复 | 否 |

### 1.6 受检 / 非受检异常的既有分工（核查项 6）

**E10** 两类并存，分工清晰：

| 类别 | 类型 | 使用场景 | 证据 |
| --- | --- | --- | --- |
| **受检（checked）** | `CSVException extends IOException`（`CSVException.java:31`，构造器即 `String.format` 风格 `:42-44`） | **读入期、输入数据坏**：词法错误（`Lexer.java:397` `"Invalid character between encapsulated token and delimiter at line…"`、`:411` `"(startline %,d) EOF reached before encapsulated token finished"`、`:528` `"EOF while processing escape sequence"`）、INVALID token（`CSVParser.java:939` `"(line %,d) invalid parse sequence"`） | `CSVParser` 私有构造与 `createHeaders()` 本就声明 `throws IOException`（`:524、:628`），`CSVFormat.parse(Reader)` 同（`:2206-2209`）——抛 `CSVException` 子类**无需改任何签名** |
| **非受检（unchecked）** | `IllegalArgumentException` | **配置期 + 表头结构期**：`validate()` 全部（`:2773-2788`、`:2799`）、`createHeaders()` 空名（`:659`）/重复（`:666`） | — |
| 非受检 | `IllegalStateException` | 无映射时按名访问（`CSVRecord.java:133` `"No header mapping was specified, the record values can't be accessed by name"`） | — |
| 非受检 | `IllegalArgumentException` | 访问期晚失败（`CSVRecord.java:137` `"Mapping for %s not found, expected one of %s"`、`:143-144` `"Index for header '%s' is %d but CSVRecord only has %d values!"`）——**正是需求要提前化的那个错误** | — |

归纳出的既有分界线：**"声明自身的错误"（配置矛盾、结构不合法）→ 非受检 `IllegalArgumentException`；"输入数据不满足声明"（词法坏、EOF 截断）→ 受检 `CSVException`**。

### 1.7 其他关键事实

- **E11 校验时序**：`CSVParser` 私有构造（`:524-532`）在 `:528` 调 `createHeaders()`，天然先于任何 `iterator()/next()/getRecords()`——"读到第一条数据记录之前"的插桩窗口就在 `createHeaders()` 内部。
- **E12 防御性拷贝惯例**：`Builder.setHeader(String...)`（`CSVFormat.java:627-630`）`this.headers = CSVFormat.clone(header)`；`getHeader()`（`:1899-1901`）返回 `headers != null ? headers.clone() : null`。
- **E13 写方向的表头语义**：`CSVPrinter` 构造器（`CSVPrinter.java:120-122`）`if (format.getHeader() != null && !format.getSkipHeaderRecord()) { this.printRecord((Object[]) format.getHeader()); }`——写方向把 header 当**输出物**打印，不是对输入的断言。
- **E14 新名字确实不存在**：`requiredHeaders`/`setRequiredHeaders` 在 `src/main` 零匹配（仅 kata 特征测试的 javadoc 注释提及），需求完全未实现。
- **E15 消息风格先例**：既有表头错误消息都用 `Arrays.toString(headerRecord)` 列出实际表头（E1、E2），形如 `"… in [a, b, c]"`。

---

## 2. 裁决

覆盖任务点名的 7 个问题（D1–D7）+ 核查中发现的 3 个额外问题（D8–D10）。每条裁决含【决策】【理由】【对决策表的影响】。

### D1 异常类型：新增行为用 `CSVException`（受检），配置矛盾用 `IllegalArgumentException`（非受检）

**决策**：
- **缺必需列**（parse 期发现）抛 **`CSVException`**。建议消息模板（沿用 E15 风格，缺失名单按声明序去重）：

  ```
  Missing required header(s) [currency, rate] in [date, amount]
  ```

  即 `throw new CSVException("Missing required header(s) %s in %s", missingList, Arrays.toString(headerRecord))`——`CSVException` 的 `String.format` 构造器（E10）与之天然契合。验收测试断言片段：类型精确断言 `CSVException`；消息断言 `"Missing required header(s)"` + 缺失列名（如 `"currency"`）。
- **配置矛盾**（设了 required 却无表头，见 D6）抛 `IllegalArgumentException`（与 `validate()` 全部先例同类，E4/E10）。

**理由**：E10 归纳的既有分界线是"声明自身错误 → 非受检；输入数据不满足声明 → 受检"。缺必需列属于后者：`requiredHeaders` 名单是对的，是**上游文件**缺列——对账场景（需求背景）里这是可预期的运维事件而非编程错误，调用方应能精确 `catch (CSVException)` 并告警，而不是让一个 `IAE` 沿着数据管道当 bug 传播。工程可行性：`createHeaders()` 已声明 `throws IOException`（E10），抛其子类零签名改动；且 `parse()` 调用方现有 `catch (IOException)` 兜得住。代价与取舍：与 `createHeaders()` 现有两例（空名/重复名，`IAE`）不同类——但那两例把"数据坏"报成非受检本身是历史偶然（1.10 之前无 `CSVException`，该类 1.12 才引入），新特性没有义务复制历史；表头**结构**不合法（空名/重复名）维持 `IAE` 不动（不属于本次需求）。

**对决策表的影响**：动作集合分为两层——配置矛盾动作（`IAE`@build）与缺列动作（`CSVException`@parse）；消息格式是动作条目的一部分。

### D2 匹配语义：完全复用 `headerMap`——大小写跟随 `ignoreHeaderCase`，不做任何 trim

**决策**：必需列的命中判定就是 `headerMap.containsKey(required)`（实现上即 `required ⊆ headerMap.keySet()`）。不引入任何第二套比较逻辑：**不 trim、不忽略空白**；大小写敏感性**跟随 `ignoreHeaderCase` 配置**。

**理由**：E6 表明大小写语义的生效点就是映射表实现（`TreeMap(CASE_INSENSITIVE_ORDER)` vs `LinkedHashMap`）——只要校验查这张表，语义自动一致，且**必然**一致。反向论证：若 required 用独立的比较器（比如永远忽略大小写），会出现"required 校验通过、随后 `record.get("Currency")` 却抛 `Mapping for Currency not found`"（E10，`CSVRecord.java:137`）的自相矛盾——早失败机制把晚失败挡住了，晚失败却还在。空白同理：E7 表明 key 的形态在映射建立前已由 `trim`/`ignoreSurroundingSpaces` 方言参数决定，`" currency "` 默认就是独立 key（D1 热身场景实证）；required 校验不应比 `get()` 更宽容。

**对决策表的影响**：产生两个条件——"required 与实际表头的差异形态"（无差异/仅大小写/仅空白/不存在）与 `ignoreHeaderCase`，二者交互决定命中（仅大小写差异时才受 `ignoreHeaderCase` 影响，其余形态下该配置是 don't care）。

### D3 与空名/重复名校验的交互顺序：结构性错误绝对优先

**决策**：同一次解析中既有表头结构问题（空名、重复名）又缺必需列时，**结构异常先抛**；required 校验插入点为 `createHeaders()` 的 `for` 循环结束后、`return` 之前（`CSVParser.java:679-682` 之间）。

**理由**：一半是技术必然——缺失判定需要**完整**的 `headerMap`，而空名/重复名检查是逐列的（E1/E2），结构异常若存在，循环根本走不到头；另一半是语义选择——表头结构不合法时"缺了哪些列"的答案不可信（重复列 last-wins（E3）会让同名列的索引指向歧义，空列名（E1）会让"缺失"清单混入噪音）。先修结构、再谈完整性，与既有行为（空名先于重复名，同为"先到先抛"）的故障排查习惯一致。

**对决策表的影响**：产生门控关系——条件"存在结构性表头错误"为真时，required 相关条件全部为 don't care，动作为现状结构异常（非新增动作）。

### D4 读写对称性：写方向不校验

**决策**：携带 `requiredHeaders` 的 `CSVFormat` 交给 `CSVPrinter` 时**不执行任何必需列校验**，打印行为与未设 required 完全相同。

**理由**：E13 表明写方向的 header 是**输出物**（构造器直接 `printRecord(format.getHeader())`）；required 是对**输入**的断言（"上游必须给这些列"），二者语义不对称。E4 的 `validate()` javadoc 亦明示同一格式对象兼用于读和写、"not all conditions can be tested here"——在共用对象上强加方向不对称的断言会误伤合法用法（例如同一 `CSVFormat` 常量既解析上游对账文件、又输出下游报表，只写部分列）。D6 的 build 期检查只查"配置自洽"（是否设了表头模式），不涉及方向，与本条不冲突。

**对决策表的影响**：单独一张迷你表（表 C，1 条规则）钉住"写方向 = 无操作"，避免它混入读方向表制造噪声条件。

### D5 自动探测与手工指定：读入期单点校验，行为一致（不在 build 期提前查）

**决策**：required 校验的**唯一执行点**是 `createHeaders()` 末尾。手工表头模式**不**在 `validate()` 提前校验 required ⊆ headers，尽管技术上可行。

**理由**：(a) **消除时点漂移**——若手工模式 build 期抛、自动模式 parse 期抛，同一逻辑错误（名单写错）的抛点随配置模式漂移，调用方要写两套 catch；(b) **消除大小写分叉**——E5 是现存教训：`validate()` 的重复检查用大小写敏感 `HashSet`，`headerMap` 可大小写不敏感（E6）；若在 `validate()` 加 required 检查，要么复制这处分叉，要么在 S1 重建一遍映射逻辑，两头都是维护负担；(c) **语义同源**——required 校验的对象应与 `get()` 查询的对象严格同源（都是 `headerMap`，见 D2），单点校验天然保证；(d) 双时机先例（重复列名）的存在不构成充分理由——该先例正是 E5 分叉的来源，不是值得效仿的样板。

**对决策表的影响**："表头来源（自动/手工）"**不是**决策表条件（对校验结果无影响），降级为测试用例**变体**维度——在关键规则下用手工模式变体钉住一致性。

### D6 配置自洽性：设了 required 却无表头 → build 期 fail-fast

**决策**：`requiredHeaders` 非空（且归一化后仍非空，见 D7）而 `headers == null`（从未调用任何 `setHeader`）→ `validate()` 抛 `IllegalArgumentException`，建议消息：

```
Required headers [currency] are set but no header is defined
```

（`[currency]` 为 `Arrays.toString(requiredHeaders)`；验收断言片段 `"no header is defined"`。）

**理由**：这个矛盾**只依赖配置本身的形状**（两个字段都是 Builder 字段），是 `validate()` 的本职（E4："参数间不变式的 build 期校验"）。若推迟到 parse 期：要么静默跳过校验（特性悄悄失效——最坏结果），要么把配置错误伪装成数据错误抛 `CSVException`（违背 E10 分界线）。注意与 D5 的分工：D6 查的是"配置层可判定的矛盾"，D5 拒绝的是"需要 required 与表头内容交叉比较的提前校验"——前者不涉语义分叉，后者涉（理由见 D5(b)）。

**对决策表的影响**：表 A（build 期决策点）新增一个动作分支："表头模式 = 无 × required 非空 → `IAE`@build"；同时它是表 B 的前提条件（表 B 只处理 build 通过的配置）。

### D7 空值/未设置语义：`null` 与空数组都表示"未设置"，内部归一化为 `null`；名单自身重复/空白不特判

**决策**：
1. `setRequiredHeaders(null)`、`setRequiredHeaders()`（空数组）与"从未调用"三者**运行时等价**（特性关闭）；Builder 内部把 null/空数组归一化为 `null`（照 E12 惯例防御性拷贝），`getRequiredHeaders()` 照 `getHeader()` 惯例（E12）返回拷贝或 `null`。
2. 名单自身含**重复项**：不抛配置错误；报缺失时**去重且保持声明序**（保证消息确定性、可断言）。
3. 名单含**空白名**（`isBlank`，E1 定义）：不特判——它就是普通名字，按 D2 语义匹配（理论上可命中 `" "` 表头，E3；实际上几乎必是调用方笔误，但库不做 nanny 检查，与 `setHeader` 从不检查名字内容的作风一致）。

**理由**：第 1 点是本决策的核心，动因恰是 E8 揭示的既有陷阱：`setHeader` 的**空数组 = 自动探测**（"the empty array if to be read from the file"）。required 名单是**断言**不是**描述**，不存在"从文件推断要哪些列"的语义，空数组绝不能类比获得特殊含义——三值归一为"未设置"是最不会误读的设计。第 2 点：重复项对 `required ⊆ headerMap.keySet()` 的判定无影响（重复查询不改变集合关系），抛错反而制造无谓的失败；去重保序是为了 D1 消息的可测试性。第 3 点：一致性优先（与 `get()` 对空白名字的处理完全相同）。

**对决策表的影响**：条件"required 设置状态"取值集为 **{未设置（null/空数组归一化）, 已设置（≥1 个名字）}** 两档，而不是三档——`null` 与空数组不构成可区分的规则；"名单自身重复"不设条件，派生 1 条变体钉住"不抛 + 去重"。

### D8 空文件 + 自动探测：不特判，统一走"缺全部"

**决策**：空文件 + `setHeader()`（自动探测）+ required 非空 → 抛 `CSVException`，缺失名单为全部 required，实际表头显示为 `[]`。不为"文件为空"增加专门错误。

**理由**：E8 表明该场景下 `headerMap` 是**空 map 而非 null**（`:633` 已初始化、`:682` 正常返回）——`required ⊆ ∅` 恒假，统一命中"全部缺失"路径。空文件本来就是"缺所有列"的极端情形（对账场景：上游没给数据 = 没给列），单独造一类错误反而增加调用方分支。这也顺带验证了 D6 不误伤：设了 `setHeader()` 的配置 `headers != null`，build 期放行是正确的。

**对决策表的影响**：不新增条件；作为"缺失程度"取值的**变体**（缺全部列），兼测空 map 边界。

### D9 手工指定模式下 required 对照的是手工名单，不是文件内容

**决策**（D5 的必然推论，单列出来防止实现走样）：手工表头模式下，required 的对照对象是**手工名单建立的 `headerMap`**；文件首行是否包含这些列名完全无关（`skipHeaderRecord` 与否只决定首行是否被当数据读掉，E8）。

**理由**：E8 显示手工模式下 `headerRecord = formatHeader`（`:649`），映射与文件首行无关；D2 要求与 `get()` 同源——`get("currency")` 查的就是手工名单映射，required 若另查文件就是两套真相。

**对决策表的影响**：不新增条件（已被 D5 吸收）；派生 1 条手工模式变体，测试数据刻意让**文件首行包含 required 而 VICE VERSA 不成立**（即文件首行缺 required）以钉住"对照手工名单"。

### D10 不为 required 引入任何新的表头形态规则（trim / ignoreSurroundingSpaces / maxRows / skipHeaderRecord 全部无关）

**决策**：`trim`、`ignoreSurroundingSpaces`、`skipHeaderRecord`、`maxRows`、`trailingDelimiter` 等既有方言参数与 required 校验**零交互**——它们要么作用于 key 形态的形成阶段（E7，先于且独立于校验），要么作用于记录读取（晚于校验）。

**理由**：E7 的机制事实 + D2 的"无第二套逻辑"裁决。把这些列为条件只会让决策表按 2^n 膨胀而不产生任何新动作（附录 A"局限性 1：条件指数增长"要主动规避）。

**对决策表的影响**：这批维度全部进入决策表文档 Step 1 的"**看似条件、实被排除**"清单，逐条给出排除理由。

---

## 3. 决策记录汇总表

| # | 问题 | 决策 | 关键依据 |
| --- | --- | --- | --- |
| D1 | 异常类型 | 缺列抛受检 `CSVException`（消息 `Missing required header(s) [x] in [实际表头]`）；配置矛盾抛 `IllegalArgumentException` | E10 分界线（声明错误=非受检 / 数据不满足声明=受检）；E15 消息风格；`createHeaders()` 已 `throws IOException`，零签名改动 |
| D2 | 大小写/空白匹配语义 | 完全复用 `headerMap`：跟随 `ignoreHeaderCase`；不 trim、不忽略空白 | E6（大小写生效点=Map 实现）；E7 + D1 场景（key 不 trim）；矛盾反证：校验若比 `get()` 宽容会出现"过了校验仍晚失败" |
| D3 | 与结构校验的顺序 | 结构错误（空名 > 重复名，逐列先到先抛）绝对优先；required 校验插在 `:679` 循环后、`:682` return 前 | E1/E2（逐列检查的技术必然：缺失判定需要完整 map）；E3（last-wins 让缺失答案不可信） |
| D4 | 读写对称性 | 写方向不校验，打印行为与未设 required 相同 | E13（header 是输出物）；E4 javadoc（一对象读写共用） |
| D5 | 自动/手工模式一致性 | 读入期单点校验（`createHeaders()` 末尾），不在 build 期提前查 | E5（validate 用大小写敏感 HashSet 的现存分叉教训）；E8（三来源单点汇合）；与 `get()` 同源（D2） |
| D6 | 配置矛盾发现时机 | required 非空 + 无表头 → build 期 `validate()` 抛 `IllegalArgumentException`（`Required headers [x] are set but no header is defined`） | E4（validate=声明形状自检的本职）；E8（headers==null 时 headerMap==null，parse 期只能静默失效或错抛） |
| D7 | 空值/未设置语义 | null/空数组=未设置（归一化 null）；名单重复不抛、报缺失去重保序；空白名不特判 | E8（setHeader 空数组=自动探测的既有陷阱——required 是断言，不能获得类比含义）；E12（拷贝惯例）；E1/E3（空白 key 现状） |
| D8 | 空文件 + 自动探测 | 不特判，统一"缺全部"，实际表头 `[]` | E8（空 map 而非 null，`:633/:682`） |
| D9 | 手工模式对照对象 | 对照手工名单映射，与文件首行无关 | E8（`:649` headerRecord=formatHeader）；D2 同源要求 |
| D10 | 其他方言参数交互 | trim/ignoreSurroundingSpaces/skipHeaderRecord/maxRows 等与校验零交互，全部排除出决策表 | E7（key 形态先于校验形成）；附录 A 局限性 1（防条件膨胀） |

> **给决策表文档的接口**：条件取值（D7 两档）、门控关系（D3）、don't care 标注依据（D2/D5/D10）、动作与消息（D1/D6）、三决策点拆表（D4/D5/D6）、变体清单（D5/D7/D8/D9）均由本表导出，详见 `ch03-3-decision-tables.md`。
