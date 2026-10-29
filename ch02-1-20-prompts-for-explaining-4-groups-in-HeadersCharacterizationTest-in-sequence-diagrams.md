# ch02-1-20 可直接复制粘贴给 agent 的 4 份提示词（A/B/C/D 组时序图）

## Me:

```
 请你按照你生成上述group a 的sequence diagrams的方式，分别为group a（虽然已经生成了sequence diagrams，但我还是需要完整的提示词）、 b、c和d生成一份提示词，以便我将其复制粘贴给agent，来分别生成相应group的sequence diagrams。q请把这4份提示词以markdown格式保存到 ch02-1-20-prompts-for-explaining-4-groups-in-HeadersCharacterizationTest-in-sequence-diagrams.md 文件中。
```

> **说明**：A 组的时序图已经在本次会话中生成完毕（`explaining-scenarios-in-sequence-diagrams/group-a/`），其架构、交互、视觉风格是通过一轮"假设体检（Round 0）+ 追问"与用户反复确认后定下来的（完整记录见 `ch02-1-19-dialogs-for-explaining-group-a-in-HeadersCharacterizationTest-in-sequence-diagrams.md`）。
>
> 下面 4 份提示词把那次确认下来的最终方案**直接写成固定规格**，不再重复 Round 0 的逐条假设/追问流程——这样粘贴给一个全新的 agent（它看不到本次会话的历史）时，可以一次性按统一标准产出 B、C、D 组，并且（如果你想重新生成或核对）也可以产出 A 组。每份提示词末尾都保留了一条"只在真正遇到新岔路时才向用户提问"的安全阀，不会让 agent 对已经解决的架构问题反复发问。
>
> 4 份提示词彼此独立，各自可以单独复制粘贴给一个 agent 执行；B/C/D 组提示词里都要求"复制 A 组已经写好的 `shared/sequence-player.css`、`shared/sequence-player.js` 到本组目录下，内容不做修改"，所以**建议先确保 `explaining-scenarios-in-sequence-diagrams/group-a/shared/` 已存在**（本次会话已经生成）。

---

## 提示词 1／4：Group A（HeaderSources，表头从哪来）

