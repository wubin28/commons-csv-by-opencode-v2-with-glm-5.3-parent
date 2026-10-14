# ch02-1-3 单步调试指南：表头 / 列名 / 取值（commons-csv 热身）

- **代码库版本锚**：`./commons-csv`，HEAD `c6ac1bde`，`1.15.0-SNAPSHOT`。**所有行号都是这份代码的行号**（在 IDE 里打开的就是这份克隆——已确认）。行号会随版本漂移，因此每条断点都附"该行语句原文"，三重定位。
- **实测结果**（2026-10-14，Maven 3.9.16 + JDK 21）：新增测试 18/18 通过；全量 `1003 / 0 失败 / 11 跳过`（加入前基线 `985 / 0 / 11`，无任何已有测试被破坏）。

---

## 0. 可直接复制执行的命令

```bash
# 运行全量测试（加入 kata 后预期：Tests run: 1003, Failures: 0, Errors: 0, Skipped: 11）
cd /Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/commons-csv && mvn test

# 只运行本批新增测试（预期：Tests run: 18, Failures: 0, Errors: 0, Skipped: 0）
mvn test -Dtest=HeadersCharacterizationTest
```

说明：

- `mvn test` 生命周期里就会跑 Apache RAT 许可证检查（`apache-rat:0.18:check`）和 JaCoCo agent（`jacoco:prepare-agent`）——看到这两段输出是正常的。
- `-Dtest=HeadersCharacterizationTest` 会把 4 个 `@Nested` 内嵌类一起跑到（输出显示为 `HeadersCharacterizationTest$HeaderSources` 等）；**外层类那一行显示 `Tests run: 0` 是正常的**（外层类自己没有 `@Test` 方法），以最后 `Results:` 的汇总（18）为准。

## 1. 生产代码关键路径总览（先读这个再打断点）

表头相关行为只涉及三个类，调用链只有一条主线：

1. **配置阶段**：`CSVFormat.Builder.get()`（`CSVFormat.java:327`，语句 `public CSVFormat get() {` → 328 行 `return new CSVFormat(this);`）→ 私有构造函数 `CSVFormat(Builder)`（`CSVFormat.java:1653`）末尾 1676 行 `validate();` → **手工表头的重复/空名校验在这里**（`CSVFormat.java:2790-2804`）。
2. **解析阶段**：`format.parse(reader)`（`CSVFormat.java:2207`，语句 `public CSVParser parse(final Reader reader) throws IOException {`）→ `CSVParser` 私有构造函数（`CSVParser.java:524`）→ **528 行 `this.headers = createHeaders();`** → `createHeaders()`（`CSVParser.java:628-683`）：这是**三种表头来源的汇合点**，也是**文件表头**的空名/重复名校验发生地（658-659、665-668）。
3. **取值阶段**（惰性）：`parser.getRecords()`/`iterator()` → `CSVRecordIterator.getNextRecord()`（`CSVParser.java:251-260`）→ `nextRecord()`（`CSVParser.java:915`）→ 业务代码 `CSVRecord.get(String)`（`CSVRecord.java:130-146`）。

**记住一句话**：表头校验有两个时机——手工表头在 **build 时**（`builder.get()`），文件表头在 **parse 时**（`format.parse()`，构造函数内）；而**数据记录永远是惰性的**，只会在构造完成之后才被读。这就是"在读第一条记录之前报错"能够成立的机制基础。

测试文件：`commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java`（下文嵌套类名/方法名后的行号是该文件内行号）。

---

## 2. 各测试用例单步调试要点

### A 组 `HeaderSources`

#### A1 `noHeaderGetValueByIndexAndGetByNameThrows`（:67）

