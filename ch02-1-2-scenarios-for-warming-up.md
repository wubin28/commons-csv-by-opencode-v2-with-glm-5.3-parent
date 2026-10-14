# ch02-1-2 用来验证子域边界的端到端测试场景（热身）

- **代码库版本锚**：`./commons-csv`，HEAD `c6ac1bde`，`1.15.0-SNAPSHOT`（本文件所有行号、默认值、行为结论均来自这份代码的实测）。
- **用途**：为后续 `CSVFormat.Builder.setRequiredHeaders(String...)` 需求做理解热身。场景只覆盖"**表头 / 列名 / 取值**"这条主线（已确认的范围决策），非主线（分隔符、引号、转义、多行记录等）一概不收。
- **为什么这些场景与"子域边界"有关**：表头这件事天然横跨三段职责——格式配置（`CSVFormat`/`CSVFormat.Builder`）、解析（`CSVParser.createHeaders()`）、取值（`CSVRecord.get(String)`）。每一组场景都在探测这三段之间的接缝：**配置在哪段生效、错误在哪段抛出、数据在哪段被消费**。这正是后续判定行为边界时最需要的事实。

---

## 第一部分：场景清单

### A 组：表头从哪来（format 配置 vs 文件内容）

| 编号 | 场景 | 输入/操作要点 | 关键 API | 验证什么现状 |
| --- | --- | --- | --- | --- |
| A1 | 无表头 CSV，按下标取值 | `CSVFormat.DEFAULT` 解析两行两列 | `CSVRecord.get(int)`、`CSVParser.getHeaderMap()` | 无 headerMap 时按名取值抛什么 |
| A2 | 自动探测首行为表头 | `builder().setHeader()`（无参），带/不带 `setSkipHeaderRecord(true)` 两个变体 | `Builder.setHeader()` | 表头行是否被消费、映射如何建立 |
| A3 | 手工指定表头（源无表头行） | `setHeader("id","currency","amount")` | `Builder.setHeader(String...)` | 配置数组直接成为 headerRecord |
| A4 | 手工表头 + 源首行也是表头 | A3 基础上 `setSkipHeaderRecord(true)`；另测"忘设 skip"变体 | `Builder.setSkipHeaderRecord(boolean)` | 首行被跳过 / 被当作数据 |
| R-A5 | 表头来自枚举 | `setHeader(HeaderEnum.class)`（源码 `CSVFormat.java:539`） | `Builder.setHeader(Class)` | **仅记录不测**：与按名取值主线相关但属于另一条来源链 |
| R-A6 | 表头来自 `ResultSet` | `setHeader(resultSet)`（源码 `CSVFormat.java:569/593`） | JDBC 元数据链路 | **仅记录不测**：需要 JDBC 环境，收益低 |

### B 组：按列名取值的边界

| 编号 | 场景 | 输入/操作要点 | 关键 API | 验证什么现状 |
| --- | --- | --- | --- | --- |
| B1 | 取不存在的列名 | 表头齐全，`get("nope")` | `CSVRecord.get(String)` | 异常类型与消息文案（需求痛点原文的对照） |
| B2 | 表头列数 ≠ 数据列数 | 表头多（`1,USD` 对 3 列表头）/ 数据多（4 值对 3 列表头）两个方向 | `get(String)`、`isConsistent()` | 短记录按名取值的报错、长记录的可用性 |
| B3 | 空输入 | 仅表头行 / 完全空文件，均用 `setHeader()` 自动探测 | `getRecords()`、`getHeaderMap()` | records 为空时 headerMap 的形态（空 Map 还是 null） |
| R-B4 | 按 `Enum` 取值 | `get(SomeEnum.NAME)`（源码 `CSVRecord.java:91`） | `CSVRecord.get(Enum)` | **仅记录不测**：`get(String)` 的包装层 |
| R-B5 | 映射查询家族 | `isMapped`/`isSet`/`putIn`/`toMap`（源码 `CSVRecord.java:249/272/295/350`） | 查询类 API | **仅记录不测**：B 组已覆盖映射存在性的判定路径 |
| R-B6 | 中文/Unicode 列名 | 表头含中文 | — | **仅记录不测**：行为由 Reader 编码决定，不是 parser 逻辑 |
| R-B7 | BOM 影响首列名 | UTF-8 BOM 文件 + 首列为表头 | — | **仅记录不测**：`ExtendedBufferedReader` 层的问题 |
| R-B8 | `ignoreHeaderCase` 大小写不敏感映射 | `setIgnoreHeaderCase(true)`（`CSVParser.java:615-618` 的 TreeMap 分支） | — | **仅记录不测**：与将来 required-headers 的匹配语义相关，建议后续 TDD 章节一并处理 |

