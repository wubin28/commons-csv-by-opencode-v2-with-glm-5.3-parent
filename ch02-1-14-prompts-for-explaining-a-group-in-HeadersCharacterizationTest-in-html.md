# ch02-1-14 提示词：用 HTML 交互图表解释分组特征测试（B / C / D 组通用）

> - **来源**：从 ch02-1-13 会话（A 组 6 测试 HTML 图解的完整决策链 Round 0–2 + 执行与自检实录）提炼，供 B / C / D 三组复用。
> - **用法**：① 从 §1 取值参考表中选定一组值；② 替换 §2 提示词正文中的全部 `{{占位符}}`；③ 全文搜索 `{{` 确认无残留；④ 整段"§2 提示词正文"复制给新会话的 agent。B、C、D 三组各用一次。
> - **重要**：§1 中的测试文件行号是预填参考值（来自 ch02-1-2/1-3），**agent 执行时必须用 `grep -n` 重新锚定**——A 组实测发生过"通读显示行号整体偏 1"的事故。

---

## 1. 占位符取值参考表（预填值，替换时按组选用）

### 1.1 通用占位符

| 占位符 | B 组 | C 组 | D 组 |
| --- | --- | --- | --- |
| `{{GROUP_ID}}` | B | C | D |
| `{{N}}` | 5 | 5 | 2 |
| `{{GROUP_THEME}}` | 按列名取值的边界 | 重复列名 / 空列名的容错（`DuplicateHeaderMode`、`allowMissingColumnNames`） | 与 `setRequiredHeaders` 需求直接相邻的现状对照 |
| `{{NESTED_CLASS}}` | `NameAccessBoundaries` | `DuplicateAndBlankHeaders` | `RequirementAdjacent` |
| `{{GROUP_DIR}}` | `explaining-scenarios-in-html/group-b` | `explaining-scenarios-in-html/group-c` | `explaining-scenarios-in-html/group-d` |
| `{{OVERVIEW_THEME}}` | 「按名取值的四条边界」总图：无映射（回引 A1）→ 名字不存在（B1，:137）→ 映射到了但记录太短（B2a，:139-145）→ 空输入（B3a/B3b）；汇合点 `CSVRecord.get(String)`（:130-146）的三段抛错路径 + `isConsistent`（:237-239） | 「表头校验的两个时机」总图：手工表头在 `builder.get()`（`CSVFormat.validate` :2790-2804，C1a）vs 文件表头在 `format.parse()`（`createHeaders` :655-678，C1b/C3b）；`ALLOW_ALL / ALLOW_EMPTY / DISALLOW` × 场景的放行矩阵；C2 证明默认放行且后列覆盖前列；★C1b 是 ch02-1-3 标注"本热身最关键的一个测试"（`parse()` 调用本身抛错、数据行从未被读） | 「将来 required 匹配的两个语义决策点」：trim 与否（D1：现状精确匹配，`" currency "` 是独立 key）+ 匹配对象是"最终生效表头"而非文件文本（D2：手工表头绑定位置） |
| `{{SOURCE_FOCUS}}` | `CSVRecord.java:130-146`（get(String) 三段路径）、`:103-105`、`:237-239`（isConsistent）；`CSVParser.java:628-683`（B3 的 :637 空输入路径、:633 建 map、:682 返回空 Map） | `CSVFormat.java:327-328`（get()）、`:1676`（构造尾 validate()）、`:2790-2804`（validate 的 header 段）；`CSVParser.java:524-528`、`:655-678`（:657 isBlank、:661 containsHeader、:665-668 抛错、:670 observedMissing、:672 put 覆盖） | `CSVParser.java:655-678`（:672 put 原样保留空格）、`:643-649`（D2 的 skip 分支）；`CSVRecord.java:135-137`（get 精确匹配）；`CSVFormat.java:1480-1482`（isBlank） |
| `{{GROUP_NOTES}}` | ① B3b 的文件视图是 **0 字节空文件**（第 0 步照常展示"空"）；② B1 异常卡片必须加对照注：同一个 `get(String)`，A1（无 headerMap）在 :132-133 抛 `IllegalStateException`，B1（有 map、名字不存在）在 :137 抛 `IllegalArgumentException`；③ B2a 监视盒并列 `headerMap.size()=3` vs `values.length=2`；④ B2a/B2b 是"同一手工表头、不同数据长度"的对照 → diff 卡作用于**文件内容行**（两页的 csv 字符串），不是 format 配置 | ① **C1a 的异常发生在 given**（`builder.get()` 一行内炸）：步骤骨架如实——format 构建步即"炸"的步骤（代码行红色高亮+异常卡片），when/then 是 `assertThrows` 断言本身；A 组先例是异常在 when（A1），本组在 given，骨架必须跟着真实代码走；② C1b 重点可视化"**数据行从未被读**"（文件第 2 行永不高亮、records 恒空、`parse()` 调用本身抛）；③ C2 的 headerMap 展示 `id→0` 被 `id→2` 覆盖的过程（两次 put 的先后）；④ C3a 的空名 chip 原样展示（`{currency=0, =1, amount=2}`）；⑤ C3b 讲清空名重复的判定用的是 `observedMissing` 标志位（:670），不是 map 查询 | ① D1 文件字节视图必须**让空格可见**（如 `id,␠currency␠,amount` 用可视化符号或底色框选），映射 chip 保留两端空格；② D1 把 `get(" currency ")` 的命中与 `get("currency")` 的异常**并列展示**（一个 when 两步对照）；③ D2 监视盒并列 `headerRecord`（来自配置 `["colX","currency","amount"]`）与被丢弃的文件首行文本（`id,currency,amount`），映射键全部来自配置 |