- 断点：
  - `CSVParser.java:631`：`final String[] formatHeader = format.getHeader();` —— `DEFAULT` 没配表头，此处 `formatHeader == null`，632 行 `if (formatHeader != null) {` 不进入，`headerMap` 保持 `null`。
  - `CSVParser.java:682`：`return new Headers(headerMap, headerNames == null ? Collections.emptyList() : Collections.unmodifiableList(headerNames));` —— 观察返回的 `Headers.headerMap == null`。
  - `CSVRecord.java:132-133`：`if (headerMap == null) {` / `throw new IllegalStateException("No header mapping was specified, the record values can't be accessed by name");` —— 按名取值在这里失败（注意类型是 `IllegalStateException`，不是 `IllegalArgumentException`）。
- 观察变量：
  - `formatHeader`（局部）——决定走不走建表头分支的唯一开关；
  - `headers.headerMap`（`CSVParser` 字段 `headers`，声明于 `CSVParser.java:489`；`Headers.headerMap` 声明于 `:304`）——`null` 即"无表头世界"；
  - `record.values`（`CSVRecord` 字段）——下标取值 `get(0)` 只是 `values[i]`（`CSVRecord.java:104`：`return values[i];`），没有任何映射参与。
- 插入点提示：**A1 是 `setRequiredHeaders` 的"全缺"极端**——format 根本没配表头时 `headerMap` 为 `null`，新校验必须把"所有 required 都缺"这种情况也报出来，不能只对照 `headerMap.keySet()`。

#### A2 `autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`（:85，文档推荐组合）

- 断点：
  - `CSVParser.java:635`：`if (formatHeader.length == 0) {` —— `setHeader()` 无参传入的是**空数组**（`CSVFormat.java:628`：`this.headers = CSVFormat.clone(header);` 对空 varargs 得 `String[0]`），走"从文件首行读表头"分支；
  - `CSVParser.java:637`：`final CSVRecord nextRecord = nextRecord();` —— **表头行在这里、解析器构造期间被消费**；
  - `CSVParser.java:639`：`headerRecord = nextRecord.values();` —— 首行的值数组成为表头；
  - `CSVParser.java:672`：`headerMap.put(header, Integer.valueOf(i)); // Explicit boxing is intentional` —— 逐列建立 `名 → 下标` 映射。
- 观察变量：`formatHeader`（长度 0）、`nextRecord`（临时持有首行）、`headerRecord`（`String[]{"id","currency","amount"}`）、循环里的 `header`/`i`（`i=1, header="currency"` 时看 put 进 map）、`headerMap`（LinkedHashMap，保持列序）。
- 为什么看这些：能亲眼确认"表头行被吃掉发生在构造期"，之后 `getRecords()` 读到的第一条就是数据行 `1,USD,100`。

#### A2b `autoDetectedHeaderWithoutSkipFlagStillSkipsHeaderLine`（:100）

- 断点：同 A2；重点对比 `CSVParser.java:643`：`if (format.getSkipHeaderRecord()) {` —— **在 635 的空数组分支里根本走不到**，证明 `skipHeaderRecord` 对自动探测是冗余标志（首行已在 637 被消费）。
- 观察变量：`format.skipHeaderRecord`（`CSVFormat` 字段，构造拷贝见 `CSVFormat.java:1672`）——值为 `false`，但行为与 A2 完全一致。

#### A3 `manualHeaderOnHeaderlessSource`（:109）

- 断点：
  - `CSVParser.java:649`：`headerRecord = formatHeader;` —— 手工表头**直接把配置数组当表头记录**，不读文件；
  - `CSVParser.java:672`：`headerMap.put(header, Integer.valueOf(i));` —— 同样进映射循环。
- 观察变量：`headerRecord` 与 `format.getHeader()` 内容相同；文件首行 `1,USD,100` 留给数据迭代器。

#### A4 `manualHeaderWithSkipHeaderRecordSkipsFileHeaderLine`（:118）

- 断点：
  - `CSVParser.java:643`：`if (format.getSkipHeaderRecord()) {` —— 手工表头（非空数组）时条件成立；
  - `CSVParser.java:644`：`final CSVRecord nextRecord = nextRecord();` —— **消费并丢弃**文件自己的表头行（只留下 comment）。
- 观察变量：644 行的 `nextRecord`（值是 `id,currency,amount` 那行，随后被丢弃）；`headerRecord`（649 行赋值为 `formatHeader`，与文件内容无关）。

