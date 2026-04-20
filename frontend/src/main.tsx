import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="573841353319-6slcg7vlpii3558tsm0bhbplc8c3g80i.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
