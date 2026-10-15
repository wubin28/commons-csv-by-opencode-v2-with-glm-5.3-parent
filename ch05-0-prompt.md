当前目录为

```
@/Users/binwu/OOR/my-lab/commons-csv-by-opencode-v2-with-glm-5.3
```

。请按照下面的要求完成任务，并在你每一次停下来等待我回复你的澄清问题时，将上一次追加前你我之间的完整对话（包括下面的Round 0）以markdown格式追加到

```
<DIALOGS>.md（可以使用./ch05-1-dialogs.md）
```

文件（如果这个文件不存在，就新建）末尾，以便我在回复你的问题前仔细阅读。下面是要求：

## 1. Round 0（假设体检）

在开始设计树之前，先执行 Round 0（假设体检）。

1.1 列出我下面要求里没有明说、但你已默认成立的假设（逐条编号，形如：A1、A2、A3……）；
1.2 列出你还缺哪些关键信息，并说明每条信息会如何改变你的方案（逐条编号，形如：M1、M2、M3……）；
1.3 指出人们处理这类问题时最常犯的一个错误；
1.4 只提一个最关键的问题 —— 这个问题要能帮你搞清我的真实目标和具体处境，而并非最后给我一份谁都能套用的通用建议。这个问题的格式如下：

```
❓ **Q0** - **<问题标题>**: <问题正文，可能包含多个段落及选项>

➡️ <你的建议答案>
```

## 2. 推进设计树

Round 0 只问上述这一个问题，不要提前问别的。我回答后，你再按追问的常规轮次（frontier / 编号问题 / 推荐答案）推进设计树，直到前沿清空。

## 3. 追问

按下面追问的要求追问我的诉求：

---
名称: 追问
描述: 针对某项计划、决策或想法，对用户进行深入且严密的追问。适用于用户希望压力测试其思路，或使用了任何触发"追问"模式的关键词句时。
---

对用户进行持续、深入的追问，直到双方达成共识。将此过程构建为一棵**决策树**：每一项决策都会衍生出后续相关的决策分支。

按**轮次**推进这棵树的构建。**前沿（frontier）**指的是那些前提条件已确定的决策——即你可以**立即**提问、而无需猜测尚未获知答案的问题。在每一轮中，提出"前沿"上的所有问题：为每个问题编号并给出你的建议答案。随后等待用户回答，再进入下一轮。

每个问题的格式应如下所示：

```
❓ **Q1** - **<问题标题>**: <问题正文，可能包含多个段落及选项>

➡️ <你的建议答案>
```

用户在每一轮的回答都会重塑决策树：已确定的决策会将"前沿"向外推进，并解锁那些依赖于这些决策的问题。重新计算"前沿"并进行下一轮提问。如果某个问题的答案依赖于本轮中尚未确定的另一个问题，则该问题应归入**后续**轮次，而非当前轮次。

发掘**事实**是你的职责，绝非用户的职责。当"前沿"上的某个问题需要获取环境（如文件系统、工具等）中的事实信息时，应指派子代理（sub-agent，如果有的话）去查找；切勿向用户询问你自己就能查到的信息。不要因此停滞不前：正在进行的探索属于尚未确定的前提条件，因此只有依赖于该探索结果的后续问题才需要等待子代理的报告；你可以立即提出"前沿"上的其他问题。**决策**权在于用户：将每一项决策提交给用户，并等待其回应。

## 4. 我的诉求

你是一名资深软件测试工程师。你的任务分两个阶段：**阶段 A** 产出一份方案设计文档并给出推荐；**阶段 B**（在方案确定后）按推荐方案完成 fault injection testing 实现，并产出一份手工故障注入指南文档。如果你是在非交互式、单轮执行的环境里运行（无法等待人工确认再继续），**直接采用你自己推荐的方案继续阶段 B**，不要中途停下来等待批准。

### 阶段 A：方案设计

请为我设计 3 个"故障注入测试"（Fault Injection Testing）方案，目标代码库和背景信息如下：

- **代码库路径**：

```
<COMMONS_CSV_REPO_PATH>（即上一章使用的./commons-csv）
```

（本机 macOS，终端环境为 iTerm2 zsh）

- **要保护的验收测试所对应的“Step 7：把每条规则转成验收测试用例”所在的 decision table 文档**：

```
<DECISION_TABLE_DOC_PATH>（即第 3 章的产出ch03-3-decision-tables.md）
```