#### A4b `manualHeaderWithoutSkipReadsFileHeaderLineAsData`（:129，对照）

- 断点：`CSVParser.java:253-254`：`if (format.useRow(recordCount + 1)) {` / `record = Uncheck.get(CSVParser.this::nextRecord);` —— 忘设 skip 时，文件表头行没人消费，成为迭代器吐出的**第一条数据记录**。
- 观察变量：`recordCount`（`CSVRecordIterator` 字段，`:242`）从 0 开始计数——第 1 条就是文件首行。
- 插入点提示：这就是"表头语义错位"最常见的事故形态——`setRequiredHeaders` 校验发生在解析器构造期，**救不了**这种"文件首行其实不是你以为的表头"的配置错误（手工表头 + 忘 skip），只能校验手工表头自身的完整性。

### B 组 `NameAccessBoundaries`

#### B1 `getByNameWithUnknownNameThrowsMappingNotFound`（:143）

- 断点：
  - `CSVRecord.java:135`：`final Integer index = name == null ? null : headerMap.get(name);` —— `name="nope"` 时 `index == null`；
  - `CSVRecord.java:137`：`throw new IllegalArgumentException(String.format("Mapping for %s not found, expected one of %s", name, headerMap.keySet()));` —— 需求原文的痛点就在这一行。
- 观察变量：`name`、`index`（null）、`headerMap.keySet()`（`[id, currency, amount]`——消息后半句就是它）。
- 为什么看这些：需求引用的文案 `Mapping for currency not found` 是这条消息的**前缀**；真实消息还带 `expected one of [...]`。将来 `setRequiredHeaders` 的报错文案要与这条区分开（一条在解析期、一条在取值期）。

#### B2a `headerLongerThanRecordThrowsIndexMessage`（:153）

- 断点：
  - `CSVRecord.java:140`：`return values[index.intValue()]; // Explicit unboxing is intentional` —— `index=2` 但 `values.length=2`，抛 `ArrayIndexOutOfBoundsException`；
  - `CSVRecord.java:143-144`：`throw new IllegalArgumentException(` / `String.format("Index for header '%s' is %d but CSVRecord only has %d values!", name, index, Integer.valueOf(values.length)));` —— 被 catch 后转成带列名、期望下标、实际长度的 `IllegalArgumentException`；
  - `CSVRecord.java:239`：`return headerMap == null || headerMap.size() == values.length;`（`isConsistent()`，签名 `:237`）—— `3 != 2` → `false`。
- 观察变量：`index`（2）、`values`（长度 2 的 `String[]`）、`headerMap.size()`（3）。
- 插入点提示：这是"**隐性缺列**"——表头声明了 `amount`，数据行给不出第 3 个值。它同样只在**取值时**才炸；`setRequiredHeaders` 校验的是"表头集合里有没有这个列名"，管不到数据行的长短——两个正交的校验维度，别混。

#### B2b `recordLongerThanHeaderIsInconsistentButReadable`（:165）

- 断点：`CSVRecord.java:239`（同上，`3 != 4` → `false`）；`CSVParser.java:594-602` `addRecordValue(...)`（数据多出的列照常进 `recordList`，不受表头长度约束）。
- 观察变量：`record.values.length`（4）vs `headerMap.size()`（3）。

#### B3a `headerOnlyFileYieldsNoRecordsButHeaderMap`（:175）

- 断点：`CSVParser.java:637-641`（首行即表头行被消费）；随后 `CSVParser.java:253` 处 `nextRecord()` 返回 `null`（EOF），循环不再产出记录。
- 观察变量：`headers.headerMap`（3 项齐全）、`getHeaderNames()`（`CSVParser.java:762-764`，列序只读列表）。
- 为什么看这些：确认"表头的世界"与"数据的世界"可以完全独立存在——required 校验只依赖前者。

#### B3b `emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap`（:185）

