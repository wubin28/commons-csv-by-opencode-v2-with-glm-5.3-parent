# ch02-1-15 提示词：为 B 组特征测试生成 HTML 交互解释图表（已填好，整体复制给 agent 即可）

> 由 ch02-1-14 模板 + B 组取值生成，无占位符残留。行号已经 `grep -n` 复核（2026-10-25）。配套参考实现（只读）：`explaining-scenarios-in-html/group-a/`。

---

### 任务：为 B 组特征测试生成交互式 HTML 解释图表（按列名取值的边界）

当前目录为 `/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/`。请为 `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` 中嵌套类 `NameAccessBoundaries`（即"B 组"）的 **5 个测试**，逐个生成交交式 HTML 解释图表，外加 1 个组级 `index.html`，全部保存到 `explaining-scenarios-in-html/group-b/`（目录不存在则创建）。已有 A 组产物在 `explaining-scenarios-in-html/group-a/`，是本任务的**参考实现与模板基准**。

#### 0）必读文件（按顺序读完再动手）

1. `commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java` —— `NameAccessBoundaries` 嵌套类即 B 组（:141-192）；测试代码逐字入图的唯一来源；
2. `ch02-1-2-scenarios-for-warming-up.md` —— 场景清单（第一部分 B 组各行 + 第三部分"场景↔测试方法对应表"）与断言口径（异常类型精确断言、消息断关键片段）；
3. `ch02-1-3-debug-guide.md` —— §2 B 组 `NameAccessBoundaries` 逐测试断点/行号/行为结论（图表事实的唯一来源），特别是 B1 的 `CSVRecord.java:135/137`、B2a 的 `:140-144`、B3b 的 `:637→:638→:682` 路径；
4. `explaining-scenarios-in-html/group-a/` —— 参考实现：`a1-noHeaderGetValueByIndexAndGetByNameThrows.html`（**模板基准：CSS 与 JS 引擎逐字照抄，只换内容**）、`a2b-*.html` / `a4b-*.html`（变体 diff 卡先例）、`index.html`（组级 index 模板）。

#### 1）硬约束（违反任何一条即返工）

1. **事实唯一来源**：所有行为结论、异常类型与消息、源码行号，只能来自测试文件本身、ch02-1-2/1-3 的实测记载、生产源码逐字摘录三处；不得发明未实测行为、不得臆测消息全文。
2. **测试代码逐字入图**：从仓库文件原样复制（含缩进——`@Nested` 内方法的 javadoc/签名是 **8 空格**缩进、方法体 **12 空格**）；一行不改、不重排、不美化。
3. **行号必须 `grep -n` 重新锚定**：A 组实测发生过"通读工具显示行号整体偏 1"的事故。测试行号、生产源码摘录行号，一律以 `grep -n` / 直接读文件核实为准。
4. **只新增文件**：不改测试文件；不动 `explaining-scenarios-in-html/group-a/` 任何文件；不动任何 `ch02-*.md` 与生产代码。
5. **每个 HTML 自包含**：内联 CSS/JS、无外部依赖、无构建步骤，浏览器双击可开；整体浅色主题。
6. **测试的"不规则处"如实入图**：given/when/then 是对真实语句的**归类标注，不是改写许可**。若异常发生在 given（build/parse 期），"炸"的那一步就放 given，`assertThrows` 的 then 步负责展示异常卡片——骨架跟着真实代码走，不套模板。

#### 2）每个测试页的内容规格（与 A 组同构）

**步骤骨架（每测试 9–13 步，五页尽量同构）**

- 第 0 步【文件】虚构等价文件 `b<编号>.csv`（如 `b1.csv`、`b2a.csv`、`b3b.csv`）：右侧"文件字节视图"展示字节级内容，`\r\n` 用紫色 token 显式着色，附文件元信息（几行几列、什么形态）；解说点明"测试并没有读这个文件，而是把完全相同的字节内联进了字符串常量（见 :行号）"。
- 第 1 步【桥】等价桥源码卡片（每页相同结构）：`CSVFormat.java:2207-2209 parse(Reader)`（测试走的入口）↔ `CSVParser.java:407-410 parse(Path,Charset,CSVFormat)`（真实读文件的入口），两条路汇合到同一私有构造器 `:524` → `:528 this.headers = createHeaders();`；卡脚注点明"内联字符串与读文件的字符流完全相同"。
- given 段 2–4 步：format/builder 配置逐项含义（解析器状态面板的 format 表 + 监视盒）→ parse → 构造器 → `createHeaders()` 关键分支（源码剧场卡片）。
- when 段 1–2 步：被测调用（`get("…")`、`isConsistent()` 等）。
- then 段 2–4 步：断言逐条进入断言表；异常路径用异常卡片。
- 末步【总结】：本测试钉住的事实清单（状态面板 note 复述）+ 互引（A 组回响、组内对照变体；ch02-1-2/1-3 若记载了"对 `setRequiredHeaders` 的含义"，必须带上）。

