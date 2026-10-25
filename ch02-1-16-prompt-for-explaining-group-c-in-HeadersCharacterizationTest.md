# ch02-1-16 提示词：为 C 组特征测试生成 HTML 交互解释图表（已填好，整体复制给 agent 即可）

> 由 ch02-1-14 模板 + C 组取值生成，无占位符残留。行号已经 `grep -n` 复核（2026-10-25）。配套参考实现（只读）：`explaining-scenarios-in-html/group-a/`。

---

### 任务：为 C 组特征测试生成交互式 HTML 解释图表（重复列名 / 空列名的容错）

当前目录为 `/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/`。请为 `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` 中嵌套类 `DuplicateAndBlankHeaders`（即"C 组"）的 **5 个测试**，逐个生成交互式 HTML 解释图表，外加 1 个组级 `index.html`，全部保存到 `explaining-scenarios-in-html/group-c/`（目录不存在则创建）。已有 A 组产物在 `explaining-scenarios-in-html/group-a/`，是本任务的**参考实现与模板基准**。

#### 0）必读文件（按顺序读完再动手）

1. `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` —— `DuplicateAndBlankHeaders` 嵌套类即 C 组（:196-252）；测试代码逐字入图的唯一来源；
2. `ch02-1-2-scenarios-for-warming-up.md` —— 场景清单（第一部分 C 组各行 + 第三部分对应表）；特别注意末尾注：**`CSVFormat.DEFAULT` 系列的 `duplicateHeaderMode` 默认值是 `ALLOW_ALL`（`CSVFormat.java:214-223`，特别是 221 行）——默认不检查重复表头**，这是 C2 通过、C 组必须显式设 `DISALLOW` 的原因；
3. `ch02-1-3-debug-guide.md` —— §2 C 组 `DuplicateAndBlankHeaders` 逐测试断点/行号/行为结论（图表事实的唯一来源），特别是 C1a 的 build 期链路（`CSVFormat.java:328→:1676→:2791→:2797→:2799`）、C1b 的 parse 期链路（`CSVParser.java:528→:661→:665-668`）、C2 的覆盖（`:672`）、C3b 的 `observedMissing`（`:670`）；§3 的插入点分析也以 C1b 为核心论据；
4. `explaining-scenarios-in-html/group-a/` —— 参考实现：`a1-noHeaderGetValueByIndexAndGetByNameThrows.html`（**模板基准：CSS 与 JS 引擎逐字照抄，只换内容**；其异常卡片/红色代码行组件本组大量使用）、`a2b-*.html` / `a4b-*.html`（变体 diff 卡与灰色"走不到的分支"行先例）、`index.html`（组级 index 模板）。

#### 1）硬约束（违反任何一条即返工）

1. **事实唯一来源**：所有行为结论、异常类型与消息、源码行号，只能来自测试文件本身、ch02-1-2/1-3 的实测记载、生产源码逐字摘录三处；不得发明未实测行为、不得臆测消息全文。
2. **测试代码逐字入图**：从仓库文件原样复制（含缩进——`@Nested` 内方法的 javadoc/签名是 **8 空格**缩进、方法体 **12 空格**）；一行不改、不重排、不美化。
3. **行号必须 `grep -n` 重新锚定**：A 组实测发生过"通读工具显示行号整体偏 1"的事故。测试行号、生产源码摘录行号，一律以 `grep -n` / 直接读文件核实为准。
4. **只新增文件**：不改测试文件；不动 `explaining-scenarios-in-html/group-a/` 与 `group-b/` 任何文件；不动任何 `ch02-*.md` 与生产代码。
5. **每个 HTML 自包含**：内联 CSS/JS、无外部依赖、无构建步骤，浏览器双击可开；整体浅色主题。
6. **测试的"不规则处"如实入图**：given/when/then 是对真实语句的**归类标注，不是改写许可**。**本组的异常大多发生在 given（build/parse 期）而非 when**——"炸"的那一步就放 given，`assertThrows` 的 then 步负责展示异常卡片；骨架跟着真实代码走，不套模板。

#### 2）每个测试页的内容规格（与 A 组同构）

**步骤骨架（每测试 8–13 步，五页尽量同构；C1a 没有 parse 与 records，允许缩至 7–8 步，但骨架顺序保持）**

