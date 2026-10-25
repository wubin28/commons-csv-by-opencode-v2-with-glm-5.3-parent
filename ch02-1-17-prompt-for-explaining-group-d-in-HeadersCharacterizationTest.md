# ch02-1-17 提示词：为 D 组特征测试生成 HTML 交互解释图表（已填好，整体复制给 agent 即可）

> 由 ch02-1-14 模板 + D 组取值生成，无占位符残留。行号已经 `grep -n` 复核（2026-10-25）。配套参考实现（只读）：`explaining-scenarios-in-html/group-a/`。

---

### 任务：为 D 组特征测试生成交互式 HTML 解释图表（与 setRequiredHeaders 需求直接相邻的现状对照）

当前目录为 `/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/`。请为 `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` 中嵌套类 `RequirementAdjacent`（即"D 组"）的 **2 个测试**，逐个生成交互式 HTML 解释图表，外加 1 个组级 `index.html`，全部保存到 `explaining-scenarios-in-html/group-d/`（目录不存在则创建）。已有 A 组产物在 `explaining-scenarios-in-html/group-a/`，是本任务的**参考实现与模板基准**。

#### 0）必读文件（按顺序读完再动手）

1. `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` —— `RequirementAdjacent` 嵌套类即 D 组（:256-281）；测试代码逐字入图的唯一来源；
2. `ch02-1-2-scenarios-for-warming-up.md` —— 场景清单（第一部分 D 组各行 + 第三部分对应表）；特别注意第二部分对 D 组的定性："**二者共同决定：将来 `requiredHeaders` 与实际表头做'相等'还是'trim 后相等'匹配，是必须显式决策的行为点**"；
3. `ch02-1-3-debug-guide.md` —— §2 D 组 `RequirementAdjacent` 逐测试断点/行号/行为结论（图表事实的唯一来源）：D1 的 `:672`（put 原样保留空格）与 `CSVRecord.java:135-137`；D2 的 `:643-649`（skip 分支消费文件首行 + `headerRecord = formatHeader`）；以及两条"插入点提示"（D1：将来 required 匹配必须显式决定要不要 trim；D2：校验对象是最终生效的 headerMap，必须放在汇合点之后）；
4. `explaining-scenarios-in-html/group-a/` —— 参考实现：`a1-noHeaderGetValueByIndexAndGetByNameThrows.html`（**模板基准：CSS 与 JS 引擎逐字照抄，只换内容**；异常卡片组件 D1 使用）、`a4-*.html`（skip 分支 `:643-649` 的源码剧场先例）、`index.html`（组级 index 模板）。

#### 1）硬约束（违反任何一条即返工）

1. **事实唯一来源**：所有行为结论、异常类型与消息、源码行号，只能来自测试文件本身、ch02-1-2/1-3 的实测记载、生产源码逐字摘录三处；不得发明未实测行为、不得臆测消息全文。
2. **测试代码逐字入图**：从仓库文件原样复制（含缩进——`@Nested` 内方法的 javadoc/签名是 **8 空格**缩进、方法体 **12 空格**；**D1 的 csv 字符串里 `" currency "` 两端空格一个都不能丢**）；一行不改、不重排、不美化。
3. **行号必须 `grep -n` 重新锚定**：A 组实测发生过"通读工具显示行号整体偏 1"的事故。测试行号、生产源码摘录行号，一律以 `grep -n` / 直接读文件核实为准。
4. **只新增文件**：不改测试文件；不动 `explaining-scenarios-in-html/group-a/`、`group-b/`、`group-c/` 任何文件；不动任何 `ch02-*.md` 与生产代码。
5. **每个 HTML 自包含**：内联 CSS/JS、无外部依赖、无构建步骤，浏览器双击可开；整体浅色主题。
6. **测试的"不规则处"如实入图**：given/when/then 是对真实语句的**归类标注，不是改写许可**；D2 内嵌第二个 try 块复查 `headerMap`，如实入图（A 组 a2a 的"第二次 parse"先例）。

#### 2）每个测试页的内容规格（与 A 组同构）

**步骤骨架（每测试 9–13 步，两页同构）**

