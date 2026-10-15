# 手工故障注入指南：`setRequiredHeaders` 验收套件（22 条）

> **配套产物**：方案设计见 `ch05-2-solutions-for-fault-injection.md`（方案一）；自动化配方 `commons-csv/fault-injection/faults.json`、驱动脚本 `commons-csv/fault-injection/run_faults.py`；运行台账 `ch05-4-fault-injection-run.log`（2026-10-15 实测 **22/22 闭环成功**，末尾全量回归 `Tests run: 1025, Failures: 0, Errors: 0, Skipped: 11`）。
> **行号口径**：全部行号对应 HEAD `9a1af060`（注入前状态）。注入会改变行号——每条均附 `grep -n` 重新定位命令。**注入后务必撤销**（`git checkout -- <文件>`），脚本已内置 try/finally 自动撤销 + 字节级还原校验。

---

## 0. 这套资料怎么用

### 0.1 自动化闭环（推荐先跑一遍看效果）

```zsh
cd commons-csv
python3 fault-injection/run_faults.py          # 全部 22 条 + 末尾全量回归
python3 fault-injection/run_faults.py TC-B4    # 只跑一条（调试/演示用）
```

每条循环：preflight（文件干净 + 片段唯一）→ 注入 → 方法级运行验证变红（**三重校验**：目标 fixture 失败 / 失败消息含期望片段 / 实际连带变红集合 == 推演集合）→ `git checkout` 撤销 → 再运行验证全绿。

### 0.2 手工注入（VSCode 单步，本指南的主体）

1. 打开 `./commons-csv`（VSCode Java 项目），确认 `git status` 干净；
2. 按 §1–§3 找到注入点（先跑该条的 grep 命令核实行号），手动把"注入前代码"改成"注入后代码"（保存即触发增量编译）；
3. Testing 面板找到 `RequiredHeadersApprovedScenariosTest` → 对应入口方法（`tableA_buildPhase` / `tableB_parsePhase` / `tableC_printPhase`）▶ Run 一次展开子节点 → 观察目标 fixture 变红，对照"期望看到的报错信息"（全部为 2026-10-15 实测）；
   - 想"看着故障起作用"：在注入行打断点，右键目标子节点 → **Debug Test** 单步；
4. **撤销**：`git checkout -- <文件>`（或编辑器 Undo），重跑该方法确认全绿；
5. 连带面核对：§1–§3 每条给出"预期连带变红"清单——手工跑整方法时对照失败列表，体会"故障的影响面 = 保护同一语义侧面的 fixture 集合"。

### 0.3 一览表（22 条 × 6 个语义落点）

| 用例 | 注入点（文件:行） | 故障一句话 | 预期连带变红（含目标） |
| --- | --- | --- | --- |
| TC-A1 | CSVFormat.java:1940 | getter null 分支返回 `[]` | A1 + A1a-empty + A1a-null（getter null 契约家族） |
| TC-A1a-empty | CSVFormat.java:888 | 拆除归一化，空数组原样存储 | 仅 A1a-empty |
| TC-A1a-null | CSVFormat.java:888 | null 被解释成 `["?"]` | 仅 A1a-null |
| TC-A2 | CSVFormat.java:2851 | D6 矛盾检查加永假条件 | 仅 A2 |
| TC-A3a | CSVFormat.java:2851 | D6 把"空数组表头"当"没表头" | 仅 A3a |
| TC-A3b | CSVFormat.java:2851 | 引入 build 期等长交叉检查 | 仅 A3b |
| TC-B1 | CSVParser.java:684 | 拆掉 null 门卫 | 仅 B1 |
| TC-B2a | CSVParser.java:658 | 空名检查条件反转 | B2a + B2c |
| TC-B2b | CSVParser.java:665 | 重复名检查整体短路 | 仅 B2b |
| TC-B2c | CSVParser.java:658 | 空名检查依赖"未设必需列" | B2a + B2c |
| TC-B3 | CSVParser.java:687 | 命中判定不查表 | B3/B3a/B4/B5/B6/B7a/B7b（命中侧家族，7 个） |
| TC-B3a | CSVParser.java:643 | skip 失效 | 仅 B3a |
| TC-B4 | CSVParser.java:616 | 恒用大小写折叠表 | B3 + B3a + B4 |
| TC-B5 | CSVParser.java:616 | 恒用精确匹配表 | 仅 B5 |
| TC-B6 | CSVParser.java:672 | key 入表时 trim | 仅 B6 |
| TC-B7a | CSVParser.java:691 | 只报 >1 个缺失 | B6/B7a/B7e/B7f（单缺失家族，4 个） |
| TC-B7b | CSVParser.java:686 | 倒序遍历名单 | B4/B7b/B7c/B7d（≥2 缺失家族） |
| TC-B7c | CSVParser.java:688 | 报一个就 break | B4/B7b/B7c/B7d（≥2 缺失家族） |
| TC-B7d | CSVParser.java:637 | 空文件特判成结构错误 | 仅 B7d |
| TC-B7e | CSVParser.java:649 | 手工模式偷看文件首行 | 仅 B7e |
| TC-B7f | CSVParser.java:687 | 拆掉 missing 去重 | 仅 B7f |
| TC-C1 | CSVPrinter.java:120 | 打印期新增 required 校验 | 仅 C1 |