- 第 0 步【文件】虚构等价文件 `c<编号>.csv`（如 `c1b.csv`、`c2.csv`、`c3a.csv`）：右侧"文件字节视图"展示字节级内容，`\r\n` 用紫色 token 显式着色，附文件元信息。**C1a 例外**：它没有 CSV 输入、不 parse——第 0 步如实展示"无输入文件（build 期即抛，尚未进入解析）"。
- 第 1 步【桥】等价桥源码卡片（每页相同结构）：`CSVFormat.java:2207-2209 parse(Reader)` ↔ `CSVParser.java:407-410 parse(Path,Charset,CSVFormat)`，汇合 `:524` → `:528 createHeaders()`。**C1a 例外**：解说点明"本次连这两个入口都没走到——异常发生在更早的 `builder.get()`"。
- given 段 2–4 步：format/builder 配置逐项含义（重点展示 `setDuplicateHeaderMode` / `setAllowMissingColumnNames` 开关）→ parse → 构造器 → `createHeaders()` 校验循环。**C1a 在 builder 配置步即"炸"（代码行红色高亮 + 异常卡片）；C1b/C3b 在 parse 步"炸"**。
- when 段 1–2 步：被测调用（`get("id")`、`get("")`、第二个 try 块复查 headerMap 等）。
- then 段 2–4 步：断言逐条进入断言表；异常路径用异常卡片。
- 末步【总结】：本测试钉住的事实清单 + 互引 + **ch02-1-3 记载的"对 `setRequiredHeaders` 的含义"必须带上**（C 组是"早报错"的现成先例）。

**组件规格（照抄 A 组实现）**

- **源码剧场卡片**：每页 3–5 张，随步骤开合。真实源码摘录（±3 行上下文）、行号列、当前行高亮（黄底 `#fff8c5` + 橙色左条 `#9a6700`）、行号前红点 `●` = ch02-1-3 建议断点、卡脚注"断点对照：ch02-1-3 §C<编号>"。走不到的分支用灰色行（class `no`）。
- **文件字节视图**：当前被消费的行紫色高亮；已消费行淡化 + "✓已消费"后缀。**C1b/C3b 的关键可视化：数据行永远不高亮、永不带 ✓——它们从未被读**。
- **解析器状态面板**：format 配置表（必须含 `duplicateHeaderMode` / `allowMissingColumnNames` 行）｜`parser.headerRecord`｜`parser.headerMap`（chips；C2 展示 `id→0` 被 `id→2` 覆盖；C3a 空名 chip 原样展示为空串）｜`records`（绿色 chip 逐条出现；parse 期炸掉的页 records 恒空）。
- **变量监视盒**：IDE watch 风格，随步更新（如 C1b 的 `dupCheckSet`/`headerMap.containsKey`、C3b 的 `observedMissing`）。
- **断言表**（then 步）：`断言摘要 | 期望 | 实际 | ✓`；实际值取自 ch02-1-2/1-3 实测记载；表头注明"特征测试：期望 = 现状实测值"。
- **异常卡片**：精确类型 + 消息原文（等宽引用块，逐字）+ 抛出位置（`文件.java:行号` + 红点）+ 迷尼调用栈 + **时机标注**（build 期 / parse 期——这正是 C 组的核心差异维度）。
- **diff 对比卡**（变体页）：页顶"XX 的对照变体"徽标；在差异起作用的步骤浮出 `− 红删 / + 绿加`。
- **每步解说**：中文 1 段（2–4 句），放底部解说条。

**C 组特有注意点**

