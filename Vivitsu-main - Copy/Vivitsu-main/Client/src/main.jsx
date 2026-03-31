import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./polyfills";
import "./index.css";
import App from "./App.jsx";
import { Analytics } from "@vercel/analytics/react";

const root = document.getElementById("root");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App className="transition-all" />
      <Analytics />
    </BrowserRouter>
  </StrictMode>
);