---

## 1. 表 A 组（build 期决策点）——入口方法 `tableA_buildPhase`

### TC-A1 · 未设置 → getter 返回 null（A-R1 / D7）

- **注入点**：`CSVFormat.getRequiredHeaders()`，`CSVFormat.java:1940`
  定位：`grep -n "requiredHeaders != null ? requiredHeaders.clone()" src/main/java/org/apache/commons/csv/CSVFormat.java`
- **注入前**：
  ```java
          return requiredHeaders != null ? requiredHeaders.clone() : null;
  ```
- **注入后**：
  ```java
          return requiredHeaders != null ? requiredHeaders.clone() : new String[0];
  ```
- **为什么这样设计**：A1 保护"未设置时 getter 契约 = null"（特性关闭的可观察形态）。故障让 null 分支返回空数组——三个断言 `必需表头返回值=(null)` 的 fixture 在 getter 处汇合变红。
- **期望看到的报错（实测）**：
  ```
  TC-A1: getRequiredHeaders() 应为 null ==> expected: <null> but was: <[]>
  ```
- **连带变红**：`TC-A1a-empty`、`TC-A1a-null`（同样断言 getter 为 null——"getter null 契约家族"）。
- **设计修正记录（如实）**：第一版故障打在 Builder 字段默认值（`:267` 加 `= new String[0]`），实测引爆 `CSVFormat` **类初始化**——静态构造也走 Builder，D6 把非 null 默认值当配置矛盾拒绝，`ExceptionInInitializerError` 表 A 6/6 全红，连带面与保护意图无关，判为不合格语义故障后改打 getter 契约。

### TC-A1a-empty · 传空数组 → 等价未设置（A-R1 / D7 + E8 陷阱）

- **注入点**：`Builder.setRequiredHeaders()` 归一化行，`CSVFormat.java:888`
  定位：`grep -n "clone == null || clone.length == 0" src/main/java/org/apache/commons/csv/CSVFormat.java`
- **注入前**：
  ```java
              this.requiredHeaders = clone == null || clone.length == 0 ? null : clone;
  ```
- **注入后**：
  ```java
              this.requiredHeaders = clone;
  ```
- **为什么这样设计**：保护"空数组归一化为 null"。故障整体拆除归一化——空数组以"已设置"形态（`[]`）存下来。
- **期望看到的报错（实测）**：
  ```
  Required headers [] are set but no header is defined
  ```
  （`java.lang.IllegalArgumentException`，栈顶 `CSVFormat.validate` → `Builder.get`）
- **连带变红**：无（显式传 null 的子变体 null 原样存储仍读作 null；A1 从未调用不受影响）。
- **实测注记（如实）**：预判的失败点是 getter 的 `assertNull`，实际失败**更早**——未归一的 `[]` 名单在 `builder.get()` 就被 D6 拦截。报错本身就是 D7 与 D6 联动的证据，比 getter 层断言更早、更响。

### TC-A1a-null · 显式传 null → 等价未设置（A-R1 / D7）

- **注入点**：同上，`CSVFormat.java:888`
- **注入前**：同上。
- **注入后**：
  ```java
              this.requiredHeaders = clone == null ? new String[] { "?" } : (clone.length == 0 ? null : clone);
  ```