1. **C1a 的异常发生在 given（build 期）**：`builder.get()` 一行内炸——该步代码行红色高亮 + 异常卡片；when/then 是 `assertThrows` 断言本身。调用链卡片：`CSVFormat.java:328`（get() 内 `new CSVFormat(this)`）→ `:1676`（构造尾 `validate()`）→ `:2791`（进入 header 段）→ `:2797`（第二个 "id" `add` 返回 false → `containsHeader`）→ `:2799`（throw）。消息原文（断言只断 `duplicate name` 与 `id` 片段）：`The header contains a duplicate name: "id" in [id, currency, id]. If this is valid then use CSVFormat.Builder.setDuplicateHeaderMode().`
2. **C1b 是 ch02-1-3 标注"本热身最关键的一个测试"（★）**：`format.parse()` 调用本身抛出（构造器 `:528` → `createHeaders()` → `:661` `containsHeader` 判重 → `:665-668` throw），**数据行 `1,USD,2` 从未被读**——文件第 2 行永不高亮、records 恒空。这是"`setRequiredHeaders` 想要的'读第一条记录之前报错'的现成先例"，index 总览图与该页末步总结都必须点明。
3. **C2 展示覆盖过程**：`:672` 两次 put——先 `id→0`，循环到第三个列名时 `id→2` **覆盖**；`headerMap.get("id")` 从 0 变 2（监视盒展示变化）；断言 `get("id")`="2" 与 `Integer.valueOf(2), parser.getHeaderMap().get("id")`；与 Javadoc 一致（`CSVRecord.java:108`："only the last occurrence is returned"）——重复列名下 headerMap 是**有损映射**。
4. **C3a 空名也是 key**：`currency,,amount` + `allowMissingColumnNames(true)`；`:657` `isBlank("")`=true → `:658` 不抛（allow=true）→ `:671-672` `""` 非 null，**空字符串 put 进 map**（→1）；chip 原样展示 `{currency=0, =1, amount=2}`；断言 `get("")`="100" 与 `containsKey("")`、`Integer.valueOf(1)`。
5. **C3b 讲清 `observedMissing` 标志位**：空名重复的判定**不是 map 查询**而是 `:670` 的 `observedMissing |= blankHeader`（第一个空名处理后置 true，第二个空名时 `:661` 视为重复）→ `:665` 三条件全真 → 抛。对照变体徽标"⟵ c3a 的 DISALLOW 对照"，diff 卡：c3a 的 format 行（无 DISALLOW）vs c3b 的（+ `.setDuplicateHeaderMode(DuplicateHeaderMode.DISALLOW)`），在 format 构建步浮出。
6. **C1b/C2/C3a 内嵌第二个 try 块复查 headerMap**——如实入图（A 组 a2a 的"第二次 parse"先例）。
7. **C 组的 format 构建全部是内联 builder 链**（不用 headerFromFirstRecord helper）——代码区如实呈现；`DuplicateHeaderMode` 枚举（`ALLOW_ALL / ALLOW_EMPTY / DISALLOW`，since 1.10.0）可在 C1b 或 index 的源码卡片/图例中展示。
8. **C1a 与 C1b 的"时机对照"**：同一种错误（重复表头 + DISALLOW），手工表头在 build 期炸、文件表头在 parse 期炸——两页的异常卡片时机标注要互相引用（这是 ch02-1-2 "P5 踩坑"：两个校验时机）。

#### 3）交互与视觉规格（CSS 与 JS 引擎从 `explaining-scenarios-in-html/group-a/a1-noHeaderGetValueByIndexAndGetByNameThrows.html` 逐字照抄，只换 STEPS 数据与静态内容）

- **步进器**：底部「◀ 上一步 / 下一步 ▶」按钮；键盘 `←`/`→`/空格；顶部每步一个圆点（颜色=阶段，点击跳转）；点击测试代码任一行跳到覆盖它的步骤；「自动播放」开关（默认关、约 6s/步、末步自停）；URL 支持 `?step=N` 直达并用 `history.replaceState` 同步。
- **布局**：顶栏（场景号徽标 + 方法名 + 步骤圆点 + 步号 n/N + 页间导航「← 上一测试 ｜ ⌂ index ｜ 下一测试 →」）｜左区约 55%：测试代码区（**全部行从第 0 步起可见、当前步覆盖行高亮、行号列；下方源码剧场随步开合**，max-height 46% 内部滚动）｜右区约 45%：文件字节视图 / 解析器状态 / 监视盒 / 断言·异常·差异 四面板｜底部解说条 + 控制。
- **色板（浅色）**：白底 `#ffffff`、面板 `#f6f8fa`、边框 `#d0d7de`、正文 `#1f2328`；阶段色 given 蓝 `#0969da` / when 橙 `#9a6700` / then 绿 `#1a7f37` / 文件·桥紫 `#8250df`；断点·异常红 `#cf222e`；当前行高亮 `#fff8c5`；diff 红 `#ffebe9`/绿 `#dafbe1`。
- **代码语法色（VS Code Light+）**：关键字 `#0000ff`、字符串 `#a31515`、注释 `#008000`、数字 `#098658`、类型 `#267f99`。
- **页脚**（`<本页场景号>` = C1a/C1b/C2/C3a/C3b）：`ch02-1-16 · <本页场景号> · ch02-after (24562da2) · 场景：ch02-1-2 §第一部分 <本页场景号> · 断点：ch02-1-3 §2 <本页场景号> · 键盘 ←/→/空格 步进`。
- 桌面优先（1280–1440px 宽）。

