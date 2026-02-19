import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18n

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="dalil-theme">
    <App />
  </ThemeProvider>,
);
