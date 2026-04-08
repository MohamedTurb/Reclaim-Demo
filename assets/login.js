(function loginPageInit() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMeInput = document.getElementById("rememberMe");

  if (!form || !emailInput || !passwordInput || !rememberMeInput) {
    return;
  }

  const rememberedEmail = localStorage.getItem("reclaimRememberedEmail");
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMeInput.checked = true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      window.ReclaimErrorHandler?.showNotification?.("Please enter email and password.", "warning");
      return;
    }

    const validEmail = "collector@reclaim.com";
    const validPassword = "reclaim123";

    if (email !== validEmail || password !== validPassword) {
      window.ReclaimErrorHandler?.showNotification?.("Invalid login details. Try the demo credentials.", "error");
      return;
    }

    if (rememberMeInput.checked) {
      localStorage.setItem("reclaimRememberedEmail", email);
    } else {
      localStorage.removeItem("reclaimRememberedEmail");
    }

    sessionStorage.setItem("reclaimAuthenticated", "true");
    window.ReclaimErrorHandler?.showNotification?.("Login successful. Redirecting...", "success");

    setTimeout(() => {
      const returnTo = sessionStorage.getItem("reclaimReturnTo") || "index.html";
      sessionStorage.removeItem("reclaimReturnTo");
      window.location.href = returnTo;
    }, 300);
  });
})();