```
当前目录为 /Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/。

## 背景与目标

commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java
（"commons-csv"子目录下的分支为"ch02-after"）里有 4 个 @Nested 分组（HeaderSources /
NameAccessBoundaries / DuplicateAndBlankHeaders / RequirementAdjacent），场景编号对应
ch02-1-2-scenarios-for-warming-up.md，单步调试要点对应 ch02-1-3-debug-guide.md。

这些测试都是用字符串字面量 + new StringReader(csv) 模拟"CSV 文件"，看惯了容易产生理解
断层：不知道这一行行字符怎么变成了 CSVRecord，表头又是在哪一步被"吃掉"或"跳过"的。

本次任务目标：为 HeaderSources（A 组）的 6 个测试用例，依次生成"嵌入 HTML 页面、可逐步播放
的 UML 时序图"，把 Given（准备数据）→ When（调用待测行为）→ Then（断言）之间，字符流如何
变成表头和记录的全过程画出来。

## 必须先读的材料（自己去读，不要向用户要）

1. commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java
   的 HeaderSources 嵌套类（6 个 @Test 方法）。
2. ch02-1-2-scenarios-for-warming-up.md（场景清单，尤其 A 组部分）。
3. ch02-1-3-debug-guide.md（A 组每个测试对应的断点、行号、变量名）。
4. 生产代码：src/main/java/org/apache/commons/csv/CSVFormat.java、CSVParser.java（尤其
   createHeaders() 方法）、CSVRecord.java、Lexer.java。注意：文档里引用的行号可能与你
   读到的当前代码行号有少量漂移，以你实测读到的行号为准，不要盲目照抄文档数字。
5. 已有的文字版讲解页面：explaining-scenarios-in-html/group-a/（6 个页面 + index.html），
   了解其中的讲解口径，但不要修改这些旧文件，也不要和它们重复——这批新页面是"时序图可视化"
   版本，是文字版的补充，不是替代。
6. 如果 explaining-scenarios-in-sequence-diagrams/group-a/ 下已经存在生成结果（shared/
   目录、6 个 html、index.html），先读一遍现状，确认是要在其基础上重新生成还是覆盖重写，
   如果没有明显冲突就直接按下面规格重新生成覆盖即可，不必为此单独确认。

## 已经定好、不需要再向用户确认的设计规格

1. **不修改** HeadersCharacterizationTest.java；时序图忠实描绘现有测试代码的真实执行路径。
2. **"CSV 文件"的表现方式**：每张图以一个"虚拟 CSV 文件（StringReader）"参与者开场，把字符串
   字面量按行展开（显式标出 \r\n）；同时在页面正文（不是时序图里）用一段提示文字说明"若这是
   磁盘文件，这一步会是 Files.newBufferedReader(path) 读取一个同样内容的 .csv 文件"。不要在
   时序图里画真实的 FileReader——测试代码里从未出现它。
3. **下钻深度**：参与者包含测试方法、CSVFormat/Builder、CSVParser、Lexer、CSVRecord。时序图
   主体下钻到 CSVParser.createHeaders() 与惰性读取 nextRecord() 这条调用链；每个测试页**只在
   "第一次真正读到的那一行"展开一次字符级细节**（Lexer.parseSimpleToken 逐字符扫描、
   isDelimiter 判断分隔符、readEndOfLine 识别 \r\n），用于把"字符 → token → 记录/表头"的
   断层讲透一次；后续同形态的行（第二行数据、第二次 parse 等）用 loop 框或一句折叠注释代替，
   不重复展开字符级细节。
4. **given/when/then 三段分区**：每张图用 Mermaid 的 `rect rgb(...)` 背景色块 + `Note over`
   划出 Given / When / Then 三段；Given = CSV 内容准备 + CSVFormat 构建；When = parse(...) +
   getRecords()（含表头建立与数据读取的完整调用链）；Then = 各条 assertXxx（包含
   assertThrows 触发的那次调用）。如果某个测试里有"第二次 format.parse(...)"专门用来断言
   getHeaderMap() 之类的现象，按原样画出第二次调用，不要为了精简合并成一次。
5. **渲染技术**：用 Mermaid（通过 CDN 加载，例如
   https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js），浅色主题
   （mermaid.initialize 的 theme: "base" + 浅色 themeVariables），sequence.wrap 设为
   false（否则消息文字换行会破坏下面第 6 点的文本精确匹配）。
6. **逐步播放引擎**：一条时序图消息（箭头）= 一步；提供"上一步/下一步"按钮、←/→ 键盘导航、
   "重置"、"自动播放"（可调速 0.5×/1×/1.5×/2×）、跳到 Given/When/Then 段首的按钮。当前步要在
   图上高亮（文字和线条都要变色加粗），并自动滚动到可见区域；高亮的实现方式是：在渲染后的 SVG
   里收集所有 `.messageLine0, .messageLine1` 元素和所有 `.messageText` 元素（两者应按消息出现
   顺序一一对应），用每个步骤里一段**在全图内唯一**的消息文本去匹配对应的 `.messageText`
   节点（按 textContent 精确比较），找到后给该文字节点和与它同序号的线条节点加高亮 class。
   因此**写时序图消息文字时必须保证同一张图内不会有两条消息文字完全相同**（哪怕语义重复的折叠
   行也要措辞上有区分）。
7. **变量快照面板**：侧边栏展示一张"变量 → 值"表格，随步骤累积更新，当前步新变化的变量要用
   醒目背景色标出。
8. **当前步解说面板**：显示该步对应的生产代码行号（格式如 `CSVParser.java:637`）、该行语句
   原文、以及一两句"为什么"的解说（可以引用调试指南里的发现）。
9. **导出功能**：提供"导出整图 PNG"、"导出整图 PDF"（无高亮，按图实际尺寸单页导出）、
   "导出当前步 PNG"（图 + 当前高亮 + 变量面板一起截图，用 html2canvas 之类的库实现）。
10. **演示模式**：提供一个按钮（并绑定 `P` 键）切换到"演示模式"——隐藏工具提示文字和次要按钮，
    布局调整为适合 16:9 录屏的左图右面板两栏，字号放大，用于后续录屏/讲课。默认是正常阅读模式。
11. **文件结构与命名**：
    - 保存目录：explaining-scenarios-in-sequence-diagrams/group-a/
    - 6 个页面文件名（与测试方法一一对应）：
      a1-noHeaderGetValueByIndexAndGetByNameThrows-in-sequence-diagram.html
      a2a-autoDetectedHeaderMapsNamesAndSkipsHeaderRecord-in-sequence-diagram.html
      a2b-autoDetectedHeaderWithoutSkipFlagStillSkipsHeaderLine-in-sequence-diagram.html
      a3-manualHeaderOnHeaderlessSource-in-sequence-diagram.html
      a4-manualHeaderWithSkipHeaderRecordSkipsFileHeaderLine-in-sequence-diagram.html
      a4b-manualHeaderWithoutSkipReadsFileHeaderLineAsData-in-sequence-diagram.html
    - 把步进播放器引擎和样式拆成两个共享文件，放在
      explaining-scenarios-in-sequence-diagrams/group-a/shared/sequence-player.js 和
      .../group-a/shared/sequence-player.css，6 个 html 页面各自用相对路径
      `<script src="shared/sequence-player.js">` / `<link rel="stylesheet"
      href="shared/sequence-player.css">` 引用；每个 html 页面仍然是独立可以单独打开的文件
      （内嵌各自的 Mermaid 图定义和 steps 数据）。
    - 新建 explaining-scenarios-in-sequence-diagrams/group-a/index.html 作为本组导航页，
      列出 6 个测试的标题、一句话描述、测试方法名+行号；单向链接到
      explaining-scenarios-in-html/group-a/ 对应的旧文字讲解页面（不要修改旧文件），并在
      页脚说明"这批页面是时序可视化版本，文字讲解版本见 explaining-scenarios-in-html/
      group-a/，互为补充"。
    - 每个测试页面要有"上一个测试/下一个测试"的导航链接（A1→A2a→A2b→A3→A4→A4b），以及回到
      index.html 的面包屑链接。
12. **语言**：页面文案用中文，代码标识符、类名、方法名保持英文原样。

## 自测要求（完成后必须做，不能只凭感觉）

1. 对每个页面内嵌的 `<script>`（以及共享的 sequence-player.js）做 JS 语法校验（例如用
   `node --check` 对提取出来的脚本内容做检查），确保没有语法错误。
2. 写一个一次性的校验脚本（用 Node 的 vm 模块把每个页面的 SCENARIO 配置对象加载出来即可），
   核对每个 step 的高亮匹配文本（第 6 点提到的"唯一消息文本"）在该页 Mermaid 图定义里能**精确
   命中且只命中一条**消息，不允许出现匹配不到或匹配到多条的情况。6 个页面都要通过这项检查。
3. 如果本地有可用的浏览器自动化工具（例如 Claude in Chrome），用它打开至少 1 个页面，确认
   Mermaid 图确实渲染出来、点击"下一步"确实会高亮、导出按钮点击后确实有文件下载，并检查浏览器
   控制台没有报错；如果没有可用的浏览器工具，要在汇报里明确说明"未能做浏览器内实际验证"，不要
   含糊其辞说"已测试通过"。
4. 完成后用一段简短的汇报列出生成的文件清单和自测结果，不需要用户确认就可以直接产出，除非你
   在实现过程中遇到了这份规格完全没覆盖、必须由用户裁决的新岔路——这种情况下，只提出1个最关键
   的问题（追问技能的格式：编号、问题、建议答案），不要为已经在本规格里写死的点重复发问。
```