- 断点：`CSVParser.java:637`：`final CSVRecord nextRecord = nextRecord();` —— 空文件立即返回 `null`；638 行 `if (nextRecord != null) {` 不进入 → `headerRecord` 保持 `null` → 652 行 `if (headerRecord != null) {` 不进入 → 682 行返回**空 Map**。
- 观察变量：`headerMap`（633 行 `createEmptyHeaderMap()` 已创建的 `LinkedHashMap`，非 null）、`headerNames`（null → 682 行转 `Collections.emptyList()`）。
- 插入点提示：**新校验只判 `headerMap == null` 会漏掉这个分支**——`setHeader()` + 空文件时 `headerMap` 是空 Map，required 列同样"全缺"。这是实测踩出来的边界（见附录踩坑记录 P7）。

### C 组 `DuplicateAndBlankHeaders`

#### C1a `duplicateManualHeaderWithDisallowThrowsAtFormatBuild`（:200）

- 断点（调用链完整走一遍）：
  - `CSVFormat.java:328`：`return new CSVFormat(this);`（`get()` 内）；
  - `CSVFormat.java:1676`：`validate();`（构造函数最后一句）；
  - `CSVFormat.java:2791`：`if (headers != null && duplicateHeaderMode != DuplicateHeaderMode.ALLOW_ALL) {` —— 进入手工表头校验；
  - `CSVFormat.java:2797`：`final boolean containsHeader = !dupCheckSet.add(blank ? "" : header);` —— 第二个 `"id"` `add` 返回 `false` → `containsHeader == true`；
  - `CSVFormat.java:2799`：`throw new IllegalArgumentException(String.format(` —— 在 **builder.get()** 就抛出。
- 观察变量：`dupCheckSet`（`HashSet`，看它逐步变大）、`header`（当前列名）、`duplicateHeaderMode`（`DISALLOW`；默认值是 `ALLOW_ALL`——`CSVFormat.java:221`，所以默认不进 2791 的分支）。

#### C1b `duplicateFileHeaderWithDisallowThrowsAtParserCreation`（:210）★ 本热身最关键的一个测试

- 断点：
  - `CSVFormat.java:2207`：`public CSVParser parse(final Reader reader) throws IOException {`；
  - `CSVParser.java:528`：`this.headers = createHeaders();`（构造函数内）；
  - `CSVParser.java:661`：`final boolean containsHeader = blankHeader ? observedMissing : headerMap.containsKey(header);` —— 第二个 `"id"` 已在 map → `containsHeader == true`；
  - `CSVParser.java:665`：`if (containsHeader && !duplicatesAllowed && !(blankHeader && emptyDuplicatesAllowed)) {` → `CSVParser.java:666-668` 抛出。
- 观察变量：`headerMap`（已含 `id→0`）、`duplicatesAllowed`（`DISALLOW` → false）、`headerMode`。
- 为什么看这些：**异常从 `format.parse(...)` 调用本身抛出**，数据行 `1,USD,2` 从未被消费——这就是"在读第一条数据记录之前报错"的现成先例，`setRequiredHeaders` 照这个时机做即可。
- 插入点提示：见第 3 节候选 2，插入位置就在这附近的同层级。

#### C2 `duplicateNameAllowedByDefaultResolvesToLastIndex`（:220）

- 断点：`CSVParser.java:672`：`headerMap.put(header, Integer.valueOf(i)); // Explicit boxing is intentional` —— 第二个 `"id"` 以 `i=2` **覆盖** `id→0`。
- 观察变量：`headerMap.get("id")`（从 0 变 2）；`duplicateHeaderMode`（默认 `ALLOW_ALL`，663 行 `duplicatesAllowed == true`，665 不抛）。
- 为什么看这些：与 Javadoc 一致（`CSVRecord.java:108`："only the last occurrence is returned"）；也说明**重复列名下 headerMap 是有损映射**——将来 required 校验用 `headerMap.keySet()` 判断"列存在"没问题，但取值语义是"后列覆盖前列"。

#### C3a `blankHeaderNameIsMappedWhenMissingColumnNamesAllowed`（:232）