- **为什么这样设计**：保护"显式 null = 未设置"（`clone == null` 分支）。故障把 null 歪曲成一个非空名单 `["?"]`——"显式关闭"变成"设置了一个未知必需列"。
- **期望看到的报错（实测）**：
  ```
  Required headers [?] are set but no header is defined
  ```
- **连带变红**：无。消息里的 `[?]` 直接展示了被歪曲的名单。
- **实测注记（如实）**：与 A1a-empty 同理，失败发生在 D6 而非 getter 断言层。

### TC-A2 · 设了必需列却没定义表头 → build 期 IAE（A-R2 / D6）

- **注入点**：`Builder.get()` → `validate()` 的 D6 检查，`CSVFormat.java:2851`
  定位：`grep -n "requiredHeaders != null && headers == null" src/main/java/org/apache/commons/csv/CSVFormat.java`
- **注入前**：
  ```java
          if (requiredHeaders != null && headers == null) {
  ```
- **注入后**：
  ```java
          if (requiredHeaders != null && headers == null && requiredHeaders.length > 99) {
  ```
- **为什么这样设计**：保护 D6 fail-fast。追加永假条件（名单长于 99）——矛盾检查永不触发。
- **期望看到的报错（实测）**：
  ```
  Expected java.lang.IllegalArgumentException to be thrown, but nothing was thrown.
  ```
- **连带变红**：无（其余用例或未设名单、或已设表头，条件照旧为假）。

### TC-A3a · 自动探测表头 + 必需列 → build 通过（A-R3 / D5）

- **注入点**：同 TC-A2，`CSVFormat.java:2851`
- **注入后**：
  ```java
          if (requiredHeaders != null && (headers == null || headers.length == 0)) {
  ```
- **为什么这样设计**：保护"空数组表头（自动探测）也算定义了表头，build 期不抛"。故障把 D6 的"没表头"扩大到"空数组表头"——自动模式在 build 期被误杀。
- **期望看到的报错（实测）**：
  ```
  Required headers [date, amount, currency] are set but no header is defined
  ```
  （`java.lang.IllegalArgumentException`，error 形态——"build 通过"路径上异常穿透）
- **连带变红**：无（A2 走 `headers==null` 分支抛同款 IAE 保持绿；A3b 非空手工表头不受影响）。

### TC-A3b · 手工表头 + 必需列 → build 同样通过（A-R3 / D5 拒绝双时机）

- **注入点**：D6 检查块，`CSVFormat.java:2851-2853`
- **注入前**：
  ```java
          if (requiredHeaders != null && headers == null) {
              throw new IllegalArgumentException(String.format("Required headers %s are set but no header is defined", Arrays.toString(requiredHeaders)));
          }
  ```
- **注入后**：
  ```java
          if (requiredHeaders != null) {
              if (headers == null) {
                  throw new IllegalArgumentException(String.format("Required headers %s are set but no header is defined", Arrays.toString(requiredHeaders)));
              }
              if (headers.length > 0 && headers.length != requiredHeaders.length) {
                  throw new IllegalArgumentException(String.format("Required headers %s do not exactly match headers %s (build-time cross-check)", Arrays.toString(requiredHeaders), Arrays.toString(headers)));
              }
          }
  ```
- **为什么这样设计**：保护"手工模式不在 build 期做交叉检查"（E4/E5 双时机教训）。故障引入"名单必须与表头等长"的交叉检查——A3b（3 表头 × 2 必需列）当场被误杀。
- **期望看到的报错（实测）**：
  ```
  Required headers [date, amount] do not exactly match headers [date, amount, currency] (build-time cross-check)
  ```
- **连带变红**：无（A2 走保留分支抛同款 IAE；A3a 被 `headers.length > 0` 挡住）。

---

## 2. 表 B 组（parse 期决策点）——入口方法 `tableB_parsePhase`

### TC-B1 · 未设置必需列 → 解析零变化（B-R1 / D7 门卫）

- **注入点**：`createHeaders()` 校验块门卫，`CSVParser.java:684`
  定位：`grep -n "requiredHeaders != null && headerMap != null" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
          if (requiredHeaders != null && headerMap != null) {
  ```
- **注入后**：
  ```java
          if (headerMap != null) {
  ```