### 1.2 `{{TEST_TABLE}}`（测试清单；行号为预填参考，agent 必须 grep -n 复核）

**B 组（5 个，`NameAccessBoundaries`）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| B1 | `getByNameWithUnknownNameThrowsMappingNotFound` | :143 | — | 需求痛点本尊：`get("nope")` 抛 `IllegalArgumentException`，消息含 `Mapping for nope not found` 与 `expected one of` |
| B2a | `headerLongerThanRecordThrowsIndexMessage` | :153 | B2 的表头多方向 | 表头 3 列 vs 数据 2 值：`get("amount")` 抛 `Index for header 'amount' is 2 but CSVRecord only has 2 values!`，`isConsistent()`=false |
| B2b | `recordLongerThanHeaderIsInconsistentButReadable` | :165 | B2 的数据多方向（对照变体） | 数据 4 值 vs 表头 3 列：`get("amount")` 仍可取，`isConsistent()`=false |
| B3a | `headerOnlyFileYieldsNoRecordsButHeaderMap` | :175 | B3 的仅表头行方向 | records 为空，headerMap 3 项齐全、`getHeaderNames()` 保序 |
| B3b | `emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap` | :185 | B3 的空文件方向（对照变体） | headerMap 是**空 Map 不是 null**（ch02-1-3 踩坑 P7） |

**C 组（5 个，`DuplicateAndBlankHeaders`）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| C1a | `duplicateManualHeaderWithDisallowThrowsAtFormatBuild` | :200 | — | 手工表头重复 + DISALLOW：`builder.get()` 时抛（**build 期**），消息含 `duplicate name` 与 `id` |
| C1b | `duplicateFileHeaderWithDisallowThrowsAtParserCreation` | :210 | — | ★文件表头重复 + DISALLOW：`format.parse()` 调用本身抛（**parse 期**），数据行从未被读 |
| C2 | `duplicateNameAllowedByDefaultResolvesToLastIndex` | :220 | — | 默认 `ALLOW_ALL` 不报错；`headerMap.get("id")`=2（后列覆盖前列），`get("id")`="2" |
| C3a | `blankHeaderNameIsMappedWhenMissingColumnNamesAllowed` | :232 | — | 表头 `currency,,amount` + allowMissingColumnNames：`""` 也是 key（→1），`get("")`="100" |
| C3b | `duplicateBlankHeadersWithDisallowThrowsAtParserCreation` | :245 | C3 的 DISALLOW 对照（对照变体） | 两个空列名也算重复：parse 时抛，消息含 `duplicate` |

