(() => {
  const expressionEl = document.getElementById("calc-expression");
  const resultEl = document.getElementById("calc-result");
  const keypad = document.querySelector(".calc-keypad");

  let expression = "";
  let lastResult = null;

  function updateDisplay() {
    expressionEl.textContent = expression || "\u00A0";
    resultEl.textContent = lastResult !== null ? lastResult : "0";
  }

  function clearAll() {
    expression = "";
    lastResult = null;
    updateDisplay();
  }

  function backspace() {
    if (!expression) return;
    expression = expression.slice(0, -1);
    updateDisplay();
  }

  function appendValue(value, type) {
    if (type === "op") {
      if (!expression && lastResult !== null) {
        expression = String(lastResult);
      }
      if (!expression) return;
      if (/[+\-*/%]$/.test(expression)) {
        expression = expression.slice(0, -1) + value;
      } else {
        expression += value;
      }
      updateDisplay();
      return;
    }

    if (value === ".") {
      const parts = expression.split(/([+\-*/%])/);
      const last = parts[parts.length - 1];
      if (last && last.includes(".")) return;
    }

    expression += value;
    updateDisplay();
  }

  function evaluateExpression() {
    if (!expression) return;
    try {
      const safeExpr = expression.replace(/[^0-9+\-*/%.]/g, "");
      // eslint-disable-next-line no-eval
      let val = eval(safeExpr);
      if (typeof val === "number" && !Number.isNaN(val) && Number.isFinite(val)) {
        val = Math.round((val + Number.EPSILON) * 1e10) / 1e10;
        lastResult = val;
        updateDisplay();
      }
    } catch {
      resultEl.textContent = "Erreur";
    }
  }

  if (keypad) {
    keypad.addEventListener("click", (e) => {
      const btn = e.target.closest(".key");
      if (!btn) return;

      const action = btn.dataset.action;
      const value = btn.dataset.value;
      const type = btn.dataset.type;

      if (action === "clear") {
        clearAll();
        return;
      }

      if (action === "backspace") {
        backspace();
        return;
      }

      if (action === "equal") {
        evaluateExpression();
        return;
      }

      if (value) {
        appendValue(value, type);
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearAll();
      return;
    }

    if (e.key === "Backspace") {
      backspace();
      return;
    }

    if (e.key === "Enter" || e.key === "=") {
      e.preventDefault();
      evaluateExpression();
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      appendValue(e.key);
      return;
    }

    if (["+", "-", "*", "/", "%"].includes(e.key)) {
      appendValue(e.key, "op");
      return;
    }

    if (e.key === "." || e.key === ",") {
      appendValue(".");
    }
  });

  updateDisplay();
})();

