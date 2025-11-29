import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
// Polyfill global for libraries that expect it (common in crypto libs)
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