- **这些测试对应生产代码的调试指南**（里面列出了每个测试命中的生产代码类名、行号、断点、变量）：

```
<DEBUG_GUIDE_FOR_APPROVED_SCENARIOS_DOC_PATH>（即上一章的产出ch04-3-debug-guide-for-approved-scenarios.md））
```

- **这套设施的用途定位**：

```
<USAGE_SCOPE>
```

（如果留空，请你自己提出一个合理的区分维度并说明理由，然后在问题前沿里征询我的意见）

- **方案区分维度偏好**：

```
<DIFFERENTIATION_DIMENSION>
```

（如果留空，请你自己提出一个合理的区分维度并说明理由，然后在问题前沿里征询我的意见）

- **自动化脚本实现语言偏好**：

```
<IMPLEMENTATION_LANGUAGE>
```

（如果留空，请结合代码库的构建工具自行判断并说明理由，然后在问题前沿里征询我的意见）

- **自动化校验严格程度偏好**：

```
<VALIDATION_STRICTNESS>
```

（如果留空，请你自己判断并说明理由，然后在问题前沿里征询我的意见）

#### 背景知识：什么是故障注入测试

你可能不熟悉"故障注入测试"这个方法，本提示词末尾的"附录"里已经附上了完整的参考资料，请先阅读附录内容，再开始设计方案。核心要点提前说明：

> 故障注入测试的核心目的，是在生产代码里**人为、有针对性地**引入一个错误（故障），让某个自动化测试因此运行失败，并验证这个失败的报错信息确实与该测试本应保护的那一段生产代码行为相关；然后撤销这个人为引入的错误，再次运行该测试，观察它恢复变绿。如果整个"变红→报错信息对应→变绿"的闭环都成立，就证明这个测试确实在保护对应的生产代码，而并非形同虚设的空测试。

**这个方法最容易踩的坑**：把"故障注入"做成随机的、机械的代码变异（比如随手把 `&&` 改成 `||`，或者把 `>` 改成 `>=`），而并非针对"这个测试到底想保护什么行为"去精心设计一个语义对应的故障。机械变异只能笼统证明"测试能检测到某种变化"，回答不了"这个特定测试是否确实在保护这一行具体逻辑"这个问题。你设计的 3 个方案都应该围绕"故障要与测试的保护意图语义对应"这个原则展开，而并非推荐纯随机变异工具。

#### 在设计方案之前，你必须先做的事实核查

不要凭空假设代码库的现状，请先：

1. 读一遍上述调试指南，了解每个测试对应的生产代码位置、断点、变量。
2. 实际打开上述代码库下对应的生产代码文件，核实 debugging guide 里提到的类名、行号、代码逻辑目前是否仍然准确（代码可能已经变动，guide 里的行号可能已经漂移）。如果你没有直接读取本地文件系统的能力，请在文档里明确声明"以下内容基于 debugging guide 原文，未做本地代码核实，正式实现前请用 `grep -n` 重新核实行号"，不要假装自己核实过。
3. 检查代码库的构建配置文件（如 Java 项目的 `pom.xml`/`build.gradle`），确认是否已经集成了某种变异测试框架（如 PITest）。这个事实会影响你在"方案二"里描述的优劣势（如果已经集成了，那么"方案二：引入变异测试框架"的实现成本会大幅降低，需要如实调整该方案的优劣势描述）。

把你的事实核查结果写在文档最前面的"背景与已确认的前提"小节里，再开始设计 3 个方案。

#### 任务要求

请设计 **3 个方案**，用于在上述代码库里，针对上述 decision table 文档的“Step 7：把每条规则转成验收测试用例”所对应的验收测试做故障注入测试，需要同时满足两个用途：

1. **自动化脚本**：依次对每个测试，在其对应生产代码里注入一个与该测试保护意图语义对应的故障，让该测试运行失败；验证失败时的报错信息确实与该测试所保护的生产代码行为相关；然后撤销故障，重新运行该测试，确认它变绿。这个"注入→验证变红→撤销→验证变绿"的闭环要能做成可重复执行的自动化脚本。
2. **手工调试资料**：为每一个测试提供一份人类可读的"故障注入信息"，包含：生产代码的类名+行号、注入前代码示例、注入后代码示例、注入后运行该测试时期望看到的报错信息。这份资料是给我在 VSCode 里用 debug 单步执行的方式手工注入故障、观察测试失败用的，目的是加深我对相关生产代码逻辑的理解。

