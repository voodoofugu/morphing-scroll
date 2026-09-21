import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./theme.css";
import "./shell/top-bar.css";
import "./shell/chrome-scroll.css";
import "./dashboard.css";
import "./custom.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