- 断点：
  - `CSVParser.java:657`：`final boolean blankHeader = CSVFormat.isBlank(header);` —— 空串 → true（`isBlank` 实现：`CSVFormat.java:1480-1482`，`return value == null || value.trim().isEmpty();`）；
  - `CSVParser.java:658`：`if (blankHeader && !format.getAllowMissingColumnNames()) {` —— 本测试设了 `true`，不抛；
  - `CSVParser.java:671-672`：`if (header != null) {` / `headerMap.put(...)` —— `""` 非 null，**空字符串也是合法 key**，映射到下标 1。
- 观察变量：`blankHeader`、`header`（`""`）、`headerMap`（`{currency=0, =1, amount=2}`）。

#### C3b `duplicateBlankHeadersWithDisallowThrowsAtParserCreation`（:245）

- 断点：`CSVParser.java:661`：`containsHeader = blankHeader ? observedMissing : ...` —— **第二个空名**时 `observedMissing == true`（670 行 `observedMissing |= blankHeader;` 置位）→ 视为重复；`CSVParser.java:665`：三个条件全真（`emptyDuplicatesAllowed == false`）→ 抛出。
- 观察变量：`observedMissing`（第一个空名处理后变 true）、`emptyDuplicatesAllowed`（`DISALLOW` → false）。
- 为什么看这些："空名也算重复"的判定用的是 `observedMissing` 标志位而不是 map 查询——因为空名是否真的 put 进 map 还取决于 671 的 null 判断。这类细节决定新校验**不能假设 keySet 就是表头全集**。

### D 组 `RequirementAdjacent`

#### D1 `headerNameWithSurroundingSpacesNeedsExactMatch`（:260）

- 断点：`CSVParser.java:672`：`headerMap.put(header, Integer.valueOf(i));` —— `header` 的值是 `" currency "`（前后空格原样保留；`CSVFormat.isBlank(" currency ")` 为 false，走正常列名）；`CSVRecord.java:135`：`headerMap.get("currency")` 返回 `null` → `:137` 抛 `Mapping for currency not found...`。
- 观察变量：`header`（注意看字符串两端的空格）、`headerMap.keySet()`（`[id,  currency , amount]`）。
- 插入点提示：**将来 required 匹配必须显式决定**要不要 trim——现状是精确匹配（`DEFAULT` 的 `trim=false`、`ignoreSurroundingSpaces=false`）。若 required 校验做 trim 而取值不做 trim，会出现"校验过了、`get` 却取不到"的自相矛盾。

#### D2 `manualHeaderBindsPositionsNotFileHeaderText`（:271）

- 断点：`CSVParser.java:643-649`（skip 分支消费文件首行）+ `:649`：`headerRecord = formatHeader;` —— 映射的键来自**配置数组**，文件首行文本从头到尾没参与映射。
- 观察变量：`headerRecord`（`["colX","currency","amount"]`）、`headerMap`（`{colX=0, currency=1, amount=2}`）。
- 插入点提示：required 校验的对象是"最终生效的表头"（`headerMap`），它可能来自配置也可能来自文件——所以校验必须放在**汇合点之后**（见第 3 节），放在 `CSVFormat` 校验里会漏掉文件表头，放在别处又可能早于汇合。

---

## 3. `setRequiredHeaders` 插入点：候选对比与推荐

> 本节只回答"生产代码插在哪、为什么"，不实现功能（留给后续 TDD 章节）。