**组件规格（照抄 A 组实现）**

- **源码剧场卡片**：每页 3–5 张，随步骤开合。真实源码摘录（±3 行上下文）、行号列、当前行高亮（黄底 `#fff8c5` + 橙色左条 `#9a6700`）、行号前红点 `●` = ch02-1-3 建议断点、卡脚注"断点对照：ch02-1-3 §B<编号>"。本场景走不到的分支用灰色行（class `no`，见 a2b 页 :643 先例）。
- **文件字节视图**：当前被消费的行紫色高亮（`#f0eaff` 底 + `#8250df` 左条）；已消费行淡化 + "✓已消费"后缀。
- **解析器状态面板**：format 配置表（kv 表）｜`parser.headerRecord`｜`parser.headerMap`（chips：`名 → 下标`，LinkedHashMap 保序；空 Map 显示"空 Map（非 null）"；null 显示红色"null（无表头世界）"）｜`records`（绿色 chip 逐条出现）。
- **变量监视盒**：IDE watch 风格 `name = value` 行，随步更新。
- **断言表**（then 步）：`断言摘要 | 期望 | 实际 | ✓`；实际值取自 ch02-1-2/1-3 实测记载；表头注明"特征测试：期望 = 现状实测值"。
- **异常卡片**：精确类型 + 消息原文（等宽引用块，逐字）+ 抛出位置（`文件.java:行号` + 红点）+ 迷你调用栈（测试方法 → 中间调用 → throw 行）+ 对照注（与相邻场景的异常对照）。
- **diff 对比卡**（变体页）：页顶"XX 的对照变体"徽标；在差异起作用的步骤浮出 `− 红删 / + 绿加` 两行。
- **每步解说**：中文 1 段（2–4 句），放底部解说条。

**B 组特有注意点**

1. **辅助方法的两种用法要分清**：B1 用 `parseRecords(headerFromFirstRecord(), …)`（`:50-53` 的 headerFromFirstRecord 与 `:55-59` 的 parseRecords 都要在代码区展示，见 a2a 页先例）；B2a/B2b 手工 `setHeader("id","currency","amount")` + parseRecords；**B3a/B3b 不走 parseRecords**——直接 try-with-resources 内 `headerFromFirstRecord().parse(new StringReader(…))`，如实入图（这是"不规则处"的又一形态）。
2. **B3b 第 0 步的文件视图是 0 字节空文件**：照常展示"空"，解说点明 `createHeaders()` 的 `:637` 立即 EOF → `:638` 不进入 → `:682` 返回**空 Map 而非 null**（ch02-1-3 踩坑 P7：将来 required 校验只判 null 会漏掉这个分支）。
3. **B1 异常卡片必须加对照注**：同一个 `get(String)`（`CSVRecord.java:130-146`），A1（无 headerMap）在 `:132-133` 抛 `IllegalStateException`；B1（有 map、名字不存在）在 `:137` 抛 `IllegalArgumentException`——两个分支、两种异常。消息原文：`Mapping for nope not found, expected one of [id, currency, amount]`。
4. **B2a 监视盒并列** `headerMap.size()=3` vs `values.length=2`；其异常卡片说明因果链：`:140` 取 `values[2]` 越界 → `:141-144` catch 后转成 `IllegalArgumentException`，消息原文：`Index for header 'amount' is 2 but CSVRecord only has 2 values!`。
5. **B2a/B2b 是"同一手工表头、不同数据长度"的对照变体**：b2b 页顶"b2a 的对照变体"徽标；diff 卡作用于**文件内容行**（`"1,USD\r\n"` vs `"1,USD,100,extra\r\n"`），在 parse 步浮出。
6. **B2b 的"不一致但可读"并存**：`get("amount")="100"` 正常路径（`:135` index=2 → `:140` values[2]）与 `isConsistent()=false`（`:237-239`，3≠4）同屏展示；`assertEquals(4, records.get(0).size())` 也在断言表中。
7. **B3a 的 `getHeaderNames()` 断言**（`Arrays.asList("id","currency","amount")`）进断言表，解说点明"表头世界与数据世界可独立存在——required 校验只依赖前者"。

#### 3）交互与视觉规格（CSS 与 JS 引擎从 `explaining-scenarios-in-html/group-a/a1-noHeaderGetValueByIndexAndGetByNameThrows.html` 逐字照抄，只换 STEPS 数据与静态内容）