#### 4）文件与目录

输出到 `explaining-scenarios-in-html/group-c/`，共 6 个文件：

1. `c1a-duplicateManualHeaderWithDisallowThrowsAtFormatBuild.html`
2. `c1b-duplicateFileHeaderWithDisallowThrowsAtParserCreation.html`
3. `c2-duplicateNameAllowedByDefaultResolvesToLastIndex.html`
4. `c3a-blankHeaderNameIsMappedWhenMissingColumnNamesAllowed.html`
5. `c3b-duplicateBlankHeadersWithDisallowThrowsAtParserCreation.html`
6. `index.html`

**index.html（照抄 A 组 index 模板结构）**：

- ① 组级总览图，主题「**表头校验的两个时机 × 三种模式**」：左链 **build 期**（`builder.get()` `CSVFormat.java:327-328` → 构造 `:1676 validate()` → `:2790-2804` header 段，C1a）；右链 **parse 期**（`format.parse()` `:2207` → 构造器 `:524` → `:528 createHeaders()` → `:655-678` 校验循环，C1b/C3b）；中部 `ALLOW_ALL / ALLOW_EMPTY / DISALLOW` 放行矩阵（C2 默认放行+后列覆盖、C3a 空名放行、显式 DISALLOW 才炸）；**高亮 ★C1b：`parse()` 调用本身抛错、数据行从未被读——"读第一条记录之前报错"的现成先例**。附"一句话版本"：**表头校验已存在两个时机——手工表头在 build 时、文件表头在 parse 时；后者天然早于任何数据记录，`setRequiredHeaders` 照此时机做即可**（ch02-1-3 §1/§3）。
- ② 阅读指南四卡（照抄 A 组 index 写法，链接改为 C 组页面）。
- ③ 5 张测试卡片（c1b 卡片加 ★标注；c3b 标注"⟵ c3a 变体"）。
- ④ 速查表（内容已按 ch02-1-2/1-3 预填，agent 复核后使用）：

| 测试 | format 配置 | 文件形态 | 结果 | 抛错时机 | 数据行被读了吗 |
| --- | --- | --- | --- | --- | --- |
| C1a | `setHeader("id","currency","id")` + `DISALLOW` | **无输入（不 parse）** | `builder.get()` 抛 IAE：`The header contains a duplicate name: "id" in [id, currency, id]. …`（`CSVFormat.java:2799`） | **build 期**（`get()` :328 → :1676 validate） | —（parser 都没建） |
| C1b | `setHeader()` + skip + `DISALLOW` | `id,currency,id` + 1 数据行 | `format.parse()` 抛 IAE（含 `duplicate name`）（`CSVParser.java:666-668`） | **parse 期**（构造器内 :528 → :665-668） | **从未**（`1,USD,2` 未被读）★ |
| C2 | `setHeader()` + skip（默认 `ALLOW_ALL`） | `id,currency,id` + 1 数据行 | 不抛；`headerMap`：`id→2`（:672 二次 put 覆盖 0）；`get("id")`="2" | — | 正常读 |
| C3a | `setHeader()` + skip + `allowMissingColumnNames(true)` | `currency,,amount` + 1 数据行 | `""` 成为 key（→1）；`get("")`="100" | — | 正常读 |
| C3b | C3a 配置 + `DISALLOW` | `currency,,` + 1 数据行 | parse 时抛 IAE（含 `duplicate`）——空名重复由 `observedMissing`（:670）判定，非 map 查询 | **parse 期** | 从未 |

- 页脚锚同各页（`ch02-1-16 · C 组 · ch02-after (24562da2)`），并注明"行号与行为结论全部来自 ch02-1-2 / ch02-1-3 的实测记载"。

#### 5）事实取证流程（写 STEPS 数据前完成）

