import React from "react";
import { createRoot } from "react-dom/client";

import Docs from "./Docs";
import "../theme.css";
import "../shell/top-bar.css";
import "../shell/chrome-scroll.css";
import "../custom.css";
import "./docs.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Docs />
  </React.StrictMode>,
);