- 第 0 步【文件】虚构等价文件 `d<编号>.csv`（`d1.csv` / `d2.csv`）：右侧"文件字节视图"展示字节级内容，`\r\n` 用紫色 token 显式着色，附文件元信息；解说点明"测试并没有读这个文件，而是把完全相同的字节内联进了字符串常量（见 :行号）"。**D1 的文件视图必须让表头名两端的空格可见**（见特有注意点 ①）。
- 第 1 步【桥】等价桥源码卡片（每页相同结构）：`CSVFormat.java:2207-2209 parse(Reader)` ↔ `CSVParser.java:407-410 parse(Path,Charset,CSVFormat)`，汇合 `:524` → `:528 createHeaders()`；卡脚注点明"内联字符串与读文件的字符流完全相同"。
- given 段 2–4 步：format/builder 配置逐项含义 → parse → 构造器 → `createHeaders()` 关键分支（源码剧场卡片）。
- when 段 1–2 步：被测调用（`get(" currency ")` / `get("currency")` / `get("colX")` 等）。
- then 段 2–4 步：断言逐条进入断言表；异常路径（D1 的 `get("currency")`）用异常卡片。
- 末步【总结】：本测试钉住的事实清单 + **ch02-1-3 记载的"插入点提示"必须带上**（D1/D2 正是"对 `setRequiredHeaders` 的含义"本尊——本组存在的意义）。

**组件规格（照抄 A 组实现）**

- **源码剧场卡片**：每页 3–5 张，随步骤开合。真实源码摘录（±3 行上下文）、行号列、当前行高亮（黄底 `#fff8c5` + 橙色左条 `#9a6700`）、行号前红点 `●` = ch02-1-3 建议断点、卡脚注"断点对照：ch02-1-3 §D<编号>"。
- **文件字节视图**：当前被消费的行紫色高亮；已消费行淡化 + "✓已消费"后缀。
- **解析器状态面板**：format 配置表｜`parser.headerRecord`｜`parser.headerMap`（chips：`名 → 下标`；**D1 的 chip 显示 ` currency `（两端空格原样保留）**；D2 的 chips 全部来自配置数组）｜`records`（绿色 chip）。
- **变量监视盒**：IDE watch 风格，随步更新。
- **断言表**（then 步）：`断言摘要 | 期望 | 实际 | ✓`；实际值取自 ch02-1-2/1-3 实测记载；表头注明"特征测试：期望 = 现状实测值"。
- **异常卡片**：精确类型 + 消息原文（等宽引用块，逐字）+ 抛出位置（`文件.java:行号` + 红点）+ 迷你调用栈 + 对照注。
- **每步解说**：中文 1 段（2–4 句），放底部解说条。

**D 组特有注意点**

1. **D1 的空格必须可见**：文件字节视图用可视化符号（如 `id,␠currency␠,amount`，或对空格做底色框选）标出 `" currency "` 两端的空格；`headerMap` 的 chip 原样显示 ` currency `（键两端空格可见）；监视盒中 `header` 变量的值注明"注意字符串两端的空格"（ch02-1-3 原话）。**现状事实**：`CSVFormat.DEFAULT` 的 `trim=false`、`ignoreSurroundingSpaces=false`，`:672` put 原样保留空格——`" currency "` 是独立 key。
2. **D1 把命中与异常并列展示**：先 `get(" currency ")`="USD"（when+then 步，`:135` 查映射命中 index=1 → `:140` 取值），再 `get("currency")` 抛异常（异常卡片）——同一张 headerMap、两种结局，这就是"精确匹配"语义。消息原文（断言只断 `Mapping for currency not found` 片段）：`Mapping for currency not found, expected one of [id,  currency , amount]`（keySet 里就是带空格的 ` currency `）。
3. **D1 异常卡片对照注**：与 B1 同为 `CSVRecord.java:137` 的 `IllegalArgumentException`，差别只在 keySet 里是 `" currency "` 不是 `"currency"`——名字"看着对"却取不到。
4. **D1 使用 `headerFromFirstRecord()`**（`:50-53` 的辅助方法要在代码区展示，见 a2a 页先例）；**D2 是内联 builder 链** + `setSkipHeaderRecord(true)`——两页代码区如实呈现各自写法。
5. **D2 监视盒并列两个"首行"**：`headerRecord`（来自配置 `["colX","currency","amount"]`）与被 `:644` 消费丢弃的文件首行文本（`id,currency,amount`）——**映射键全部来自配置数组，文件首行文本从头到尾没参与映射**（`:649 headerRecord = formatHeader`）。源码剧场卡复用 A 组 a4 页的 `:642-650` 摘录先例。
6. **D2 的断言**：`get("colX")`="1"（index 0）、`get("currency")`="USD"（index 1）、第二个 try 块的 `assertEquals(Integer.valueOf(0), parser.getHeaderMap().get("colX"))`（期望值写法保持 `Integer 0`）。
7. **两页末步总结的"插入点提示"（ch02-1-3 原文要点）**：D1 → 将来 required 匹配必须显式决定 trim 与否；若校验做 trim 而取值不做 trim，会出现"校验过了、`get` 却取不到"的自相矛盾。D2 → required 校验的对象是"最终生效的表头"（headerMap），它可能来自配置也可能来自文件——校验必须放在汇合点（`createHeaders()`）之后，放在 `CSVFormat` 校验里会漏掉文件表头。