3 个方案应该按上述方案区分维度偏好互相区分（即每个方案代表一种不同的"故障怎么注入、怎么撤销"的技术路线），而并非互相之间只是"故障点多少""脚本拆分方式"这类表面差异。

#### 输出格式（严格遵守，这是让文档质量达标的关键）

请把 3 个备选方案以及你的一个推荐方案及其推荐理由的最终产出保存为一份 markdown 文件，路径为：

```
<SOLUTIONS_FOR_FAULT_INJECTION_DOC_PATH>（可以使用./ch05-2-solutions-for-fault-injection.md）
```

。文件结构必须是：每个方案一节（主要内容/优势/至少3条/劣势/至少2条/适用场景/不适用场景），最后一节"推荐方案"逐条对应"背景与已确认的前提"里的具体决策给出理由。

#### 方案写作质量要求

- 每个方案的"优势"和"劣势"必须具体到这个方案自己的实现细节上（比如提到会不会改动构建配置文件、会不会引入新依赖、撤销故障的具体手段是什么、报错信息的可读性如何），不要写"简单""复杂""灵活""不灵活"这类没有信息量的形容词而不给出原因。
- "适用场景"和"不适用场景"必须是互补的、具体的条件判断，而并非同一句话正反说两遍。
- 3 个方案的"优势/劣势"之间要能相互印证——如果方案一的优势是"不改构建配置文件"，那么其他把这一点作为劣势的方案就应该明确提到"需要改动构建配置文件"，保持前后一致，不要自相矛盾。
- 推荐方案的理由要逐条对应"背景与已确认的前提"里的具体决策，不要写泛泛而谈的总结性理由。
- 全文使用中文，专有名词（类名、方法名、工具名）保留英文原文。
- 不要在方案设计阶段直接动手实现（不要去改生产代码、不要创建除了这份 markdown 文档之外的任何文件）。文档写完之后，等待我确认选哪个方案，再进入实现阶段。

### 阶段 B：实现与产出手工故障注入指南

方案确定后，请按推荐方案实现自动化脚本，并产出手工故障注入指南（

```
<FAULT_INJECTION_GUIDE_DOC_PATH>（可以使用./ch05-3-fault-injection-guide.md）
```

）——每条包含生产代码的类名+行号、注入前代码、注入后代码、注入后运行该测试时期望看到的报错信息。如果某个故障注入后测试依然是绿的，请如实说明"为什么这个故障不会让测试变红"，不要隐瞒或者悄悄换一个更容易触发失败的故障。

# 附录：Fault Injection Testing（故障注入测试）方法参考资料

> 以下内容摘自 GeeksforGeeks 词条《Fault Injection Testing - Software Engineering》，供你在不具备外部检索能力的情况下直接参考，不需要再去网上查找。

Fault injection is a technique used in software engineering to test the resilience of a software system. The idea is to intentionally introduce errors or faults into the system to see how it reacts and to identify potential weaknesses. This can be achieved in several ways, such as:

1. **Hardware faults:** This involves physically altering hardware components to induce faults.
2. **Software faults:** This involves intentionally introducing errors into the code, such as incorrect data or incorrect logic.
3. **Network faults:** This involves simulating network conditions, such as latency, packet loss, and congestion, to see how the system reacts.

## What is Fault Injection Testing?

**Fault Injection** is a technique for enhancing the **testing quality** by involving intentional faults in the software. Fault injection is often used in **Stress Testing**, and it is considered an important part of developing robust software. The broadcast of a fault through to a noticeable failure follows a well-defined cycle. During execution, a fault can cause an error that is not a valid state within a system boundary.

The same error can cause further errors within the system boundary, hence each new error acts as a fault, and it may propagate to the system boundary and be observable. When an error state is observed at the system boundary, that is called a failure.

The Fault Injection process follows a **Fault-Error-Failure Cycle**, which includes these steps:

1. **Fault:** Deliberate errors are introduced into the code, either during compile-time or run-time.
2. **Error:** These faults cause the software to act incorrectly, leading to unexpected behavior.
3. **Failure:** Eventually, the errors cause the software to fail, such as a service crash or system outage.

This cycle helps identify weaknesses in the system and improves its design for better performance and resilience.

## Types of Fault Injection Testing

Fault injection can be categorized into two types based on software implementation:

### 1. Compile-time fault injection

Compile-time fault injection is a fault injection technique in which source code is modified to inject imitated faults into a system. Two methods are used to implement faults at compile time:

