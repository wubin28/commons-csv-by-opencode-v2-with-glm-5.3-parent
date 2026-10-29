/* 共享步进播放器引擎：由每个场景页面的 SCENARIO 配置驱动。
 * 依赖：全局 mermaid（UMD）、html2canvas、jspdf（页面内 <script> 引入）。
 */
(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  async function initScenarioPlayer(SCENARIO) {
    const state = {
      current: -1, // -1 = 尚未开始
      autoplay: null,
      speed: 1,
      vars: {}, // 累积变量快照
      lineEls: [],
      textEls: [],
    };

    const diagramContainer = $("#diagram-container");
    const explainCode = $("#explain-code");
    const explainStmt = $("#explain-stmt");
    const explainWhy = $("#explain-why");
    const varsBody = $("#vars-body");
    const progressEl = $("#progress");
    const phaseBadge = $("#phase-badge");
    const stepListEl = $("#step-list");

    // 1) 渲染 Mermaid 时序图
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        background: "#ffffff",
        primaryColor: "#e8f0ff",
        primaryTextColor: "#1f2430",
        primaryBorderColor: "#2f6fed",
        lineColor: "#5b6472",
        actorBorder: "#2f6fed",
        actorBkg: "#eef4ff",
        actorTextColor: "#1f2430",
        signalColor: "#1f2430",
        signalTextColor: "#1f2430",
        noteBkgColor: "#fff3bf",
        noteBorderColor: "#e8590c",
        noteTextColor: "#5c4a00",
        sequenceNumberColor: "#ffffff",
      },
      sequence: {
        showSequenceNumbers: false,
        wrap: false,
        messageFontSize: 13,
        actorFontSize: 13,
        noteFontSize: 12,
      },
    });

    const renderId = "mmd-" + SCENARIO.id;
    const { svg } = await mermaid.render(renderId, SCENARIO.diagramDefinition);
    diagramContainer.innerHTML = svg;

    const svgEl = diagramContainer.querySelector("svg");
    svgEl.style.height = "auto";

    // 2) 建立 line/text 索引（按 DOM 出现顺序配对，与 mermaid 消息绘制顺序一致）
    state.lineEls = $all(".messageLine0, .messageLine1", svgEl);
    state.textEls = $all(".messageText", svgEl);

    // 3) 构建步骤列表侧栏
    SCENARIO.steps.forEach((step, i) => {
      const item = document.createElement("div");
      item.className = "step-item";
      item.dataset.idx = String(i);
      item.innerHTML =
        '<span class="idx">' + (i + 1) + '</span><span>' +
        '<span class="phase-badge ' + step.phase + '" style="margin-right:6px;">' +
        ({ given: "given", when: "when", then: "then" }[step.phase]) +
        "</span>" + escapeHtml(step.title || step.label) + "</span>";
      item.addEventListener("click", () => goTo(i));
      stepListEl.appendChild(item);
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }[c]));
    }

    function clearHighlight() {
      state.lineEls.forEach((el) => el.classList.remove("step-active-line"));
      state.textEls.forEach((el) => el.classList.remove("step-active-text"));
    }

    function highlightStep(i) {
      clearHighlight();
      const step = SCENARIO.steps[i];
      if (!step || !step.label) return;
      const idx = state.textEls.findIndex(
        (el) => el.textContent.trim() === step.label.trim()
      );
      if (idx >= 0) {
        state.textEls[idx].classList.add("step-active-text");
        if (state.lineEls[idx]) state.lineEls[idx].classList.add("step-active-line");
        const target = state.textEls[idx];
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    function updateVars(i) {
      const prevKeys = new Set(Object.keys(state.vars));
      const changed = new Set();
      for (let k = 0; k <= i; k++) {
        const v = SCENARIO.steps[k].vars;
        if (!v) continue;
        Object.keys(v).forEach((key) => {
          if (k === i) changed.add(key);
          state.vars[key] = v[key];
        });
      }
      varsBody.innerHTML = "";
      Object.keys(state.vars).forEach((key) => {
        const tr = document.createElement("tr");
        if (changed.has(key)) tr.className = "changed";
        tr.innerHTML =
          "<td>" + escapeHtml(key) + "</td><td class=\"val\">" +
          escapeHtml(state.vars[key]) + "</td>";
        varsBody.appendChild(tr);
      });
    }

    function render(i) {
      const step = SCENARIO.steps[i];
      highlightStep(i);
      explainCode.textContent = step.code || "";
      explainStmt.textContent = step.stmt || "";
      explainWhy.innerHTML = step.why || "";
      phaseBadge.textContent = { given: "Given", when: "When", then: "Then" }[step.phase];
      phaseBadge.className = "phase-badge " + step.phase;
      progressEl.textContent = "第 " + (i + 1) + " / " + SCENARIO.steps.length + " 步";
      // 重建累积变量（简单起见每次从头重算，步骤数量不大，性能足够）
      state.vars = {};
      updateVars(i);
      $all(".step-item", stepListEl).forEach((el, idx) => {
        el.classList.toggle("active", idx === i);
      });
      const activeItem = stepListEl.querySelector(".step-item.active");
      if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
      updateNavButtons();
    }

    function goTo(i) {
      if (i < 0) i = 0;
      if (i >= SCENARIO.steps.length) i = SCENARIO.steps.length - 1;
      state.current = i;
      render(i);
    }

    function next() {
      if (state.current < SCENARIO.steps.length - 1) goTo(state.current + 1);
      else stopAutoplay();
    }
    function prev() {
      if (state.current > 0) goTo(state.current - 1);
    }
    function reset() {
      stopAutoplay();
      clearHighlight();
      state.current = -1;
      state.vars = {};
      varsBody.innerHTML = "";
      explainCode.textContent = "";
      explainStmt.textContent = "点击“下一步”或按 → 键开始播放。";
      explainWhy.textContent = "";
      phaseBadge.textContent = "";
      phaseBadge.className = "phase-badge";
      progressEl.textContent = "第 0 / " + SCENARIO.steps.length + " 步";
      $all(".step-item", stepListEl).forEach((el) => el.classList.remove("active"));
      updateNavButtons();
    }
    function jumpPhase(phase) {
      const idx = SCENARIO.steps.findIndex((s) => s.phase === phase);
      if (idx >= 0) goTo(idx);
    }

    function updateNavButtons() {
      $("#btn-prev").disabled = state.current <= 0;
      $("#btn-next").disabled = state.current >= SCENARIO.steps.length - 1;
    }

    function startAutoplay() {
      stopAutoplay();
      if (state.current >= SCENARIO.steps.length - 1) goTo(0);
      state.autoplay = setInterval(() => {
        if (state.current >= SCENARIO.steps.length - 1) { stopAutoplay(); return; }
        next();
      }, 1400 / state.speed);
      $("#btn-play").textContent = "⏸ 暂停";
    }
    function stopAutoplay() {
      if (state.autoplay) { clearInterval(state.autoplay); state.autoplay = null; }
      $("#btn-play").textContent = "▶ 自动播放";
    }
    function toggleAutoplay() {
      if (state.autoplay) stopAutoplay(); else startAutoplay();
    }

    // 4) 绑定控件
    $("#btn-prev").addEventListener("click", prev);
    $("#btn-next").addEventListener("click", next);
    $("#btn-reset").addEventListener("click", reset);
    $("#btn-play").addEventListener("click", toggleAutoplay);
    $("#speed-select").addEventListener("change", (e) => {
      state.speed = parseFloat(e.target.value);
      if (state.autoplay) startAutoplay();
    });
    $("#jump-given").addEventListener("click", () => jumpPhase("given"));
    $("#jump-when").addEventListener("click", () => jumpPhase("when"));
    $("#jump-then").addEventListener("click", () => jumpPhase("then"));
    $("#btn-present").addEventListener("click", togglePresentation);

    function togglePresentation() {
      document.body.classList.toggle("presentation");
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { next(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
      else if (e.key.toLowerCase() === "r") { reset(); }
      else if (e.key.toLowerCase() === "p") { togglePresentation(); }
    });

    // 5) 导出
    $("#export-png").addEventListener("click", () => exportDiagramPNG(svgEl, SCENARIO.id));
    $("#export-pdf").addEventListener("click", () => exportDiagramPDF(svgEl, SCENARIO.id));
    $("#export-step-png").addEventListener("click", () => exportStepPNG(SCENARIO.id));

    function exportDiagramPNG(svgNode, id) {
      const wasHighlighted = $all(".step-active-line, .step-active-text", svgNode);
      wasHighlighted.forEach((el) => el.classList.remove("step-active-line", "step-active-text"));
      svgToPngBlob(svgNode).then((blob) => {
        downloadBlob(blob, id + "-diagram.png");
        if (state.current >= 0) highlightStep(state.current);
      });
    }

    function exportDiagramPDF(svgNode, id) {
      const wasHighlighted = $all(".step-active-line, .step-active-text", svgNode);
      wasHighlighted.forEach((el) => el.classList.remove("step-active-line", "step-active-text"));
      svgToPngDataUrl(svgNode).then(({ dataUrl, width, height }) => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: width >= height ? "landscape" : "portrait",
          unit: "pt",
          format: [width, height],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        pdf.save(id + "-diagram.pdf");
        if (state.current >= 0) highlightStep(state.current);
      });
    }

    function exportStepPNG(id) {
      const capture = $("#step-capture");
      html2canvas(capture, { backgroundColor: "#ffffff", scale: 2 }).then((canvas) => {
        canvas.toBlob((blob) => {
          downloadBlob(blob, id + "-step-" + (state.current + 1) + ".png");
        });
      });
    }

    function svgToPngDataUrl(svgNode) {
      return new Promise((resolve) => {
        const clone = svgNode.cloneNode(true);
        const bbox = svgNode.getBBox ? svgNode.viewBox.baseVal : null;
        const width = (bbox && bbox.width) || svgNode.width.baseVal.value || svgNode.clientWidth || 1000;
        const height = (bbox && bbox.height) || svgNode.height.baseVal.value || svgNode.clientHeight || 600;
        clone.setAttribute("width", width);
        clone.setAttribute("height", height);
        clone.style.background = "#ffffff";
        const rectBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rectBg.setAttribute("x", "0");
        rectBg.setAttribute("y", "0");
        rectBg.setAttribute("width", "100%");
        rectBg.setAttribute("height", "100%");
        rectBg.setAttribute("fill", "#ffffff");
        clone.insertBefore(rectBg, clone.firstChild);
        const xml = new XMLSerializer().serializeToString(clone);
        const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
        const img = new Image();
        img.onload = () => {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ dataUrl: canvas.toDataURL("image/png"), width, height });
        };
        img.src = svg64;
      });
    }

    function svgToPngBlob(svgNode) {
      return svgToPngDataUrl(svgNode).then(({ dataUrl }) => fetch(dataUrl).then((r) => r.blob()));
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    reset();
  }

  window.initScenarioPlayer = initScenarioPlayer;
})();