### C 组：重复列名 / 空列名的容错

| 编号 | 场景 | 输入/操作要点 | 关键 API | 验证什么现状 |
| --- | --- | --- | --- | --- |
| C1 | 重复列名 × 三种 `DuplicateHeaderMode` | 手工表头重复（build 时）/ 文件表头重复（parse 时）两条链路 | `Builder.setDuplicateHeaderMode` | **哪个时机**抛错（这是需求"早报错"的现成先例） |
| C2 | 重复列名被允许时按名取值 | 默认模式（`ALLOW_ALL`），表头 `id,currency,id` | `get("id")`、`getHeaderMap()` | 同名列命中第一个还是最后一个 |
| C3 | 空/空白列名的映射 | `currency,,amount` + `setAllowMissingColumnNames(true)`；双空名 + `DISALLOW` | `get("")`、`getHeaderMap()` | 空名列是否成为 key、重复空名何时算重复 |
| R-C4 | `allowMissingColumnNames=false`（默认）+ 空列名 | 表头含空项，不设 allow | — | **仅记录不测**：源码 `CSVParser.java:657-659` 在 parse 时抛 `A header name is missing in [...]`；C3 的对照组，行为直接读源码可证 |
| R-C5 | `ALLOW_EMPTY` 模式下实名重复 | `ALLOW_EMPTY` + 手工表头含重复实名 | — | **仅记录不测**：源码 `CSVFormat.java:2797-2802` 在 build 时抛错；C1a 的变体 |

### D 组：与需求直接相邻的匹配语义

| 编号 | 场景 | 输入/操作要点 | 关键 API | 验证什么现状 |
| --- | --- | --- | --- | --- |
| D1 | 表头名带前后空白 | 表头 ` currency `，取 `get("currency")` 与 `get(" currency ")` | `CSVRecord.get(String)` | key 是否原样保留（决定将来 required 匹配要不要 trim） |
| D2 | 手工表头顺序与数据列错位 | `setHeader("colX","currency","amount")` + 文件首行写 `id,currency,amount` | `getHeaderMap()` | 手工表头绑定"位置"，文件首行文本不参与映射 |

> 注：`CSVFormat.DEFAULT` 系列的 `duplicateHeaderMode` 默认值是 `ALLOW_ALL`（`CSVFormat.java:214-223`，特别是 221 行）——即**默认不检查重复表头**，这是实测 `C2` 通过的直接原因，也是 C 组必须显式设 `DISALLOW` 的原因。

---

## 第二部分：挑出的代表性场景与理由

在 Round 1 已确认的取舍（Q1）：**A1–A4、B1–B3、C1–C3、D1–D2 共 12 个场景写测试**，R 系列只记录。理由分述：

- **A 组（4 个）——表头从哪来**。`setRequiredHeaders` 的校验必须发生在"表头已经确定"之后，而 A 组证明表头有三种来源（无、文件自动探测、手工配置），且它们最终都汇合到 `CSVParser.createHeaders()`（`CSVParser.java:628-683`：635 行自动探测分支、643-649 行手工+skip 分支）。不知道这个汇合点，新校验就可能在某条来源链上漏掉。
- **B 组（3 个）——需求要替换的"晚失败"现状**。需求原文的痛点是"`record.get("currency")` 时才报错"。B1 钉住了那个报错的真实类型与文案（`CSVRecord.java:137`，`IllegalArgumentException`，`Mapping for %s not found, expected one of %s`）；B2a 钉住了另一种隐性缺列（表头比数据多）在取值时才炸；B3 钉住了空输入的边界形态。新功能落地后，这些行为**不应改变**（它们是安全网）。
- **C 组（3 个）——表头合法性的现有校验在哪里、什么时机抛**。这是本热身最重要的发现：表头校验已存在**两个时机**——手工表头在 `builder.get()`（`CSVFormat.java:2791-2802`，经构造函数 1676 行 `validate()`），文件表头在 `format.parse()`（`CSVParser.java:665-668`）。后者发生在 `CSVParser` 构造函数内（528 行 `this.headers = createHeaders();`），**天然早于任何数据记录被读取**——`setRequiredHeaders` 想要的"读第一条记录之前报错"已有现成先例可循。
- **D 组（2 个）——将来 required 匹配的语义边界**。D1 证明默认不 trim 表头名（`" currency "` 是独立 key）；D2 证明手工表头只认位置不认文件文本。二者共同决定：将来 `requiredHeaders` 与实际表头做"相等"还是"trim 后相等"匹配，是必须显式决策的行为点。