- **步进器**：底部「◀ 上一步 / 下一步 ▶」按钮；键盘 `←`/`→`/空格；顶部每步一个圆点（颜色=阶段，点击跳转）；点击测试代码任一行跳到覆盖它的步骤；「自动播放」开关（默认关、约 6s/步、末步自停）；URL 支持 `?step=N` 直达并用 `history.replaceState` 同步。
- **布局**：顶栏（场景号徽标 + 方法名 + 步骤圆点 + 步号 n/N + 页间导航「← 上一测试 ｜ ⌂ index ｜ 下一测试 →」）｜左区约 55%：测试代码区（**全部行从第 0 步起可见、当前步覆盖行高亮、行号列；下方源码剧场随步开合**，max-height 46% 内部滚动）｜右区约 45%：文件字节视图 / 解析器状态 / 监视盒 / 断言·异常·差异 四面板｜底部解说条 + 控制。
- **色板（浅色）**：白底 `#ffffff`、面板 `#f6f8fa`、边框 `#d0d7de`、正文 `#1f2328`；阶段色 given 蓝 `#0969da` / when 橙 `#9a6700` / then 绿 `#1a7f37` / 文件·桥紫 `#8250df`；断点·异常红 `#cf222e`；当前行高亮 `#fff8c5`；diff 红 `#ffebe9`/绿 `#dafbe1`。
- **代码语法色（VS Code Light+）**：关键字 `#0000ff`、字符串 `#a31515`、注释 `#008000`、数字 `#098658`、类型 `#267f99`。
- **页脚**（`<本页场景号>` = B1/B2a/B2b/B3a/B3b）：`ch02-1-15 · <本页场景号> · ch02-after (24562da2) · 场景：ch02-1-2 §第一部分 <本页场景号> · 断点：ch02-1-3 §2 <本页场景号> · 键盘 ←/→/空格 步进`。
- 桌面优先（1280–1440px 宽）。

#### 4）文件与目录

输出到 `explaining-scenarios-in-html/group-b/`，共 6 个文件：

1. `b1-getByNameWithUnknownNameThrowsMappingNotFound.html`
2. `b2a-headerLongerThanRecordThrowsIndexMessage.html`
3. `b2b-recordLongerThanHeaderIsInconsistentButReadable.html`
4. `b3a-headerOnlyFileYieldsNoRecordsButHeaderMap.html`
5. `b3b-emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap.html`
6. `index.html`

**index.html（照抄 A 组 index 模板结构）**：

- ① 组级总览图，主题「**按名取值的四条边界**」：以 `CSVRecord.get(String)`（`CSVRecord.java:130-146`）的三段路径为汇合点——`:132-133` 无映射（回引 A 组 a1 页）、`:137` 名字不存在（B1）、`:139-145` 映射到了但记录太短（B2a）；旁路两条：`isConsistent()`（`:237-239`，B2a/B2b 的长短记录判定）与空输入形态（B3a/B3b：表头世界与数据世界可独立存在）。标注 5 个测试各落在哪条路径；附"一句话版本"：**隐性缺列（B2a）与显性缺名（B1）都只在取值时才炸——这正是需求要替换的"晚失败"**。
- ② 阅读指南四卡（步进操作 / 画面分区 / 颜色图例 / "为什么每页都从虚构文件开始"——照抄 A 组 index 对应卡片的写法，链接改为 B 组页面）。
- ③ 5 张测试卡片（场景号徽标 + 方法名 + 一句话 + 步数/文件形态/断言数元信息；b2b 标注"⟵ b2a 变体"）。
- ④ 速查表（内容已按 ch02-1-2/1-3 预填，agent 复核后使用）：

| 测试 | format 配置 | 文件形态（虚构等价文件） | records | isConsistent | get(…) 行为 | headerMap |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | `setHeader()` 自动探测 + skip（headerFromFirstRecord） | 1 表头行 + 1 数据行（3 列） | 1 条 `["1","USD","100"]` | true（3=3） | `get("nope")` 抛 IAE：`Mapping for nope not found, expected one of [id, currency, amount]`（:137） | 3 项齐全 |
| B2a | 手工 `setHeader("id","currency","amount")` | 1 数据行仅 2 值：`1,USD` | 1 条 `["1","USD"]` | **false（3≠2）** | `get("amount")` 抛 IAE：`Index for header 'amount' is 2 but CSVRecord only has 2 values!`（:140→:141-144） | 3 项 |
| B2b | 同 B2a | 1 数据行 4 值：`1,USD,100,extra` | 1 条 4 值（`size()`=4） | **false（3≠4）** | `get("amount")`="100" 仍可取（:140 正常） | 3 项 |
| B3a | 自动探测（headerFromFirstRecord） | 仅表头行 | 0 条 | —（无记录） | `getRecords()` 空；`getHeaderNames()`=[id, currency, amount] 保序 | 3 项齐全 |
| B3b | 自动探测（headerFromFirstRecord） | **空文件（0 字节）** | 0 条 | — | `getHeaderMap()` 非 null 且 `isEmpty()`（:633 建 map、:637 EOF、:682 返回空 Map） | **空 Map（非 null，踩坑 P7）** |