| 候选 | 插入位置 | 能覆盖的表头来源 | 校验时机 | 满足"读第一条记录之前"？ | 主要问题 |
| --- | --- | --- | --- | --- | --- |
| ① | `CSVFormat.validate()` 内（`CSVFormat.java:2790-2804` 的 header 段之后） | **只有手工 `setHeader(...)`**（2791 行的 `headers` 字段） | `builder.get()`（最早，构造 `CSVFormat` 时，1676 行） | 满足，但对最常见场景无效 | 自动探测表头来自文件，build 时**文件还没读**——A2/C1b 那条主链路完全覆盖不到 |
| ② | **`CSVParser.createHeaders()`，映射循环（655-678）之后、`return`（682 行）之前** | **全部来源**：手工（649）、自动探测（635-641）、以及 `headerMap == null`（632 未进入）/空 Map（B3b）两种退化形态 | `format.parse(reader)` → 构造函数 528 行 → `createHeaders()` | **满足**（论证见下） | 需要新增 `CSVFormat.getRequiredHeaders()` 一类的读取入口（Builder setter → 字段 → 1653-1676 拷贝链），属于正常功能开发量 |
| ③ | `CSVParser` 私有构造函数，528 行 `this.headers = createHeaders();` 之后 | 同② | 同② | 满足 | 校验逻辑游离在 `createHeaders()` 之外，而 headerMap 为 null/空、空名、重复等 header 语义全部封装在 `createHeaders()` 里——内聚性差，将来若有第二条构造路径容易漏 |

**推荐：候选②**，即 `CSVParser.java` 的 `createHeaders()` 方法内、682 行 `return new Headers(...)` 之前。

为什么它天然满足"在读第一条记录之前报错"：

1. `createHeaders()` 只被 `CSVParser` 构造函数调用（`CSVParser.java:528`，两个 `@Deprecated` 公开构造器 554/583 最终都委托到 524 的私有构造器）——**解析器一构造完，表头世界就已定案**；
2. 数据记录是惰性的：只有 `CSVRecordIterator.getNextRecord()`（251-260 行）→ `nextRecord()`（915 行）才会读数据行，这些都发生在构造完成**之后**。构造函数里抛出的异常必然先于任何数据记录到达业务代码手里；
3. **现有代码已经用这个时机做过同类校验**：658-659（空名）与 665-668（重复名）都在 `createHeaders()` 里抛 `IllegalArgumentException`，且消息带修复提示（"If this is valid then use CSVFormat.Builder.setDuplicateHeaderMode()"）——新校验照这个风格写"缺了哪些列、缺的列名列表"，与库的现有行为契约一致；
4. 实证：C1b 测试里 `format.parse(new StringReader("id,currency,id\r\n1,USD,2\r\n"))` 在**parse 调用本身**就抛出，数据行 `1,USD,2` 从未被读取。

两个必须处理的实测边界（都是本批测试钉住的）：

- `headerMap == null`（A1：format 没配表头）→ required 非空时属于"全缺"；
- `headerMap` 为**空 Map 而非 null**（B3b：`setHeader()` + 空文件）→ 同样"全缺"，只判 null 会漏。

一个必须显式决策的匹配语义（D1/D2 钉住的）：列名相等用精确匹配还是 trim 后匹配；以及重复列名场景（C2）下 `keySet` 只含一个名字但物理上有两列——校验"存在性"够用，但别顺手对"唯一性"下结论。

配套改动清单（后续 TDD 章节的活）：`Builder.setRequiredHeaders(String...)`（放 `CSVFormat.java:627` `setHeader` 旁边，风格一致）、Builder 字段（249 行 `headers` 附近）、`CSVFormat` 字段与构造函数拷贝（1653-1676）、拷贝构造 `Builder(CSVFormat)`（284-307）、`validate()` 里可做"required ⊆ 手工 header"的提前校验（候选①作为②的**补充**而非替代）。

---

## 4. 行号对照表

### `src/main/java/org/apache/commons/csv/CSVFormat.java`