- **为什么这样设计**：B1 保护"特性关闭时校验块整体跳过"。故障拆掉 null 门卫——校验循环空转于 null 名单。
- **期望看到的报错（实测，JVM helpful NPE）**：
  ```
  java.lang.NullPointerException: Cannot read the array length because "requiredHeaders" is null
  ```
  ——报错直接点名 `requiredHeaders`：故障、保护意图、失败原因三者对上。
- **连带变红**：无（表 B 其余 14 个用例名单非空，门卫内外行为完全一致——全表最窄故障之一）。

### TC-B2a · 空列名结构错误先抛（B-R2 / D3 + E1）

- **注入点**：空名检查，`CSVParser.java:658`
  定位：`grep -n "blankHeader && !format.getAllowMissingColumnNames" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                      if (blankHeader && !format.getAllowMissingColumnNames()) {
  ```
- **注入后**：
  ```java
                      if (blankHeader && format.getAllowMissingColumnNames()) {
  ```
- **为什么这样设计**：保护"空列名被检出"。条件反转后默认配置（`false`）下空名永不抛错——空串进映射，必需列反而命中。
- **期望看到的报错（实测）**：
  ```
  Expected java.lang.IllegalArgumentException to be thrown, but nothing was thrown.
  ```
- **连带变红**：`TC-B2c`（与 B2a 数据完全相同：`date,,currency` + required=currency）。

### TC-B2b · 重复名结构错误先抛（B-R2 / D3 + E2）

- **注入点**：重复名检查，`CSVParser.java:665`
  定位：`grep -n "containsHeader && !duplicatesAllowed" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                      if (containsHeader && !duplicatesAllowed && !(blankHeader && emptyDuplicatesAllowed)) {
  ```
- **注入后**：
  ```java
                      if (false) {
  ```
- **为什么这样设计**：保护"重复名 IAE 先于必需列校验"。短路重复检测后，重复列 last-wins 进映射，最终抛的是 CSVException（缺 amount）——类型断言当场暴露优先级反转。
- **期望看到的报错（实测）**：
  ```
  Unexpected exception type thrown, expected: <java.lang.IllegalArgumentException> but was: <org.apache.commons.csv.CSVException>
  ```
- **连带变红**：无（全表只有 B2b 显式 DISALLOW + 重复数据）。

### TC-B2c · 结构错误优先与命中无关（B-R2 行 C4 = don't care）

- **注入点**：同 TC-B2a，`CSVParser.java:658`
- **注入后**：
  ```java
                      if (blankHeader && !format.getAllowMissingColumnNames() && format.getRequiredHeaders() == null) {
  ```
- **为什么这样设计**：B2c 实证"必需列全部命中也改变不了结构错误优先"。故障把空名检查变成"只有未启用必需列特性才抛"——一旦设了名单，结构错误就让位。
- **期望看到的报错（实测）**：
  ```
  Expected java.lang.IllegalArgumentException to be thrown, but nothing was thrown.
  ```
- **连带变红**：`TC-B2a`（同一保护面的另一侧；两个用例一起变红，实证它们保护同一段优先级逻辑）。

### TC-B3 · 命中判定复用 headerMap（B-R3 / D2 核心）

- **注入点**：命中判定行，`CSVParser.java:687`
  定位：`grep -n "containsKey(requiredHeader)" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                  if (!headerMap.containsKey(requiredHeader) && !missing.contains(requiredHeader)) {
  ```
- **注入后**：
  ```java
                  if (!missing.contains(requiredHeader)) {
  ```
- **为什么这样设计**：B3 保护"命中判定查的就是 get() 的那张表"。拆除 `containsKey` 后所有必需列都进缺失名单。
- **期望看到的报错（实测，error 形态）**：
  ```
  Missing required header(s) [date, amount, currency] in [date, amount, currency]
  ```
  ——两个名单一模一样，正是"判定不查表"的荒诞现场。
- **连带变红（7 个，实测与推演一致）**：`TC-B3a`、`TC-B4`、`TC-B5`、`TC-B6`、`TC-B7a`、`TC-B7b`——全部"部分/全部命中"的用例；而本来就缺列的 `TC-B7c/B7d/B7e/B7f` 在故障下报出的消息与预期完全一致，**保持绿**。影响面恰好等于"依赖命中侧"的集合——这是机械变异给不出的可推演连带面。

