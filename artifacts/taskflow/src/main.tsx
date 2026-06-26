import { setBaseUrl } from "@workspace/api-client-react";  // ✅ import

setBaseUrl(import.meta.env.VITE_API_URL ?? "http://localhost:3000"); // ✅ CALL IT HERE

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);