- **Code Modification:** Mutation testing is used to change existing lines of code so that there may exist faults. Code mutation produces faults that are similar to the faults unintentionally made by programmers.

  **Example:**

  ```
  Original Code:
  int main()
  {
    int a = 10;
    while ( a > 0 )
    {
      cout << "GFG";
      a = a - 1;
    }
    return 0;
  }
  ```

  ```
  Modified Code:
  int main()
  {
    int a = 10;
    while ( a > 0 )
    {
      cout << "GFG";
      a = a + 1; // '-' is changed to '+'
    }
    return 0;
  }
  ```

  Now it can be observed that the value of `a` will increase and the `while` loop will never terminate, so the program will go into an infinite loop.

- **Code Insertion:** A second method of code mutation is code insertion fault injection, which adds code instead of modifying existing code. This is basically done by the use of anxiety functions, which are simple functions that take an existing value and change it via some logic into another value.

  **Example:**

  ```
  Original Code:
  int main()
  {
    int a = 10;
    while ( a > 0 )
    {
      cout << "GFG";
      a = a - 1;
    }
    return 0;
  }
  ```

  ```
  Modified Code:
  int main()
  {
    int a = 10;
    while ( a > 0 )
    {
      cout << "GFG";
      a = a - 1;
      a++; // Additional code
    }
    return 0;
  }
  ```

  Now it can be observed that the value of `a` will be fixed and the `while` loop will never terminate, so the program will go into an infinite loop.

### 2. Run-time fault injection

Run-time fault injection technique uses a software trigger to inject a fault into a running software system. Faults can be injected via a number of physical methods, and triggers can be implemented in different ways. Software triggers used in run-time fault injection:

```
1. Time Based Triggers
2. Interrupt Based Triggers
```

3 methods are used to inject faults at run-time:

1. **Corrupting memory space:** This method involves corrupting main memory and processor registers.
2. **System call interposition:** This method is related to fault imitation from operating system kernel interfaces to executing system software. This is done by intercepting operating system calls made by user-level software and injecting faults into them.
3. **Network level:** This method is related to the corrupting, loss, or reordering of network packets at the network interface.

**Fault Injection in Different Software Testing:**

- **Robustness Testing** - In robustness testing, fault injection is used.
- **Stress Testing** - Fault injection is also used in stress testing.

## Advantages of Fault Injection

1. **Improved resilience:** By testing the system's resilience to faults, the software development team can identify potential weaknesses and make improvements to ensure the system is more robust.
2. **Increased reliability:** By intentionally introducing faults, the software development team can identify and resolve potential issues before they occur in production.
3. **Improved debugging:** By intentionally introducing faults, the software development team can more easily identify and debug issues, as the cause of the problem is known.

## Disadvantages of Fault Injection

1. **Increased complexity:** Fault injection can add complexity to the software development process, making it more difficult for new developers to understand and contribute.
2. **Increased cost:** Fault injection can be an expensive process, as additional resources may be needed to simulate faults and monitor the system's behavior.
3. **Time-consuming:** Fault injection can take significant time and effort, as the software development team must carefully plan and execute the tests.

## When to Use Fault Injection in Software Testing?

Fault Injection is particularly useful when testing software systems that rely on external services, third-party APIs, or are deployed across multiple platforms. It helps assess how the system handles issues or disruptions in these external dependencies.

It is also valuable during the early stages of the software development process (SDLC) to identify potential failure points in a controlled environment, before the software is released to production.

## Fault Injection Tools

There are several tools available to automate Fault Injection testing. Some of the widely used ones include:

- **Xception**
- **beStorm**
- **Holodeck**
- **Grid-FIT**
- **Orchestra**
- **ExhaustiF**
- **The Mu Service Analyzer**

(这些现成工具大多面向硬件级/网络级/大型分布式系统的故障注入，不一定适合你当前要处理的"单元测试级、代码行级"故障注入场景——设计方案时请不要简单照搬这个工具列表，而是围绕"代码库 + 自动化测试"这个具体场景来设计。)

## Conclusion

Software Fault Injection is an important testing method that helps evaluate how software handles unexpected errors, ensuring it's robust and reliable. It's especially useful for complex systems that depend on external services or run across multiple platforms. By injecting faults in a controlled environment, developers can see how the software reacts to stress and fix any vulnerabilities before the software is released.

While Fault Injection is valuable, it requires careful planning since it can disrupt normal operations and needs changes to the source code. Despite these challenges, it offers important insights into the software's reliability, making it a powerful tool to improve its quality and performance.