### TC-B3a · 手工表头 + skip → 对照手工名单（B-R3 / D5 + D9）

- **注入点**：skip 分支，`CSVParser.java:643`
  定位：`grep -n "if (format.getSkipHeaderRecord())" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                  if (format.getSkipHeaderRecord()) {
  ```
- **注入后**：
  ```java
                  if (false) {
  ```
- **为什么这样设计**：保护"skip 模式弃首行、对照手工名单"。skip 失效后 `DATE,AMT,CUR` 变成第一条数据记录。
- **期望看到的报错（实测）**：
  ```
  TC-B3a: 首条记录的 currency ==> expected: <USD> but was: <CUR>
  ```
- **连带变红**：无（表 B 只有 B3a 设了 `跳过表头行=true`）。

### TC-B4 · 默认大小写敏感（B-R4 / D2 + E6）

- **注入点**：map 工厂，`CSVParser.java:616-618`
  定位：`grep -n "getIgnoreHeaderCase() ?" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
          return format.getIgnoreHeaderCase() ?
                  new TreeMap<>(String.CASE_INSENSITIVE_ORDER) :
                  new LinkedHashMap<>();
  ```
- **注入后**：
  ```java
          return new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
  ```
- **为什么这样设计**：保护"默认走 LinkedHashMap 精确匹配"。故障恒用折叠表——B4 期望的缺失全部"命中"。
- **期望看到的报错（实测）**：
  ```
  Expected org.apache.commons.csv.CSVException to be thrown, but nothing was thrown.
  ```
- **连带变红（3 个，实测与推演一致）**：`TC-B3`、`TC-B3a`——TreeMap 同时改变了键迭代序（字母序 ≠ 文件序），表头映射键断言失败。大小写语义与映射实现是同一处代码的两个面；B5 本来就走 TreeMap、B6 的空白差异在折叠表下依然不命中，都保持绿。

### TC-B5 · 忽略大小写 → 命中（B-R5 / D2 + E6）

- **注入点**：同 TC-B4，`CSVParser.java:616-618`
- **注入后**：
  ```java
          return new LinkedHashMap<>();
  ```
- **为什么这样设计**：保护"ignoreHeaderCase=true 时折叠匹配"。故障无视配置恒走精确表——大小写命中消失。
- **期望看到的报错（实测，error 形态）**：
  ```
  Missing required header(s) [date, amount] in [Date, AMOUNT, currency]
  ```
- **连带变红**：无（其余 14 个用例默认就是 LinkedHashMap）。

### TC-B6 · 空白差异不 trim（B-R6 / D2 + E7）

- **注入点**：key 入表，`CSVParser.java:672`
  定位：`grep -n "headerMap.put(header" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                          headerMap.put(header, Integer.valueOf(i)); // Explicit boxing is intentional
  ```
- **注入后**：
  ```java
                          headerMap.put(header.trim(), Integer.valueOf(i)); // Explicit boxing is intentional
  ```
- **为什么这样设计**：保护"不引入第二套比较逻辑——不 trim"。key 入表即 trim，` currency ` 被抹平，缺失消失。
- **期望看到的报错（实测）**：
  ```
  Expected org.apache.commons.csv.CSVException to be thrown, but nothing was thrown.
  ```
- **连带变红**：无（其余用例表头无空白，trim 是空操作）。

### TC-B7a · 缺 1 列也要报（B-R7 / D1 最小形态）

- **注入点**：报错阈值，`CSVParser.java:691`
  定位：`grep -n "if (!missing.isEmpty())" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
              if (!missing.isEmpty()) {
  ```
- **注入后**：
  ```java
              if (missing.size() > 1) {
  ```
- **为什么这样设计**：保护"缺 1 列（最小缺失形态）也要报"。只报 >1 个缺失后，全部单缺失用例的 CSVException 消失。
- **期望看到的报错（实测）**：
  ```
  Expected org.apache.commons.csv.CSVException to be thrown, but nothing was thrown.
  ```
- **连带变红（4 个，实测与推演一致）**：`TC-B6`、`TC-B7e`、`TC-B7f`——"单缺失家族"；≥2 缺失的 B4/B7b/B7c/B7d 照常抛出且消息不变，保持绿。

### TC-B7b · 缺失名单按声明序（B-R7 / D1 消息确定性）