## 第三部分：场景↔测试方法对应表

测试文件：`commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java`
实际结果：**18/18 全部通过**（`mvn test -Dtest=HeadersCharacterizationTest`，2026-10-14）；全量 `mvn test` = `1003 / 0 / 11`（基线 `985 / 0 / 11` + 新增 18，无任何已有测试被破坏）。

| 场景 | 测试方法（嵌套类#方法，行号为测试文件内行号） | 结果 |
| --- | --- | --- |
| A1 | `HeaderSources#noHeaderGetValueByIndexAndGetByNameThrows`（:67） | 通过 |
| A2（带 skip，文档推荐组合） | `HeaderSources#autoDetectedHeaderMapsNamesAndSkipsHeaderRecord`（:85） | 通过 |
| A2（不带 skip） | `HeaderSources#autoDetectedHeaderWithoutSkipFlagStillSkipsHeaderLine`（:100） | 通过 |
| A3 | `HeaderSources#manualHeaderOnHeaderlessSource`（:109） | 通过 |
| A4（带 skip） | `HeaderSources#manualHeaderWithSkipHeaderRecordSkipsFileHeaderLine`（:118） | 通过 |
| A4（忘设 skip，对照） | `HeaderSources#manualHeaderWithoutSkipReadsFileHeaderLineAsData`（:129） | 通过 |
| B1 | `NameAccessBoundaries#getByNameWithUnknownNameThrowsMappingNotFound`（:143） | 通过 |
| B2（表头多） | `NameAccessBoundaries#headerLongerThanRecordThrowsIndexMessage`（:153） | 通过 |
| B2（数据多） | `NameAccessBoundaries#recordLongerThanHeaderIsInconsistentButReadable`（:165） | 通过 |
| B3（仅表头行） | `NameAccessBoundaries#headerOnlyFileYieldsNoRecordsButHeaderMap`（:175） | 通过 |
| B3（空文件） | `NameAccessBoundaries#emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap`（:185） | 通过 |
| C1（手工表头，build 时抛） | `DuplicateAndBlankHeaders#duplicateManualHeaderWithDisallowThrowsAtFormatBuild`（:200） | 通过 |
| C1（文件表头，parse 时抛） | `DuplicateAndBlankHeaders#duplicateFileHeaderWithDisallowThrowsAtParserCreation`（:210） | 通过 |
| C2 | `DuplicateAndBlankHeaders#duplicateNameAllowedByDefaultResolvesToLastIndex`（:220） | 通过 |
| C3（空名映射） | `DuplicateAndBlankHeaders#blankHeaderNameIsMappedWhenMissingColumnNamesAllowed`（:232） | 通过 |
| C3（重复空名 + DISALLOW） | `DuplicateAndBlankHeaders#duplicateBlankHeadersWithDisallowThrowsAtParserCreation`（:245） | 通过 |
| D1 | `RequirementAdjacent#headerNameWithSurroundingSpacesNeedsExactMatch`（:260） | 通过 |
| D2 | `RequirementAdjacent#manualHeaderBindsPositionsNotFileHeaderText`（:271） | 通过 |
| R-A5 ~ R-C5 | —（仅记录，见第一部分各 R 条目；行为证据标注了源码行号，未实测） | 不测 |

> 断言口径（已确认的 Q5）：异常**类型精确断言**，消息只断言关键片段（如 `Mapping for nope not found`），不做全文匹配——消息全文随版本演进易碎，而关键片段是需求关心的行为契约。