#### 3）交互与视觉规格（CSS 与 JS 引擎从 `explaining-scenarios-in-html/group-a/a1-noHeaderGetValueByIndexAndGetByNameThrows.html` 逐字照抄，只换 STEPS 数据与静态内容）

- **步进器**：底部「◀ 上一步 / 下一步 ▶」按钮；键盘 `←`/`→`/空格；顶部每步一个圆点（颜色=阶段，点击跳转）；点击测试代码任一行跳到覆盖它的步骤；「自动播放」开关（默认关、约 6s/步、末步自停）；URL 支持 `?step=N` 直达并用 `history.replaceState` 同步。
- **布局**：顶栏（场景号徽标 + 方法名 + 步骤圆点 + 步号 n/N + 页间导航「← 上一测试 ｜ ⌂ index ｜ 下一测试 →」）｜左区约 55%：测试代码区（**全部行从第 0 步起可见、当前步覆盖行高亮、行号列；下方源码剧场随步开合**，max-height 46% 内部滚动）｜右区约 45%：文件字节视图 / 解析器状态 / 监视盒 / 断言·异常·差异 四面板｜底部解说条 + 控制。
- **色板（浅色）**：白底 `#ffffff`、面板 `#f6f8fa`、边框 `#d0d7de`、正文 `#1f2328`；阶段色 given 蓝 `#0969da` / when 橙 `#9a6700` / then 绿 `#1a7f37` / 文件·桥紫 `#8250df`；断点·异常红 `#cf222e`；当前行高亮 `#fff8c5`。
- **代码语法色（VS Code Light+）**：关键字 `#0000ff`、字符串 `#a31515`、注释 `#008000`、数字 `#098658`、类型 `#267f99`。
- **页脚**（`<本页场景号>` = D1/D2）：`ch02-1-17 · <本页场景号> · ch02-after (24562da2) · 场景：ch02-1-2 §第一部分 <本页场景号> · 断点：ch02-1-3 §2 <本页场景号> · 键盘 ←/→/空格 步进`。
- 桌面优先（1280–1440px 宽）。

#### 4）文件与目录

输出到 `explaining-scenarios-in-html/group-d/`，共 3 个文件：

1. `d1-headerNameWithSurroundingSpacesNeedsExactMatch.html`
2. `d2-manualHeaderBindsPositionsNotFileHeaderText.html`
3. `index.html`

**index.html（照抄 A 组 index 模板结构）**：

- ① 组级总览图，主题「**将来 required 匹配的两个语义决策点**」：决策点 1 —— **trim 与否**（D1：现状精确匹配，`" currency "` 是独立 key；若校验 trim 而取值不 trim，会"校验过了、`get` 取不到"自相矛盾）；决策点 2 —— **匹配对象是"最终生效表头"而非文件文本**（D2：手工表头绑定位置，文件首行文本不参与映射；校验必须放在汇合点 `createHeaders()` 之后）。标注 D1/D2 落点，并回引 A/B/C 组 index。附"一句话版本"：**D 组两个测试共同决定 `setRequiredHeaders` 必须显式决策的两个行为点——匹配语义（trim？）与校验对象（headerMap 而非文件）**。
- ② 阅读指南四卡（照抄 A 组 index 写法，链接改为 D 组页面）。
- ③ 2 张测试卡片（场景号徽标 + 方法名 + 一句话 + 步数/文件形态/断言数元信息）。
- ④ 速查表（内容已按 ch02-1-2/1-3 预填，agent 复核后使用）：

| 测试 | format 配置 | 文件形态 | get("currency")（不带空格） | 其他取值 | headerMap |
| --- | --- | --- | --- | --- | --- |
| D1 | `setHeader()` 自动探测 + skip（headerFromFirstRecord） | 表头 `id, currency ,amount`（列名带前后空格）+ 1 数据行 | **抛 IAE**：`Mapping for currency not found, expected one of [id,  currency , amount]`（:137，精确匹配） | `get(" currency ")`="USD"（命中独立 key，index=1） | key 原样保留空格：`{id=0, " currency "=1, amount=2}` |
| D2 | 手工 `setHeader("colX","currency","amount")` + skip=true | 文件首行 `id,currency,amount`（与配置**不同名**）+ 1 数据行 | "USD"（index 1，来自配置） | `get("colX")`="1"（index 0）；文件首行文本被 :644 消费丢弃 | `{colX=0, currency=1, amount=2}`（**全部来自配置数组**） |