- 页脚锚同各页（`ch02-1-15 · B 组 · ch02-after (24562da2)`），并注明"行号与行为结论全部来自 ch02-1-2 / ch02-1-3 的实测记载"。

#### 5）事实取证流程（写 STEPS 数据前完成）

1. `grep -n` 锚定下表全部方法名 → 核对真实行号（本表行号已于 2026-10-25 用 grep -n 核实）；
2. 打开生产源码逐字摘录本组需要的片段：`CSVRecord.java:103-105`（get(int)）、`:130-146`（get(String) 三段路径，B 组核心）、`:237-239`（isConsistent）、`:313-315`（size）；`CSVParser.java:628-683`（createHeaders：B3b 的 :637/:638/:682 路径）、`:732-739`（getHeaderMap 防御性副本）、`:762-764`（getHeaderNames）；
3. 从测试源文件**原样复制**代码行（连缩进）嵌入代码区（语法 span 包裹时不得改动任何字符，含 `\r\n` 字面量）；
4. 异常消息原文从 ch02-1-3 或生产源码逐字抄录；断言"实际值"从 ch02-1-2/1-3 实测记载取。

**测试清单（行号已核实）**

| 编号 | 方法名 | 行号 | 变体关系 | 一句话主旨 |
| --- | --- | --- | --- | --- |
| B1 | `getByNameWithUnknownNameThrowsMappingNotFound` | :143 | — | 需求痛点本尊：`get("nope")` 抛 `IllegalArgumentException`，消息含 `Mapping for nope not found` 与 `expected one of` |
| B2a | `headerLongerThanRecordThrowsIndexMessage` | :153 | B2 的表头多方向 | 表头 3 列 vs 数据 2 值：`get("amount")` 抛 Index 消息，`isConsistent()`=false |
| B2b | `recordLongerThanHeaderIsInconsistentButReadable` | :165 | B2 的数据多方向（**b2a 的对照变体**） | 数据 4 值 vs 表头 3 列：`get("amount")` 仍可取，`isConsistent()`=false |
| B3a | `headerOnlyFileYieldsNoRecordsButHeaderMap` | :175 | B3 的仅表头行方向 | records 为空，headerMap 3 项齐全、`getHeaderNames()` 保序 |
| B3b | `emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap` | :185 | B3 的空文件方向 | headerMap 是**空 Map 不是 null**（踩坑 P7） |

#### 6）自检（必做；全部 PASS 才算完成；本机已有 `/Applications/Google Chrome.app`）

a. **结构验证**：对每页每步执行 headless Chrome `--dump-dom`（会真实执行 JS），逐项校验：恰好 1 个 `class="dot cur"`；`stepNo` 文本为 `i+1 / N`；`id="narrText"` 非空；整个 DOM 无 `undefined`/`NaN`：
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
     --virtual-time-budget=2500 --dump-dom "file://<绝对路径>/<页面>.html?step=<i>"
   ```
b. **内容抽检**：异常卡片与其消息原文（B1/B2a 逐字）、等价桥卡片、源码剧场卡片、diff 卡（b2b）、断言表关键值，在对应步骤的 DOM 中逐字出现。
c. **逐字校验（python）**：提取每页 `<pre id="code">`，剥离全部标签 + `html.unescape` 后按行拆分；与仓库测试文件对应行（含本页展示的辅助方法行）做**多重集合比对**，任何一行（含前导空格数）不一致即 FAIL。
d. **index 链接**：每个测试在 index 中至少 3 处链接（总览图 / 卡片 / 速查表）。
e. **截图**：每页全部步骤 `--screenshot` 到系统临时目录（不进仓库），作为留档。
f. **已知坑（A 组实测发生过，防再犯）**：
   - ① `renderState` 中 `st.hm` 为字符串时不得调用 `.map`——必须 `Array.isArray(st.hm)` 判断；
   - ② `@Nested` 方法缩进是 8/12 空格，不是 4/8；
   - ③ 通读类工具显示的行号可能整体偏移，一律 `grep -n` 复核；
   - ④ `assertEquals(Integer.valueOf(1), …)` 这类断言的期望值保持 `Integer 1` 写法，与代码严格对齐。
g. 任何修复后，**必须重跑全部自检**（不允许只重跑失败项）。

#### 7）交付

- 产出 6 个文件；
- 在对话中给出交付报告：产出清单表（文件 / 步数 / 内容要点）+ 自检结论（a–d 各项 PASS 与截图张数）+ 修复记录（若自检发现并修复了问题，逐条列出，格式"现象 → 根因 → 修复"）。