**D 组（2 个，`RequirementAdjacent`）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| D1 | `headerNameWithSurroundingSpacesNeedsExactMatch` | :260 | — | 表头 `" currency "`（带前后空格）：`get(" currency ")` 命中 "USD"；`get("currency")` 抛 `Mapping for currency not found`——精确匹配不 trim |
| D2 | `manualHeaderBindsPositionsNotFileHeaderText` | :271 | — | `setHeader("colX",…)` + 文件首行写 `id,currency,amount`：映射只认配置（colX→0），文件首行文本不参与映射 |

### 1.3 `{{FILE_NAMES}}`（输出文件名，场景号小写 + `-` + 方法名驼峰原样）

- **B 组**：`b1-getByNameWithUnknownNameThrowsMappingNotFound.html`、`b2a-headerLongerThanRecordThrowsIndexMessage.html`、`b2b-recordLongerThanHeaderIsInconsistentButReadable.html`、`b3a-headerOnlyFileYieldsNoRecordsButHeaderMap.html`、`b3b-emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap.html`
- **C 组**：`c1a-duplicateManualHeaderWithDisallowThrowsAtFormatBuild.html`、`c1b-duplicateFileHeaderWithDisallowThrowsAtParserCreation.html`、`c2-duplicateNameAllowedByDefaultResolvesToLastIndex.html`、`c3a-blankHeaderNameIsMappedWhenMissingColumnNamesAllowed.html`、`c3b-duplicateBlankHeadersWithDisallowThrowsAtParserCreation.html`
- **D 组**：`d1-headerNameWithSurroundingSpacesNeedsExactMatch.html`、`d2-manualHeaderBindsPositionsNotFileHeaderText.html`

---

## 2. 提示词正文（替换占位符后，整体复制给 agent）

---

### 任务：为 {{GROUP_ID}} 组特征测试生成交互式 HTML 解释图表（{{GROUP_THEME}}）

当前目录为 `/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/`。请为 `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` 中嵌套类 `{{NESTED_CLASS}}`（即"{{GROUP_ID}} 组"）的 {{N}} 个测试，逐个生成交互式 HTML 解释图表，外加 1 个组级 `index.html`，全部保存到 `{{GROUP_DIR}}/`（目录不存在则创建）。已有 A 组产物在 `explaining-scenarios-in-html/group-a/`，是本任务的**参考实现与模板基准**。

#### 0）必读文件（按顺序读完再动手）

1. `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` —— `{{NESTED_CLASS}}` 嵌套类即 {{GROUP_ID}} 组；测试代码逐字入图的唯一来源；
2. `ch02-1-2-scenarios-for-warming-up.md` —— 场景清单（第一部分 {{GROUP_ID}} 组各行 + 第三部分"场景↔测试方法对应表"）与断言口径（异常类型精确断言、消息断关键片段）；
3. `ch02-1-3-debug-guide.md` —— §2 各测试单步调试要点（断点行号、观察变量、行为结论）+ §4 行号对照表。**图表中一切行为结论、异常类型/消息、源码行号的唯一事实来源**；
4. `explaining-scenarios-in-html/group-a/` —— 参考实现：`a1-noHeaderGetValueByIndexAndGetByNameThrows.html`（**模板基准：CSS 与 JS 引擎逐字照抄，只换内容**）、`a2b-*.html` / `a4b-*.html`（变体 diff 卡与"事故现场"红色 records chip 先例）、`index.html`（组级 index 模板）。

#### 1）硬约束（违反任何一条即返工）