- 页脚锚同各页（`ch02-1-17 · D 组 · ch02-after (24562da2)`），并注明"行号与行为结论全部来自 ch02-1-2 / ch02-1-3 的实测记载"。

#### 5）事实取证流程（写 STEPS 数据前完成）

1. `grep -n` 锚定下表全部方法名 → 核对真实行号（本表行号已于 2026-10-25 用 grep -n 核实）；
2. 打开生产源码逐字摘录本组需要的片段：`CSVParser.java:628-683`（重点 `:655-678` 的 `:672` put 原样保留空格；D2 的 `:642-650` skip 分支与 `:649 headerRecord = formatHeader`）；`CSVRecord.java:130-146`（`:135` 查映射、`:137` 未知名抛 IAE、`:140` 取值）；`CSVFormat.java:1480-1482`（`isBlank`：`value == null || value.trim().isEmpty()`——`" currency "` 不是 blank，走正常列名）、`:627-630`（setHeader）、`:872-874`（setSkipHeaderRecord）；
3. 从测试源文件**原样复制**代码行（连缩进；**D1 的 `" currency "` 空格逐字保留**）嵌入代码区（语法 span 包裹时不得改动任何字符，含 `\r\n` 字面量）；
4. 异常消息原文从 ch02-1-3 或生产源码逐字抄录；断言"实际值"从 ch02-1-2/1-3 实测记载取。

**测试清单（行号已核实）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| D1 | `headerNameWithSurroundingSpacesNeedsExactMatch` | :260 | — | 表头 `" currency "`（带前后空格）：`get(" currency ")` 命中 "USD"；`get("currency")` 抛 `Mapping for currency not found`——精确匹配不 trim |
| D2 | `manualHeaderBindsPositionsNotFileHeaderText` | :271 | — | `setHeader("colX",…)` + 文件首行写 `id,currency,amount`：映射只认配置（colX→0），文件首行文本不参与映射 |

#### 6）自检（必做；全部 PASS 才算完成；本机已有 `/Applications/Google Chrome.app`）

a. **结构验证**：对每页每步执行 headless Chrome `--dump-dom`（会真实执行 JS），逐项校验：恰好 1 个 `class="dot cur"`；`stepNo` 文本为 `i+1 / N`；`id="narrText"` 非空；整个 DOM 无 `undefined`/`NaN`：
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
     --virtual-time-budget=2500 --dump-dom "file://<绝对路径>/<页面>.html?step=<i>"
   ```
b. **内容抽检**：D1 的空格可视化（字节视图与 chip 中 ` currency ` 空格可见）、异常卡片消息原文、命中/异常并列的两步对照；D2 的 headerRecord 与文件首行并列展示、断言表关键值——在对应步骤的 DOM 中逐字出现。
c. **逐字校验（python）**：提取每页 `<pre id="code">`，剥离全部标签 + `html.unescape` 后按行拆分；与仓库测试文件对应行（含 D1 展示的辅助方法行 `:50-53`）做**多重集合比对**，任何一行（含前导空格数、**含 `" currency "` 两端空格**）不一致即 FAIL。
d. **index 链接**：每个测试在 index 中至少 3 处链接（总览图 / 卡片 / 速查表）。
e. **截图**：每页全部步骤 `--screenshot` 到系统临时目录（不进仓库），作为留档。
f. **已知坑（A 组实测发生过，防再犯）**：
   - ① `renderState` 中 `st.hm` 为字符串时不得调用 `.map`——必须 `Array.isArray(st.hm)` 判断；
   - ② `@Nested` 方法缩进是 8/12 空格，不是 4/8；
   - ③ 通读类工具显示的行号可能整体偏移，一律 `grep -n` 复核；
   - ④ `assertEquals(Integer.valueOf(0), …)` 这类断言的期望值保持 `Integer 0` 写法，与代码严格对齐；HTML 中 `" currency "` 的空格在源码摘录、字节视图、chip 三处都必须原样保留，不得被 trim 或折叠。
g. 任何修复后，**必须重跑全部自检**（不允许只重跑失败项）。

#### 7）交付

- 产出 3 个文件；
- 在对话中给出交付报告：产出清单表（文件 / 步数 / 内容要点）+ 自检结论（a–d 各项 PASS 与截图张数）+ 修复记录（若自检发现并修复了问题，逐条列出，格式"现象 → 根因 → 修复"）。