| 行号 | 内容 | 与本任务的关系 |
| --- | --- | --- |
| 192 | `public static class Builder implements Supplier<CSVFormat> {` | Builder 类声明 |
| 214-223 | `public static Builder create() {`（默认值；221 行 `.setDuplicateHeaderMode(DuplicateHeaderMode.ALLOW_ALL);`） | **默认不检查重复表头**的出处 |
| 235-278 | Builder 字段区（243 `duplicateHeaderMode`、249 `headers`、267 `skipHeaderRecord`、275 `trim`） | 将来加 `requiredHeaders` 字段的位置 |
| 284-307 | `private Builder(final CSVFormat csvFormat)`（拷贝构造） | 新字段必须在此拷贝 |
| 327-329 | `public CSVFormat get() {` / `return new CSVFormat(this);` | build 入口（C1a 抛错时机） |
| 352 | `setAllowMissingColumnNames` | C3 开关 |
| 486-488 | `setDuplicateHeaderMode` | C1/C2/C3 开关 |
| 627-630 | `public Builder setHeader(final String... header)` / `this.headers = CSVFormat.clone(header);` | 无参=自动探测、传名=手工表头 |
| 872-874 | `setSkipHeaderRecord` | A4/A4b 开关 |
| 1052 | `public static final CSVFormat DEFAULT = new CSVFormat(Builder.create());` | 预定义格式基线 |
| 1413 | `public static final CSVFormat RFC4180 = DEFAULT.builder().setIgnoreEmptyLines(false).get();` | 对照用 |
| 1480-1482 | `static boolean isBlank(...)` / `return value == null || value.trim().isEmpty();` | "空/空白列名"的判定 |
| 1653-1677 | `private CSVFormat(final Builder builder)`；1676 `validate();` | 字段拷贝链 + build 期校验入口 |
| 2207 | `public CSVParser parse(final Reader reader) throws IOException {` | 测试/用户创建解析器的主入口 |
| 2758 | `boolean useRow(final long rowNum)` | maxRows 逻辑（迭代器用） |
| 2771-2805 | `private void validate()`；2791 起为 header 段 | 候选①；2797 `containsHeader`、2799-2801 抛错 |

### `src/main/java/org/apache/commons/csv/CSVParser.java`

| 行号 | 内容 | 与本任务的关系 |
| --- | --- | --- |
| 240-294 | `final class CSVRecordIterator implements Iterator<CSVRecord>`（242 `recordCount`、253-254 取下一条） | **数据记录惰性读取**的出处 |
| 299-315 | `private static final class Headers`（304 `headerMap`、309 `headerNames`） | 表头数据的家 |
| 489 | `private final Headers headers;` | 解析器持有表头 |
| 524-532 | `private CSVParser(final Builder builder)`；**528 `this.headers = createHeaders();`** | 构造期建表头（候选③锚点） |
| 554/583 | `@Deprecated` 公开构造器 | 都委托到 524，无第三条路 |
| 594-602 | `addRecordValue` | 数据列收集（B2b） |
| 615-619 | `createEmptyHeaderMap()`（`ignoreHeaderCase` → `TreeMap`） | map 的两种实现 |
| **628-683** | **`createHeaders()`**：631 `formatHeader`、635 空数组分支、637/639 读首行、643-648 skip 分支、649 `headerRecord = formatHeader;`、655-678 映射循环、657 `isBlank`、658-659 空名抛错、661-664 重复判定、665-668 重复抛错、670 `observedMissing`、671-672 `put`、682 `return` | **三种表头来源的汇合点 + 现有表头校验所在地（候选②，推荐插入点）** |
| 732-739 | `getHeaderMap()`（防御性副本） | 测试断言用 |
| 746-748 | `getHeaderMapRaw()` | `CSVRecord` 内部取映射用 |
| 762-764 | `getHeaderNames()` | 列序只读列表 |
| 795 | `public List<CSVRecord> getRecords() {` | 测试主入口 |
| 903-906 | `iterator()` | 惰性入口之二 |
| 915 | `CSVRecord nextRecord() throws IOException {` | 真正读行的地方 |

### `src/main/java/org/apache/commons/csv/CSVRecord.java`

| 行号 | 内容 | 与本任务的关系 |
| --- | --- | --- |
| 103-105 | `get(int)` / `return values[i];` | 下标取值（A1） |
| 130-146 | `get(String)`：131 取映射、132-134 无映射抛 `IllegalStateException`、135-137 未知名抛 `IllegalArgumentException`（`Mapping for %s not found, expected one of %s`）、139-145 短记录抛 `Index for header...` | **需求痛点原文的出处**（B1/B2a） |
| 180-182 | `getHeaderMapRaw()` | 回指解析器 |
| 237-239 | `isConsistent()` / `return headerMap == null \|\| headerMap.size() == values.length;` | 长短记录判定（B2） |
| 249-252 | `isMapped(String)` | 存在性查询（R-B5，仅记录） |
| 313-315 | `size()` | 记录列数 |
| 371-373 | `values()` | 原始值数组 |

