(() => {
  const expressionEl = document.getElementById("calc-expression");
  const resultEl = document.getElementById("calc-result");
  const keypad = document.querySelector(".calc-keypad");
  const scientificPanel = document.getElementById("calc-scientific");
  const modeToggle = document.getElementById("calc-mode-toggle");
  const calcCard = document.getElementById("calc-card");

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

    if (type === "scientific") {
      appendScientific(value);
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

  function appendScientific(value) {
    const map = {
      pi: String(Math.PI),
      "(": "(",
      ")": ")",
      sqrt: "Math.sqrt(",
      sq: "**2",
      inv: "**(-1)",
      sin: "Math.sin(",
      cos: "Math.cos(",
      tan: "Math.tan(",
    };
    const toAdd = map[value];
    if (toAdd !== undefined) {
      expression += toAdd;
      updateDisplay();
    }
  }

  function evaluateExpression() {
    if (!expression) return;
    try {
      const safeExpr = expression.replace(/\s/g, "");
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

  if (modeToggle && scientificPanel && calcCard) {
    modeToggle.addEventListener("click", () => {
      const on = modeToggle.getAttribute("aria-pressed") === "true";
      modeToggle.setAttribute("aria-pressed", !on);
      scientificPanel.hidden = on;
      calcCard.classList.toggle("scientific", !on);
    });
  }

  function handleKeypadClick(e) {
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
  }

  if (keypad) {
    keypad.addEventListener("click", handleKeypadClick);
  }
  if (scientificPanel) {
    scientificPanel.addEventListener("click", handleKeypadClick);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Delete") {
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