1. **事实唯一来源**：所有行为结论、异常类型与消息、源码行号，只能来自测试文件本身、ch02-1-2/1-3 的实测记载、生产源码逐字摘录三处；不得发明未实测行为、不得臆测消息全文。
2. **测试代码逐字入图**：从仓库文件原样复制（含缩进——`@Nested` 内方法的 javadoc/签名是 **8 空格**缩进、方法体 **12 空格**）；一行不改、不重排、不美化。
3. **行号必须 `grep -n` 重新锚定**：A 组实测发生过"通读工具显示行号整体偏 1"的事故（a4b 页）。测试行号、生产源码摘录行号，一律以 `grep -n` / 直接读文件核实为准。
4. **只新增文件**：不改测试文件；不动 `explaining-scenarios-in-html/group-a/` 任何文件；不动任何 `ch02-*.md` 与生产代码。
5. **每个 HTML 自包含**：内联 CSS/JS、无外部依赖、无构建步骤，浏览器双击可开；整体浅色主题。
6. **测试的"不规则处"如实入图**（多次 parse、断言穿插、try-with-resources 内嵌复查块等）。given/when/then 是对真实语句的**归类标注，不是改写许可**。若异常发生在 given（如 `builder.get()` 或 `format.parse()` 时就抛），"炸"的那一步就放 given，`assertThrows` 的 then 步负责展示异常卡片——骨架跟着真实代码走，不套模板。

#### 2）每个测试页的内容规格（与 A 组同构）

**步骤骨架（每测试 9–13 步，六页尽量同构）**

- 第 0 步【文件】虚构等价文件 `{{场景号小写}}.csv`（如 `b1.csv`、`c1b.csv`、`d1.csv`）：右侧"文件字节视图"面板展示字节级内容，`\r\n` 用紫色 token 显式着色，附文件元信息（几行几列、什么形态）；解说点明"测试并没有读这个文件，而是把完全相同的字节内联进了字符串常量（见 :行号）"。
- 第 1 步【桥】等价桥源码卡片（每页相同结构）：`CSVFormat.java:2207-2209 parse(Reader)`（测试走的入口）↔ `CSVParser.java:407-410 parse(Path,Charset,CSVFormat)`（真实读文件的入口），两条路汇合到同一私有构造器 `:524` → `:528 this.headers = createHeaders();`；卡脚注点明"内联字符串与读文件的字符流完全相同"。
- given 段 2–4 步：format/builder 配置逐项含义（解析器状态面板的 format 表 + 监视盒）→ parse → 构造器 → `createHeaders()` 关键分支（源码剧场卡片）。**若本组异常发生在 build/parse 期（C1a/C1b/C3b），"炸"放在这里**。
- when 段 1–2 步：被测调用（如 `get("…")`、`isConsistent()`）。
- then 段 2–4 步：断言逐条进入断言表；异常路径用异常卡片。
- 末步【总结】：本测试钉住的事实清单（状态面板 note 复述）+ 与相关测试互引（A 组回响、组内对照变体；ch02-1-2/1-3 若记载了"对 `setRequiredHeaders` 的含义"，必须带上）。

**组件规格（照抄 A 组实现）**