- **注入点**：遍历名单的 for，`CSVParser.java:686`
  定位：`grep -n "for (final String requiredHeader : requiredHeaders)" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
              for (final String requiredHeader : requiredHeaders) {
  ```
- **注入后**：
  ```java
              for (int ri = requiredHeaders.length - 1; ri >= 0; ri--) {
                  final String requiredHeader = requiredHeaders[ri];
  ```
- **为什么这样设计**：保护"名单按 setRequiredHeaders 声明序"。倒序遍历后缺失名单变逆序（B7b 变 `[currency, amount]`）。
- **期望看到的报错（实测）**：
  ```
  TC-B7b: 消息应包含 <Missing required header(s) [amount, currency] in [date]>，实际是 <Missing required header(s) [currency, amount] in [date]> ==> expected: <true> but was: <false>
  ```
- **连带变红（4 个，实测与推演一致）**：`TC-B4`、`TC-B7c`、`TC-B7d`——只有 ≥2 缺失的用例能看出顺序；单缺失用例顺序无感知，保持绿。

### TC-B7c · 缺全部 → 名单完整（B-R7 / D1）

- **注入点**：缺失累积，`CSVParser.java:688`
  定位：`grep -n "missing.add(requiredHeader);" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                      missing.add(requiredHeader);
  ```
- **注入后**：
  ```java
                      missing.add(requiredHeader);
                      break;
  ```
- **为什么这样设计**：保护"名单完整性：缺全部就列全部"。报完第一个就 break，B7c 的名单只剩 `[date]`。与 B7b 同落点不同侧面：一个破坏顺序、一个破坏完整性（连带面相同是推演结论，实测吻合）。
- **期望看到的报错（实测）**：
  ```
  TC-B7c: 消息应包含 <Missing required header(s) [date, amount, currency] in [foo, bar]>，实际是 <Missing required header(s) [date] in [foo, bar]> ==> expected: <true> but was: <false>
  ```
- **连带变红（4 个，实测与推演一致）**：同 TC-B7b。

### TC-B7d · 空文件不特判（B-R7 / D8）

- **注入点**：自动探测分支的首记录判空，`CSVParser.java:637-639`
  定位：`grep -n "final CSVRecord nextRecord = nextRecord();" src/main/java/org/apache/commons/csv/CSVParser.java`（取 `createEmptyHeaderMap` 之后的第一个）
- **注入前**：
  ```java
                  final CSVRecord nextRecord = nextRecord();
                  if (nextRecord != null) {
                      headerRecord = nextRecord.values();
  ```
- **注入后**：
  ```java
                  final CSVRecord nextRecord = nextRecord();
                  if (nextRecord == null) {
                      throw new IllegalArgumentException("A header name is missing in [] (empty input special-case)");
                  }
                  if (nextRecord != null) {
                      headerRecord = nextRecord.values();
  ```
- **为什么这样设计**：保护"空文件统一走'缺全部'（CSVException）而非特判"。故障给"首记录为 null"加专门 IAE——空文件从缺列错误变成结构错误，类型当场错位。
- **期望看到的报错（实测）**：
  ```
  Unexpected exception type thrown, expected: <org.apache.commons.csv.CSVException> but was: <java.lang.IllegalArgumentException: A header name is missing in [] (empty input special-case)>
  ```
- **连带变红**：无（表 B 只有 B7d 是零字节输入）。

### TC-B7e · 对照手工名单而非文件（B-R7 / D9）

- **注入点**：手工分支的名单赋值，`CSVParser.java:649`
  定位：`grep -n "headerRecord = formatHeader;" src/main/java/org/apache/commons/csv/CSVParser.java`
- **注入前**：
  ```java
                  headerRecord = formatHeader;
  ```
- **注入后**：
  ```java
                  final CSVRecord fileRecord0 = !format.getSkipHeaderRecord() ? nextRecord() : null;
                  headerRecord = fileRecord0 != null ? fileRecord0.values() : formatHeader;
  ```
- **为什么这样设计**：保护"对照对象是手工名单"。故障让非 skip 的手工模式去文件首行"偷看"——B7e 的文件首行恰好有 currency，缺失消失、解析成功。
- **期望看到的报错（实测）**：
  ```
  Expected org.apache.commons.csv.CSVException to be thrown, but nothing was thrown.
  ```