---

## 提示词 2／4：Group B（NameAccessBoundaries，按列名取值的边界）

```
当前目录为 /Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/。

## 背景与目标

commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java
（"commons-csv"子目录下的分支为"ch02-after"）的 NameAccessBoundaries（B 组）嵌套类里有 5 个
测试，验证"按列名取值"在各种边界情况下的现状：取不存在的列名、表头比数据长/短、空输入。场景
编号对应 ch02-1-2-scenarios-for-warming-up.md 的 B 组，单步调试要点对应
ch02-1-3-debug-guide.md 的 B 组部分。

这批测试同样是用字符串字面量 + new StringReader(csv) 模拟"CSV 文件"，容易产生"字符流怎么变成
表头/记录"的理解断层。本次任务：为 B 组的 5 个测试用例依次生成"嵌入 HTML 页面、可逐步播放的
UML 时序图"，复用 A 组已经确认过的技术方案，不需要重新设计。

## 必须先读的材料（自己去读，不要向用户要）

1. HeadersCharacterizationTest.java 的 NameAccessBoundaries 嵌套类（5 个 @Test 方法，大致
   在 :139-192 附近，具体以你实测读到的行号为准）。
2. ch02-1-2-scenarios-for-warming-up.md 的 B 组部分。
3. ch02-1-3-debug-guide.md 的 B 组部分（断点、行号、变量名）。
4. 生产代码：CSVFormat.java、CSVParser.java（createHeaders()、addRecordValue()）、
   CSVRecord.java（get(String)、isConsistent()、size()）。行号以你实测为准，不要盲目照抄
   文档数字。
5. 已有文字版讲解页面 explaining-scenarios-in-html/group-b/（5 个页面 + index.html），了解
   讲解口径但不要修改，也不要重复其内容。
6. **参考实现**：explaining-scenarios-in-sequence-diagrams/group-a/ 下已经生成的 6 个 A 组
   页面（包括 shared/sequence-player.js、shared/sequence-player.css 和 index.html）——这是
   本次任务要复刻的技术方案与视觉风格的"活文档"，直接打开读一遍，比任何文字描述都准确。

## 已经定好、不需要再向用户确认的设计规格（与 A 组完全一致）

1. 不修改 HeadersCharacterizationTest.java；忠实描绘现有测试代码的真实执行路径。
2. 每张图以"虚拟 CSV 文件（StringReader）"开场，按行展开字符串字面量（显式标 \r\n）；页面正文
   另附一句"若是磁盘文件，这一步是 Files.newBufferedReader(...)"的对照说明，不在时序图里画
   真实 FileReader。
3. 参与者包含测试方法、CSVFormat/Builder、CSVParser、Lexer、CSVRecord；下钻到
   createHeaders()/nextRecord() 这条链路；每页只在"第一次真正读到的那一行"展开一次字符级细节
   （parseSimpleToken 逐字符、isDelimiter、readEndOfLine），其余重复行用 loop 或折叠注释代替。
4. 用 Mermaid `rect rgb(...)` + `Note over` 划出 Given/When/Then 三段；有"第二次 parse(...)"
   断言 headerMap/getHeaderNames 之类现象的测试，按原样画出第二次调用，不要合并。
5. Mermaid 通过 CDN 加载，浅色主题，sequence.wrap 设为 false。
6. 复刻 A 组的逐步播放引擎：直接**复制** group-a/shared/sequence-player.js 和
   group-a/shared/sequence-player.css 到本组目录
   explaining-scenarios-in-sequence-diagrams/group-b/shared/ 下，**内容不做修改**（除非你发现
   其中有明显 bug，这种情况下要同时把修复同步回 group-a/shared/ 下的原文件，保持两组引擎一致，
   并在汇报里说明修了什么）。沿用同样的高亮机制：每个 step 的高亮匹配文本必须是该页 Mermaid
   图里全局唯一的一段消息文字。
7. 侧边栏变量快照表（随步骤累积，当前步变化项高亮）、当前步解说面板（代码行号+语句原文+为什么）
   、三种导出（整图 PNG/整图 PDF/当前步 PNG）、演示模式（P 键切换，16:9 布局）均照抄 A 组。
8. 文件结构与命名：
   - 保存目录：explaining-scenarios-in-sequence-diagrams/group-b/
   - 5 个页面文件名（与测试方法一一对应，命名风格对齐 explaining-scenarios-in-html/group-b/
     里已有的文件名）：
     b1-getByNameWithUnknownNameThrowsMappingNotFound-in-sequence-diagram.html
     b2a-headerLongerThanRecordThrowsIndexMessage-in-sequence-diagram.html
     b2b-recordLongerThanHeaderIsInconsistentButReadable-in-sequence-diagram.html
     b3a-headerOnlyFileYieldsNoRecordsButHeaderMap-in-sequence-diagram.html
     b3b-emptyFileWithAutoDetectedHeaderYieldsEmptyHeaderMap-in-sequence-diagram.html
   - 新建 explaining-scenarios-in-sequence-diagrams/group-b/index.html 作为本组导航页，单向
     链接到 explaining-scenarios-in-html/group-b/ 对应旧页面（不要修改旧文件），并链接回
     explaining-scenarios-in-sequence-diagrams/group-a/index.html 作为"上一组"。
   - 每个测试页面要有"上一个测试/下一个测试"导航（B1→B2a→B2b→B3a→B3b），以及回到本组
     index.html 的面包屑链接。
9. 页面文案用中文，代码标识符保持英文原样。

## 本组需要特别注意的现状（务必对照源码核实，不要只凭猜测画图）

- **B1**：`records.get(0).get("nope")` 抛的是 **IllegalArgumentException**（不是 A1 里的
  IllegalStateException），消息是 "Mapping for nope not found, expected one of [...]"——
  这是因为 headerMap 不是 null，只是查不到这个 key。时序图要清楚区分这两种异常类型的分界线
  （headerMap == null → IllegalStateException；headerMap 非空但查不到 key →
  IllegalArgumentException）。
- **B2a**：表头 3 列（id,currency,amount）但数据行只有 2 个值（1,USD）。`isConsistent()`
  为 false；按名取 "amount" 时，内部先按下标访问 values[2] 发生数组越界，被捕获后转换成带列名
  /期望下标/实际长度的 IllegalArgumentException——这个"先越界、再转换成新异常"的两步要在图里
  体现出来，不要简化成一步直接抛错。
- **B2b**：表头 3 列，数据行却有 4 个值（1,USD,100,extra）。多出来的值照常被存进记录（size()
  返回 4），isConsistent() 为 false，但已映射的列（如 amount）依然能正常按名取到——这是"数据
  比表头长"与 B2a"表头比数据长"两个相反方向的对照，图里要让这个对照清晰可辨（例如放在同一页的
  Then 段落，或者在解说文字里显式提及"对照 B2a"）。
- **B3a**：文件只有表头行，没有任何数据行。getRecords() 返回空列表，但 getHeaderMap() 仍然
  完整（3 项）、getHeaderNames() 也有完整列表——时序图要体现"表头的世界"和"数据的世界"可以
  互相独立存在：表头在构造期就已经定案，跟后面有没有数据行无关。
- **B3b**：完全空文件 + setHeader() 自动探测。nextRecord() 在构造期第一次调用就直接返回 null
  （EOF），headerRecord 保持 null，但最终 getHeaderMap() 返回的是一个**空 Map，不是 null**
  （因为 createEmptyHeaderMap() 在更早的步骤就已经把 Map 对象建好了）。这是实测踩出来的边界
  （"headerMap == null" 和"headerMap 是空 Map"是两种不同的退化形态），时序图和变量面板要把
  这个区别明确标出来，不要含糊地写成"headerMap 为空"。

## 自测要求（与 A 组一致，完成后必须做）

1. 对每个页面内嵌脚本和共享引擎做 JS 语法校验（node --check）。
2. 用脚本核对每页每个 step 的高亮匹配文本在该页 Mermaid 图里精确命中且只命中一条消息，不允许
   匹配不到或匹配到多条。
3. 如果有可用的浏览器自动化工具，实际打开至少 1 个页面验证渲染、步进高亮、导出按钮都能工作，
   并检查控制台无报错；没有可用工具就在汇报里明确说明未做浏览器内验证。
4. 完成后简短汇报文件清单与自测结果；只有遇到本规格完全没覆盖、必须由用户裁决的新岔路时，才用
   追问技能的格式提出 1 个最关键的问题，不要为已经写死的架构点重复发问。
```

