const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldType = `  const [currentView, setCurrentView] = useState<
    | "landing"
    | "login"
    | "signup"
    | "dashboard"
    | "verify-email"
    | "privacy"
    | "terms"
  >(() => {
    const path = window.location.pathname;
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/login") return "login";
    if (path === "/signup") return "signup";
    return "landing";
  });`;

const newType = `  const [currentView, setCurrentView] = useState<
    | "landing"
    | "login"
    | "signup"
    | "dashboard"
    | "verify-email"
    | "privacy"
    | "terms"
    | "about"
    | "safety"
    | "help"
    | "contact"
  >(() => {
    const path = window.location.pathname;
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/about") return "about";
    if (path === "/safety") return "safety";
    if (path === "/help") return "help";
    if (path === "/contact") return "contact";
    if (path === "/login") return "login";
    if (path === "/signup") return "signup";
    return "landing";
  });`;

code = code.replace(oldType, newType);

const oldAuthCheck1 = `        const path = window.location.pathname;
        if (path === "/privacy" || path === "/terms") {
          setCurrentView(path === "/privacy" ? "privacy" : "terms");`;

const newAuthCheck1 = `        const path = window.location.pathname;
        if (["/privacy", "/terms", "/about", "/safety", "/help", "/contact"].includes(path)) {
          setCurrentView(path.slice(1) as any);`;

code = code.replace(oldAuthCheck1, newAuthCheck1);

const oldAuthCheck2 = `              const path = window.location.pathname;
              if (path === "/privacy" || path === "/terms") {
                setCurrentView(path === "/privacy" ? "privacy" : "terms");
              } else {
                setCurrentView("dashboard");
              }`;

const newAuthCheck2 = `              const path = window.location.pathname;
              if (["/privacy", "/terms", "/about", "/safety", "/help", "/contact"].includes(path)) {
                setCurrentView(path.slice(1) as any);
              } else {
                setCurrentView("dashboard");
              }`;

code = code.replace(oldAuthCheck2, newAuthCheck2);

const oldPopState = `      const path = window.location.pathname;
      if (path === "/privacy") {
        setCurrentView("privacy");
      } else if (path === "/terms") {
        setCurrentView("terms");
      } else if (path === "/login") {
        setCurrentView("login");
      } else if (path === "/signup") {
        setCurrentView("signup");
      } else {`;

const newPopState = `      const path = window.location.pathname;
      if (["/privacy", "/terms", "/about", "/safety", "/help", "/contact"].includes(path)) {
        setCurrentView(path.slice(1) as any);
      } else if (path === "/login") {
        setCurrentView("login");
      } else if (path === "/signup") {
        setCurrentView("signup");
      } else {`;

code = code.replace(oldPopState, newPopState);

fs.writeFileSync('src/App.tsx', code);
console.log('Routes fixed');
