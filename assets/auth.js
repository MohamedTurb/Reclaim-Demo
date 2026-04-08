(function authGate() {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const isLoginPage = currentPage === "login.html";
  const isAuthenticated = sessionStorage.getItem("reclaimAuthenticated") === "true";

  if (isLoginPage) {
    if (isAuthenticated) {
      window.location.replace("index.html");
    }
    return;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem("reclaimReturnTo", window.location.href);
    window.location.replace("login.html");
  }
})();