---

## 提示词 3／4：Group C（DuplicateAndBlankHeaders，重复列名／空列名的容错）

```
当前目录为 /Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/。

## 背景与目标

commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java
（"commons-csv"子目录下的分支为"ch02-after"）的 DuplicateAndBlankHeaders（C 组）嵌套类里有
5 个测试，验证重复列名/空列名在不同 DuplicateHeaderMode 下的容错现状，以及这些校验**在哪个
时机**抛错（builder.get() 构造期 vs format.parse() 解析期）。场景编号对应
ch02-1-2-scenarios-for-warming-up.md 的 C 组，单步调试要点对应 ch02-1-3-debug-guide.md 的
C 组部分（文档称这是整次热身里最关键的发现之一）。

本次任务：为 C 组的 5 个测试用例依次生成"嵌入 HTML 页面、可逐步播放的 UML 时序图"，复用 A 组
已经确认过的技术方案。

## 必须先读的材料（自己去读，不要向用户要）

1. HeadersCharacterizationTest.java 的 DuplicateAndBlankHeaders 嵌套类（5 个 @Test 方法，
   大致在 :196-252 附近，以你实测读到的行号为准）。
2. ch02-1-2-scenarios-for-warming-up.md 的 C 组部分。
3. ch02-1-3-debug-guide.md 的 C 组部分（断点、行号、变量名，尤其 C1a/C1b 两个时机的对比）。
4. 生产代码：CSVFormat.java（Builder.get()、私有构造函数里的 validate()、
   DuplicateHeaderMode 相关校验）、CSVParser.java（createHeaders() 里 657-678 行附近的空名/
   重复名判定逻辑，行号以实测为准）、DuplicateHeaderMode.java（枚举定义）。
5. 已有文字版讲解页面 explaining-scenarios-in-html/group-c/（5 个页面 + index.html），了解
   讲解口径但不要修改，也不要重复其内容。
6. **参考实现**：explaining-scenarios-in-sequence-diagrams/group-a/ 下已经生成的 6 个 A 组
   页面（包括 shared/ 下的引擎和样式、index.html）——直接打开读一遍作为技术方案与视觉风格的
   权威参考。

## 已经定好、不需要再向用户确认的设计规格（与 A 组完全一致）

1. 不修改 HeadersCharacterizationTest.java；忠实描绘现有测试代码的真实执行路径。
2. 每张图以"虚拟 CSV 文件（StringReader）"开场，按行展开字符串字面量（显式标 \r\n）；页面正文
   另附"若是磁盘文件"的对照说明，不在时序图里画真实 FileReader。**例外**：C1a 这个测试压根
   没有创建 CSVParser 或 StringReader（异常在 builder.get() 阶段就抛出了），这种情况下虚拟
   文件参与者仍然可以出现在图里（代表"接下来本该被解析的内容"），但要在 Given 段明确注明这个
   文件"从未被实际解析"，异常发生在它被读取之前——不要在图里画出任何实际读取这个文件的消息。
3. 参与者包含测试方法、CSVFormat/Builder、CSVParser、Lexer、CSVRecord（C1a 这一页可能用不到
   Lexer/CSVRecord，按实际调用链取舍，不必强行凑齐所有参与者）；下钻到 createHeaders()/
   validate() 这条链路；每页如果涉及真实的数据行读取，只在"第一次真正读到的那一行"展开一次
   字符级细节，其余重复行用 loop 或折叠注释代替。
4. 用 Mermaid `rect rgb(...)` + `Note over` 划出 Given/When/Then 三段；C1a/C1b 这类"异常本身
   就是 When 阶段的终点"的测试，Then 段可以很短（通常只是对异常类型和消息片段的断言），不必
   勉强凑出额外内容。有"第二次 parse(...)"断言现象的测试（如 C2），按原样画出第二次调用。
5. Mermaid 通过 CDN 加载，浅色主题，sequence.wrap 设为 false。
6. 复刻 A 组的逐步播放引擎：直接**复制** group-a/shared/sequence-player.js 和
   group-a/shared/sequence-player.css 到 explaining-scenarios-in-sequence-diagrams/
   group-c/shared/ 下，内容不做修改（除非发现明显 bug，这种情况下同步修复回 group-a/shared/
   并在汇报里说明）。沿用同样的高亮机制：每个 step 的高亮匹配文本必须是该页 Mermaid 图里全局
   唯一的一段消息文字。
7. 侧边栏变量快照表、当前步解说面板、三种导出、演示模式均照抄 A 组。
8. 文件结构与命名：
   - 保存目录：explaining-scenarios-in-sequence-diagrams/group-c/
   - 5 个页面文件名（命名风格对齐 explaining-scenarios-in-html/group-c/ 里已有的文件名）：
     c1a-duplicateManualHeaderWithDisallowThrowsAtFormatBuild-in-sequence-diagram.html
     c1b-duplicateFileHeaderWithDisallowThrowsAtParserCreation-in-sequence-diagram.html
     c2-duplicateNameAllowedByDefaultResolvesToLastIndex-in-sequence-diagram.html
     c3a-blankHeaderNameIsMappedWhenMissingColumnNamesAllowed-in-sequence-diagram.html
     c3b-duplicateBlankHeadersWithDisallowThrowsAtParserCreation-in-sequence-diagram.html
   - 新建 explaining-scenarios-in-sequence-diagrams/group-c/index.html 作为本组导航页，单向
     链接到 explaining-scenarios-in-html/group-c/ 对应旧页面，并链接回
     explaining-scenarios-in-sequence-diagrams/group-b/index.html 作为"上一组"（如果 B 组
     尚未生成，先链接到 group-a/index.html，并在 index.html 里留一句注释说明等 B 组生成后要
     补上链接）。
   - 每个测试页面要有"上一个测试/下一个测试"导航（C1a→C1b→C2→C3a→C3b），以及回到本组
     index.html 的面包屑链接。
9. 页面文案用中文，代码标识符保持英文原样。

## 本组需要特别注意的现状（务必对照源码核实，这是本组测试的核心价值所在）

- **C1a（手工表头重复）**：异常在 **builder.get()**（即 CSVFormat 的私有构造函数末尾调用
  validate()）时就抛出——此时根本不存在 CSVParser、不存在对任何"文件"的读取。时序图的参与者
  主要是 测试方法 → CSVFormat.Builder → CSVFormat（构造函数 → validate()）；抛错点要清楚标出
  是在"格式配置"阶段，而不是"解析"阶段。
- **C1b（文件表头重复）**：异常在 **format.parse(reader)** 内部——具体是 CSVParser 私有
  构造函数里调用 createHeaders() 时——抛出，发生在**任何数据记录被读取之前**（数据行
  "1,USD,2" 从未被消费）。这一点要在图里明确体现：异常发生点在"建表头"这一步，数据行读取这一
  步根本没有机会执行。C1a 与 C1b 应该让读者一眼看出"同一个'重复列名该不该报错'的问题，在手工
  表头和文件表头两条链路上，分别在两个不同的时机被拦住"——建议在两页的解说文字里互相提及对方，
  形成呼应。
- **C2（默认允许重复，取最后一个）**：默认 DuplicateHeaderMode 是 ALLOW_ALL，不会抛错；
  headerMap.put 在遇到第二个同名 "id" 时会**覆盖**第一次写入的值（下标从 0 变成 2）——时序图
  要体现这次"覆盖"发生的那一刻（例如用变量快照面板显示 headerMap 从 {id=0,...} 变成
  {id=2,...}），并点出"按名取值命中的是最后一个同名列"。
- **C3a（空列名被允许时也能映射）**：isBlank("") 为 true，但因为
  setAllowMissingColumnNames(true)，不会抛错；空字符串 "" 本身被当作一个合法的 key 存进
  headerMap（下标 1）。时序图要清楚展示"header 是空白字符串"这一特殊情况是如何正常走完映射
  流程的，不要略过这个细节。
- **C3b（重复空列名 + DISALLOW 抛错）**：判断"是否重复"用的是一个叫 observedMissing 的标志位
  （第一次遇到空名就置位），而不是单纯查 headerMap 里有没有这个 key（因为空名到底有没有真的
  put 进 map，还要看 allowMissingColumnNames 的值）。时序图要把这个标志位的设置和读取过程画
  出来，不要简化成"查表发现重复"。
- 建议在 C1a 与 C1b 两页，以及 C3a 与 C3b 两页之间互相做一次导航提示（哪怕不是严格的
  "上一个/下一个"顺序关系），帮助读者对照着看。

## 自测要求（与 A 组一致，完成后必须做）

1. 对每个页面内嵌脚本和共享引擎做 JS 语法校验（node --check）。
2. 用脚本核对每页每个 step 的高亮匹配文本在该页 Mermaid 图里精确命中且只命中一条消息。
3. 如果有可用的浏览器自动化工具，实际打开至少 1 个页面验证渲染、步进高亮、导出按钮都能工作，
   并检查控制台无报错；没有可用工具就在汇报里明确说明未做浏览器内验证。
4. 完成后简短汇报文件清单与自测结果；只有遇到本规格完全没覆盖、必须由用户裁决的新岔路时，才用
   追问技能的格式提出 1 个最关键的问题。
```

