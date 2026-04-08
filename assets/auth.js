(function authGate() {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const isLoginPage = currentPage === "login.html";
  const isAuthenticated = sessionStorage.getItem("reclaimAuthenticated") === "true";
  const root = document.documentElement;

  const revealPage = () => {
    root.style.visibility = "";
  };

  const delayReveal = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", revealPage, { once: true });
    } else {
      revealPage();
    }
  };

  root.style.visibility = "hidden";

  if (isLoginPage) {
    if (isAuthenticated) {
      window.location.replace("index.html");
      return;
    }

    delayReveal();
    return;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem("reclaimReturnTo", window.location.href);
    window.location.replace("login.html");
    return;
  }

  delayReveal();

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-logout]");
    if (!logoutButton) {
      return;
    }

    event.preventDefault();
    sessionStorage.removeItem("reclaimAuthenticated");
    sessionStorage.removeItem("reclaimReturnTo");
    window.location.replace("login.html");
  });
})();