1. `grep -n` 锚定下表全部方法名 → 核对真实行号（本表行号已于 2026-10-25 用 grep -n 核实）；
2. 打开生产源码逐字摘录本组需要的片段：`CSVFormat.java:214-223`（Builder.create 默认值，:221 `ALLOW_ALL`）、`:327-329`（get()）、`:486-488`（setDuplicateHeaderMode）、`:1676`（构造尾 validate()）、`:2790-2804`（validate 的 header 段：:2791 进入条件、:2797 containsHeader、:2799-2801 抛错）；`CSVParser.java:524-528`、`:628-683`（重点 :655-678：:657 isBlank、:658-659 空名抛错、:661 containsHeader、:663 duplicatesAllowed、:665-668 重复抛错、:670 observedMissing、:671-672 put）；`DuplicateHeaderMode.java:28-44`（枚举三值）；
3. 从测试源文件**原样复制**代码行（连缩进）嵌入代码区（语法 span 包裹时不得改动任何字符，含 `\r\n` 字面量）；
4. 异常消息原文从 ch02-1-3 或生产源码逐字抄录；断言"实际值"从 ch02-1-2/1-3 实测记载取。

**测试清单（行号已核实）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| C1a | `duplicateManualHeaderWithDisallowThrowsAtFormatBuild` | :200 | — | 手工表头重复 + DISALLOW：`builder.get()` 时抛（**build 期**），消息含 `duplicate name` 与 `id` |
| C1b | `duplicateFileHeaderWithDisallowThrowsAtParserCreation` | :210 | — | ★文件表头重复 + DISALLOW：`format.parse()` 调用本身抛（**parse 期**），数据行从未被读 |
| C2 | `duplicateNameAllowedByDefaultResolvesToLastIndex` | :220 | — | 默认 `ALLOW_ALL` 不报错；`headerMap.get("id")`=2（后列覆盖前列），`get("id")`="2" |
| C3a | `blankHeaderNameIsMappedWhenMissingColumnNamesAllowed` | :232 | — | 表头 `currency,,amount` + allowMissingColumnNames：`""` 也是 key（→1），`get("")`="100" |
| C3b | `duplicateBlankHeadersWithDisallowThrowsAtParserCreation` | :245 | C3 的 DISALLOW 对照（**c3a 的对照变体**） | 两个空列名也算重复：parse 时抛，消息含 `duplicate` |

#### 6）自检（必做；全部 PASS 才算完成；本机已有 `/Applications/Google Chrome.app`）

a. **结构验证**：对每页每步执行 headless Chrome `--dump-dom`（会真实执行 JS），逐项校验：恰好 1 个 `class="dot cur"`；`stepNo` 文本为 `i+1 / N`；`id="narrText"` 非空；整个 DOM 无 `undefined`/`NaN`：
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
     --virtual-time-budget=2500 --dump-dom "file://<绝对路径>/<页面>.html?step=<i>"
   ```
b. **内容抽检**：异常卡片与时机标注（build 期 / parse 期）、C1b 的"数据行从未被读"可视化（文件第 2 行无高亮、records 恒空）、C2 的覆盖过程、C3a 空名 chip、diff 卡（c3b）、断言表关键值，在对应步骤的 DOM 中逐字出现。
c. **逐字校验（python）**：提取每页 `<pre id="code">`，剥离全部标签 + `html.unescape` 后按行拆分；与仓库测试文件对应行做**多重集合比对**，任何一行（含前导空格数）不一致即 FAIL。
d. **index 链接**：每个测试在 index 中至少 3 处链接（总览图 / 卡片 / 速查表）。
e. **截图**：每页全部步骤 `--screenshot` 到系统临时目录（不进仓库），作为留档。
f. **已知坑（A 组实测发生过，防再犯）**：
   - ① `renderState` 中 `st.hm` 为字符串时不得调用 `.map`——必须 `Array.isArray(st.hm)` 判断；
   - ② `@Nested` 方法缩进是 8/12 空格，不是 4/8；
   - ③ 通读类工具显示的行号可能整体偏移，一律 `grep -n` 复核；
   - ④ `assertEquals(Integer.valueOf(2), …)` 这类断言的期望值保持 `Integer 2` 写法，与代码严格对齐。
g. 任何修复后，**必须重跑全部自检**（不允许只重跑失败项）。

#### 7）交付

- 产出 6 个文件；
- 在对话中给出交付报告：产出清单表（文件 / 步数 / 内容要点）+ 自检结论（a–d 各项 PASS 与截图张数）+ 修复记录（若自检发现并修复了问题，逐条列出，格式"现象 → 根因 → 修复"）。