- **连带变红**：无（B3a 设了 skip 不受影响；其余用例都是自动模式）。

### TC-B7f · 名单重复 → 报缺失时去重（B-R7 / D7）

- **注入点**：同 TC-B3，`CSVParser.java:687`
- **注入后**：
  ```java
                  if (!headerMap.containsKey(requiredHeader)) {
  ```
- **为什么这样设计**：保护"名单自身重复不特判、报缺失时去重保序"。拆掉 `!missing.contains` 去重后，重复的 currency 进缺失列表两次。
- **期望看到的报错（实测）**：
  ```
  TC-B7f: 消息应包含 <Missing required header(s) [currency] in [date, amount]>，实际是 <Missing required header(s) [currency, currency] in [date, amount]> ==> expected: <true> but was: <false>
  ```
- **连带变红**：无（全表只有 B7f 名单带重复——与 B1 并列的全表最窄故障）。

---

## 3. 表 C 组（print 期决策点）——入口方法 `tableC_printPhase`

### TC-C1 · 打印不校验必需列（C-R1 / D4）

- **注入点**：`CSVPrinter` 构造器表头输出，`CSVPrinter.java:120-121`
  定位：`grep -n "printRecord((Object\[\]) format.getHeader())" src/main/java/org/apache/commons/csv/CSVPrinter.java`
- **注入前**：
  ```java
          if (format.getHeader() != null && !format.getSkipHeaderRecord()) {
              this.printRecord((Object[]) format.getHeader());
  ```
- **注入后**：
  ```java
          if (format.getRequiredHeaders() != null) {
              throw new IllegalArgumentException("Required headers must not be set for printing");
          }
          if (format.getHeader() != null && !format.getSkipHeaderRecord()) {
              this.printRecord((Object[]) format.getHeader());
  ```
- **为什么这样设计**：保护"写方向不消费必需列（表头是输出物不是断言）"。故障在打印构造期新增 required 校验——正是 C1 唯一禁止的行为。
- **期望看到的报错（实测）**：
  ```
  java.lang.IllegalArgumentException: Required headers must not be set for printing
  ```
- **连带变红**：无（表 C 只有这一个用例）。

---

## 4. 修正记录（如实陈述）

第一轮全量运行 19/22，三处与推演不符，均已修正并在第二轮全量验证通过：

1. **TC-A1 故障点更换**：第一版打在 Builder 字段默认值（`:267 = new String[0]`），实测 `ExceptionInInitializerError`——`CSVFormat` 的静态构造也走 Builder，D6 把非 null 默认值当配置矛盾在类初始化期拒绝，表 A 6/6 全红。连带面与"从未调用 setter"的保护意图无关，判为不合格语义故障，改打 getter null 契约（连带面 = 3 个 getter 断言用例）。这条意外揭示了代码事实：**Builder 默认值参与 CSVFormat 类初始化，任何非 null 默认都会被 D6 在静态构造期拦截**。
2. **TC-A1a-empty / TC-A1a-null 期望片段修正**：预判失败在 getter `assertNull`，实测失败更早——未归一的名单在 `builder.get()` 被 D6 拦截（消息 `Required headers [] ...` / `[?] ...`）。故障与连带面推演本就正确，修正的只是"失败发生在哪一层"的预测。

**未发生**的情况：没有任何一个故障注入后目标 fixture 仍然绿（22/22 全部变红）。

## 5. 零残留与基线（实测）

- 每个循环 try/finally `git checkout -- <文件>` + 字节级还原校验，22/22 撤销干净；
- 全部循环后 `mvn test` 全量回归：`Tests run: 1025, Failures: 0, Errors: 0, Skipped: 11`（与 ch04 基线一致）；
- 工作区终态：`M pom.xml`（RAT 豁免一行，照 `**/*.approved.md` 先例）+ untracked `fault-injection/`，生产 Java 代码零改动。

## 6. 行号时效

以上行号对应 HEAD `9a1af060`。任何对 `CSVFormat.java` / `CSVParser.java` / `CSVPrinter.java` 的后续编辑都会使行号漂移——重跑各条的 grep 定位命令即可重新定位；自动化配方的 `original` 片段按"恰好出现一次"精确匹配，漂移时脚本安全中止（`preflight` 拦截），绝不错误注入。