- **源码剧场卡片**：每页 3–5 张，随步骤开合。内容为真实源码摘录（±3 行上下文）、行号列、当前行高亮（黄底 `#fff8c5` + 橙色左条 `#9a6700`）、行号前红点 `●` = ch02-1-3 建议断点、卡脚注"断点对照：ch02-1-3 §{{场景号}}"。本场景走不到的分支用**灰色行**（class `no`，见 a2b 页 :643 先例）。
- **文件字节视图**：当前被消费的行紫色高亮（`#f0eaff` 底 + `#8250df` 左条）；已消费行淡化 + "✓已消费"后缀。
- **解析器状态面板**：format 配置表（kv 表）｜`parser.headerRecord`｜`parser.headerMap`（chips：`名 → 下标`，LinkedHashMap 保序；空 Map 显示"空 Map（非 null）"；null 显示红色"null（无表头世界）"）｜`records`（绿色 chip 逐条出现；内容异常的记录用红色 chip，见 a4b 页 `rec bad` 先例）。
- **变量监视盒**：IDE watch 风格 `name = value` 行，随步更新。
- **断言表**（then 步）：`断言摘要 | 期望 | 实际 | ✓`；实际值取自 ch02-1-2/1-3 实测记载；表头注明"特征测试：期望 = 现状实测值"。
- **异常卡片**：精确类型（含包名可省、类名全拼）+ 消息原文（等宽引用块，逐字）+ 抛出位置（`文件.java:行号` + 红点）+ 迷你调用栈（测试方法 → 中间调用 → throw 行）+ 对照注（与相邻场景的异常对照，如 A1 的 `IllegalStateException` vs B1 的 `IllegalArgumentException`）。
- **diff 对比卡**（变体页）：页顶"XX 的对照变体"徽标；在差异起作用的步骤浮出 `− 红删 / + 绿加` 两行。注意 diff 的对象**可以是 format 配置，也可以是文件内容**（B2a/B2b 是同一表头不同数据长度的对照 → diff 文件内容行）。
- **每步解说**：中文 1 段（2–4 句），放在底部解说条。

**本组特有注意点**：{{GROUP_NOTES}}

#### 3）交互与视觉规格（CSS 与 JS 引擎从 `explaining-scenarios-in-html/group-a/a1-noHeaderGetValueByIndexAndGetByNameThrows.html` 逐字照抄，只换 STEPS 数据与静态内容）

- **步进器**：底部「◀ 上一步 / 下一步 ▶」按钮；键盘 `←`/`→`/空格；顶部每步一个圆点（颜色=阶段，点击跳转）；点击测试代码任一行跳到覆盖它的步骤；「自动播放」开关（默认关、约 6s/步、末步自停）；URL 支持 `?step=N` 直达并用 `history.replaceState` 同步。
- **布局**：顶栏（场景号徽标 + 方法名 + 步骤圆点 + 步号 n/N + 页间导航「← 上一测试 ｜ ⌂ index ｜ 下一测试 →」）｜左区约 55%：测试代码区（**全部行从第 0 步起可见、当前步覆盖行高亮、行号列；下方源码剧场随步开合**，max-height 46% 内部滚动）｜右区约 45%：文件字节视图 / 解析器状态 / 监视盒 / 断言·异常·差异 四面板｜底部解说条 + 控制。
- **色板（浅色）**：白底 `#ffffff`、面板 `#f6f8fa`、边框 `#d0d7de`、正文 `#1f2328`；阶段色 given 蓝 `#0969da` / when 橙 `#9a6700` / then 绿 `#1a7f37` / 文件·桥紫 `#8250df`；断点·异常红 `#cf222e`；当前行高亮 `#fff8c5`；diff 红 `#ffebe9`/绿 `#dafbe1`。
- **代码语法色（VS Code Light+）**：关键字 `#0000ff`、字符串 `#a31515`、注释 `#008000`、数字 `#098658`、类型 `#267f99`。
- **页脚**：`ch02-1-14 · {{场景号}} · ch02-after (24562da2) · 场景：ch02-1-2 §第一部分 {{场景号}} · 断点：ch02-1-3 §2 {{场景号}} · 键盘 ←/→/空格 步进`。
- 桌面优先（1280–1440px 宽）。

#### 4）文件与目录

- 输出到 `{{GROUP_DIR}}/`：{{FILE_NAMES}}，外加 `index.html`。
- **index.html（照抄 A 组 index 模板结构）**：① 组级总览图（主题：{{OVERVIEW_THEME}}；用 HTML/CSS 盒子 + 箭头，标注本组每个测试落在哪条链上，并互引 A 组 index）＋"一句话版本"要点；② 阅读指南（步进操作 / 画面分区 / 颜色图例 / "为什么每页都从虚构文件开始"四卡）；③ {{N}} 张测试卡片（场景号徽标 + 方法名 + 一句话 + 步数/文件形态/断言数元信息，变体加"⟵ XX 变体"标注）；④ N×K 速查表（每测试一行：format 配置 / 文件形态 / 关键行为 / records 或 headerMap 结果等，列头按本组主题定）。

