import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@react-mcp-spa/ui/global.css";
import "./playground.css";
import { Playground } from "./Playground.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
