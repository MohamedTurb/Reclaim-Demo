(function loginPageInit() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMeInput = document.getElementById("rememberMe");
  const passwordToggleButton = document.getElementById("passwordToggleBtn");
  const statusMessage = document.getElementById("loginStatus");
  const resetLink = document.getElementById("resetPasswordLink");

  if (!form || !emailInput || !passwordInput || !rememberMeInput || !statusMessage) {
    return;
  }

  const clearFieldState = () => {
    [emailInput, passwordInput].forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
  };

  const setStatus = (message, tone = "info") => {
    statusMessage.textContent = message;
    statusMessage.dataset.tone = tone;
    statusMessage.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  };

  const setInvalid = (input) => {
    input.setAttribute("aria-invalid", "true");
    input.focus();
  };

  if (passwordToggleButton) {
    passwordToggleButton.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      passwordToggleButton.setAttribute("aria-pressed", String(isHidden));
      passwordToggleButton.textContent = isHidden ? "Hide" : "Show";
    });
  }

  if (resetLink) {
    resetLink.addEventListener("click", () => {
      setStatus("Password reset email is opening in your mail app.", "info");
    });
  }

  const rememberedEmail = localStorage.getItem("reclaimRememberedEmail");
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMeInput.checked = true;
    passwordInput.focus();
  } else {
    emailInput.focus();
  }

  setStatus("Use the demo credentials or request a password reset.", "info");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFieldState();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      setStatus("Please enter both email and password.", "error");
      window.ReclaimErrorHandler?.showNotification?.("Please enter both email and password.", "warning");
      if (!email) {
        setInvalid(emailInput);
      } else {
        setInvalid(passwordInput);
      }
      return;
    }

    const validAccounts = {
      "collector@reclaim.com": { password: "reclaim123", role: "collector" },
      "admin@reclaim.com": { password: "admin123", role: "admin" }
    };
    const account = validAccounts[email];

    if (!account || account.password !== password) {
      setStatus("Invalid login details. Try the demo credentials shown below.", "error");
      window.ReclaimErrorHandler?.showNotification?.("Invalid login details. Try the demo credentials.", "error");
      setInvalid(emailInput);
      return;
    }

    if (rememberMeInput.checked) {
      localStorage.setItem("reclaimRememberedEmail", email);
    } else {
      localStorage.removeItem("reclaimRememberedEmail");
    }

    sessionStorage.setItem("reclaimAuthenticated", "true");
    sessionStorage.setItem("reclaimUserRole", account.role);
    setStatus("Login successful. Redirecting you now.", "success");
    window.ReclaimErrorHandler?.showNotification?.("Login successful. Redirecting...", "success");

    setTimeout(() => {
      const returnTo = sessionStorage.getItem("reclaimReturnTo") || "index.html";
      sessionStorage.removeItem("reclaimReturnTo");
      window.location.href = returnTo;
    }, 300);
  });
})();