#### 5）事实取证流程（写 STEPS 数据前完成）

1. `grep -n` 锚定 {{TEST_TABLE}} 中全部方法名 → 记录真实行号（勿信预填值）；
2. 按索引 {{SOURCE_FOCUS}} 打开生产源码文件，逐字摘录本组需要的片段并核对行号；
3. 从测试源文件**原样复制**代码行（连缩进一起），嵌入代码区 HTML（语法 span 包裹时不得改动任何字符，含 `\r\n` 字面量与全角标点）；
4. 异常消息原文从 ch02-1-3 或生产源码逐字抄录；断言的"实际值"从 ch02-1-2/1-3 实测记载取。

**{{TEST_TABLE}}**

#### 6）自检（必做；全部 PASS 才算完成；本机已有 `/Applications/Google Chrome.app`）

a. **结构验证**：对每页每步执行 headless Chrome `--dump-dom`（会真实执行 JS），逐项校验：恰好 1 个 `class="dot cur"`；`stepNo` 文本为 `i+1 / N`；`id="narrText"` 非空；整个 DOM 无 `undefined`/`NaN`。
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
     --virtual-time-budget=2500 --dump-dom "file://<绝对路径>/<页面>.html?step=<i>"
   ```
b. **内容抽检**：异常卡片与其消息原文、等价桥卡片、源码剧场卡片、diff 卡（变体页）、断言表关键值，在对应步骤的 DOM 中逐字出现。
c. **逐字校验（python）**：提取每页 `<pre id="code">`，剥离全部标签 + `html.unescape` 后按行拆分；与仓库测试文件对应行（含辅助方法 `parseRecords`（:55-59）及本组页面展示的其他 helper 行）做**多重集合比对**，任何一行（含前导空格数）不一致即 FAIL。
d. **index 链接**：每个测试在 index 中至少 3 处链接（总览图 / 卡片 / 速查表）。
e. **截图**：每页全部步骤 `--screenshot` 到系统临时目录（不进仓库），作为留档。
f. **已知坑（A 组实测发生过，防再犯）**：
   - ① `renderState` 中 `st.hm` 为字符串时不得调用 `.map`——必须 `Array.isArray(st.hm)` 判断（A 组曾因此 3 个步骤渲染中断）；
   - ② `@Nested` 方法缩进是 8/12 空格，不是 4/8；
   - ③ 通读类工具显示的行号可能整体偏移，一律 `grep -n` 复核；
   - ④ `assertEquals(Integer.valueOf(1), …)` 这类断言的期望值保持 `Integer 1` 写法，与代码严格对齐。
g. 任何修复后，**必须重跑全部自检**（不允许只重跑失败项）。

#### 7）交付

- 产出 {{N}} + 1 个文件；
- 在对话中给出交付报告：产出清单表（文件 / 步数 / 内容要点）+ 自检结论（a–d 各项 PASS 与截图张数）+ 修复记录（若自检发现并修复了问题，逐条列出，格式参照"现象 → 根因 → 修复"）。

---

*（提示词正文到此结束。）*

---

## 3. 三次使用的检查清单（发给 agent 前）

- [ ] 已选定组（B / C / D），§1 对应列的值全部替换进 §2；
- [ ] `{{TEST_TABLE}}` 已整表替换（含变体关系列）；
- [ ] `{{FILE_NAMES}}` 已替换；
- [ ] `{{GROUP_NOTES}}` / `{{OVERVIEW_THEME}}` / `{{SOURCE_FOCUS}}` 已替换；
- [ ] 全文搜索 `{{` 无残留；
- [ ] 新会话中 agent 的第一步应是"必读 + grep -n 锚定"，若它跳过取证直接写 HTML，应纠正。