### `src/main/java/org/apache/commons/csv/DuplicateHeaderMode.java`

| 行号 | 内容 |
| --- | --- |
| 28-44 | `enum DuplicateHeaderMode { ALLOW_ALL, ALLOW_EMPTY, DISALLOW }`（since 1.10.0） |

### `src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java`

| 行号 | 内容 |
| --- | --- |
| 48 | `class HeadersCharacterizationTest {` |
| 51/55 | 辅助方法 `headerFromFirstRecord()` / `parseRecords(...)` |
| 63/139/196/256 | 4 个 `@Nested` 组：`HeaderSources` / `NameAccessBoundaries` / `DuplicateAndBlankHeaders` / `RequirementAdjacent` |
| 67/85/100/109/118/129 | A 组 6 个测试 |
| 143/153/165/175/185 | B 组 5 个测试 |
| 200/210/220/232/245 | C 组 5 个测试 |
| 260/271 | D 组 2 个测试 |

---

## 5. 真实踩坑记录（全部实际发生，无一虚构）

- **P1｜`-Dtest` 过滤 `@Nested` 的输出会骗眼睛**：`mvn test -Dtest=HeadersCharacterizationTest` 能跑到全部 18 个嵌套测试（输出逐个显示 `...$HeaderSources` 等），但**外层类那行显示 `Tests run: 0`**——乍看像"没跑到测试"。以 `Results:` 汇总行（`Tests run: 18`）为准。
- **P2｜`javac` 警告 `source value 8 is obsolete`**：存量现象（`pom.xml:102-103` 目标 1.8 + JDK 21），与新测试无关，基线跑的时候就有。
- **P3｜文档推荐组合不是最小组合**：`CSVFormat.java:2951-2963`（`withFirstRecordAsHeader` 的废弃说明）推荐 `setHeader().setSkipHeaderRecord(true)`；实测（A2b）`setHeader()` 单独就足以跳过表头行——自动探测分支在 `createHeaders()` 内部（637 行）消费首行，`skipHeaderRecord` 标志在该分支不起作用。照文档抄没问题，但要知道哪个标志真正在干活。
- **P4｜需求原文的报错文案是真实消息的前缀**：真实消息是 `Mapping for currency not found, expected one of [id, currency, amount]`（`CSVRecord.java:137`）。断言用 `contains("Mapping for currency not found")` 刚好稳；做全文匹配会在版本演进时误报。
- **P5｜重复表头校验有两个时机，我最初只想到一个**：动手前以为重复表头只在 parse 时检查；实际手工表头在 `builder.get()`（`CSVFormat.java:2791-2802`）就抛、文件表头在 `format.parse()`（`CSVParser.java:665-668`）才抛。C1a/C1b 两个测试把两个时机分别钉住——这正是"先观察、后固化"的价值。
- **P6｜RAT 在 `mvn test` 生命周期内就跑**：`apache-rat:0.18:check` 在 test 阶段执行，新文件的 ASF 许可证头必须一步到位。照抄 `CSVDuplicateHeaderTest.java` 第 1-18 行，一次通过（`No issues found.`）。
- **P7｜空文件 + `setHeader()` 的 `headerMap` 是空 Map 不是 null**：预判时容易把"没读到表头"等同于 `null`；实际 633 行先把 map 建出来了，682 行原样返回空 Map（B3b 实测）。将来 required 校验若只判 `null` 会在这里漏报。
- **P8｜全量测试很快（~7 秒）**：本机 985→1003 个测试都在 10 秒内，"每加一个测试就跑一遍全量"在这个库上完全没有成本顾虑。