---

## 提示词 4／4：Group D（RequirementAdjacent，与需求直接相邻的匹配语义）

```
当前目录为 /Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3/。

## 背景与目标

commons-csv/src/test/java/org/apache/commons/csv/kata/HeadersCharacterizationTest.java
（"commons-csv"子目录下的分支为"ch02-after"）的 RequirementAdjacent（D 组）嵌套类里有 2 个
测试，钉住将来 setRequiredHeaders(String...) 需求必须显式决策的两个匹配语义边界：表头名带
前后空白要不要 trim、手工表头到底绑定"位置"还是"文件首行文本"。场景编号对应
ch02-1-2-scenarios-for-warming-up.md 的 D 组，单步调试要点对应 ch02-1-3-debug-guide.md 的
D 组部分。

本次任务：为 D 组的 2 个测试用例依次生成"嵌入 HTML 页面、可逐步播放的 UML 时序图"，复用 A 组
已经确认过的技术方案。

## 必须先读的材料（自己去读，不要向用户要）

1. HeadersCharacterizationTest.java 的 RequirementAdjacent 嵌套类（2 个 @Test 方法，大致
   在 :256-281 附近，以你实测读到的行号为准）。
2. ch02-1-2-scenarios-for-warming-up.md 的 D 组部分。
3. ch02-1-3-debug-guide.md 的 D 组部分（断点、行号、变量名）。
4. 生产代码：CSVFormat.java（isBlank()、setHeader(String...)）、CSVParser.java
   （createHeaders() 里 headerRecord 的两条来源分支、657-678 行附近的映射循环）、
   CSVRecord.java（get(String)）。行号以实测为准。
5. 已有文字版讲解页面 explaining-scenarios-in-html/group-d/（2 个页面 + index.html），了解
   讲解口径但不要修改，也不要重复其内容。
6. **参考实现**：explaining-scenarios-in-sequence-diagrams/group-a/ 下已经生成的 6 个 A 组
   页面（包括 shared/ 下的引擎和样式、index.html）——直接打开读一遍作为技术方案与视觉风格的
   权威参考。

## 已经定好、不需要再向用户确认的设计规格（与 A 组完全一致）

1. 不修改 HeadersCharacterizationTest.java；忠实描绘现有测试代码的真实执行路径。
2. 每张图以"虚拟 CSV 文件（StringReader）"开场，按行展开字符串字面量（显式标 \r\n，注意 D1
   的表头行里本来就带有意的前后空格，展开时要把空格原样体现出来，不要被 markdown/HTML 渲染
   自动吃掉，可以用可见的占位符号或在旁边加标注强调"这里有空格"）；页面正文另附"若是磁盘文件"
   的对照说明，不在时序图里画真实 FileReader。
3. 参与者包含测试方法、CSVFormat/Builder、CSVParser、Lexer、CSVRecord；下钻到
   createHeaders()/nextRecord() 这条链路；每页只在"第一次真正读到的那一行"展开一次字符级
   细节，其余重复行用 loop 或折叠注释代替。
4. 用 Mermaid `rect rgb(...)` + `Note over` 划出 Given/When/Then 三段；有"第二次
   parse(...)"断言现象的测试（D2 有一次额外的 parse 来断言 headerMap），按原样画出第二次
   调用。
5. Mermaid 通过 CDN 加载，浅色主题，sequence.wrap 设为 false。
6. 复刻 A 组的逐步播放引擎：直接**复制** group-a/shared/sequence-player.js 和
   group-a/shared/sequence-player.css 到 explaining-scenarios-in-sequence-diagrams/
   group-d/shared/ 下，内容不做修改（除非发现明显 bug，这种情况下同步修复回 group-a/shared/
   并在汇报里说明）。沿用同样的高亮机制：每个 step 的高亮匹配文本必须是该页 Mermaid 图里全局
   唯一的一段消息文字——**D1 这一页要特别小心**：表头名 " currency "（带前后空格）和取值用的
   "currency"（不带空格）在消息文字里必须能清楚区分开，不要因为视觉上相似造成高亮误匹配，必要
   时在消息文字里加显式标注（例如"（注意带前后空格）"）帮助区分，同时保证整张图内所有消息文字
   仍然互不相同。
7. 侧边栏变量快照表、当前步解说面板、三种导出、演示模式均照抄 A 组。
8. 文件结构与命名：
   - 保存目录：explaining-scenarios-in-sequence-diagrams/group-d/
   - 2 个页面文件名（命名风格对齐 explaining-scenarios-in-html/group-d/ 里已有的文件名）：
     d1-headerNameWithSurroundingSpacesNeedsExactMatch-in-sequence-diagram.html
     d2-manualHeaderBindsPositionsNotFileHeaderText-in-sequence-diagram.html
   - 新建 explaining-scenarios-in-sequence-diagrams/group-d/index.html 作为本组导航页，单向
     链接到 explaining-scenarios-in-html/group-d/ 对应旧页面，并链接回
     explaining-scenarios-in-sequence-diagrams/group-c/index.html 作为"上一组"（如果 C 组
     尚未生成，先链接到 group-a/index.html，并在 index.html 里留一句注释说明等 C 组生成后要
     补上链接）；因为 D 组是 4 组里最后一组，index.html 里不需要"下一组"链接。
   - 每个测试页面要有"上一个测试/下一个测试"导航（D1→D2），以及回到本组 index.html 的面包屑
     链接。
9. 页面文案用中文，代码标识符保持英文原样。

## 本组需要特别注意的现状（务必对照源码核实，这是本组测试存在的全部意义）

- **D1（表头名带前后空格，精确匹配不 trim）**：文件首行是 "id, currency ,amount"——注意
  currency 两边各有一个空格。自动探测建立表头时，headerMap 里存的 key 是 " currency "（带
  空格，原样保留，没有 trim）。所以 `get(" currency ")`（带空格）能取到值，而
  `get("currency")`（不带空格）会抛 IllegalArgumentException（"Mapping for currency not
  found"）——这是因为 DEFAULT 格式的 trim/ignoreSurroundingSpaces 都是 false。时序图要让
  读者看清楚：headerMap 里实际存的字符串到底长什么样（建议在变量快照面板里把这个 key 用引号
  精确框出来，视觉上强调两侧的空格），以及这如何直接导致了后面不带空格的查询失败。这是在给
  将来 setRequiredHeaders 的匹配语义（要不要 trim）做铺垫，解说文字里可以点一句"这是现状，
  不是本次要改的行为"。
- **D2（手工表头绑定位置，不认文件首行文本）**：手工表头是 setHeader("colX", "currency",
  "amount")，但文件首行写的是 "id,currency,amount"——两者**列名不同但列数相同**。因为设了
  skipHeaderRecord(true)，文件首行会被读取并丢弃，但 headerMap 的 key 用的是配置数组
  ["colX","currency","amount"]，跟文件首行写的 "id" 完全没关系——`get("colX")` 能取到第一列
  的值（"1"），文件里的 "id" 这个文本从头到尾没有被用来做过任何映射。时序图要清楚体现"文件
  首行被读取丢弃"和"真正建立映射用的是配置数组"这两步是分开的、互不影响的（这一点和 A4 的
  手工表头+skip 场景类似，但 A4 里配置数组和文件首行文本碰巧相同，D2 故意让它们不同，用来
  证明"手工表头绑定的是位置，不是文件首行写的文本"——如果你发现这两页的时序图画法高度相似，
  这是预期之中的，可以在 D2 的解说文字里提一句"对照 A4"，但不需要因此改变画法）。

## 自测要求（与 A 组一致，完成后必须做）

1. 对每个页面内嵌脚本和共享引擎做 JS 语法校验（node --check）。
2. 用脚本核对每页每个 step 的高亮匹配文本在该页 Mermaid 图里精确命中且只命中一条消息——D1
   这一页要重点复查，确认带空格和不带空格的两段文字没有被意外匹配混淆。
3. 如果有可用的浏览器自动化工具，实际打开至少 1 个页面验证渲染、步进高亮、导出按钮都能工作，
   并检查控制台无报错；没有可用工具就在汇报里明确说明未做浏览器内验证。
4. 完成后简短汇报文件清单与自测结果；只有遇到本规格完全没覆盖、必须由用户裁决的新岔路时，才用
   追问技能的格式提出 1 个最关键的问题。
```
