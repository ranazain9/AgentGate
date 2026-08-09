import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { getEdgeToken } from "./lib/supabase";

// Eagerly initialize Supabase auth session so edge function calls are fast
getEdgeToken().catch((err) =>
  console.warn("Failed to init auth session:", err)
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);