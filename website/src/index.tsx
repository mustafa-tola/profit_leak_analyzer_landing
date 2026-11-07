import "./index.css";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { App } from "./App";

const rootEl = document.getElementById("root");
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (rootEl) {
  const app = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  ) : (
    <App />
  );
  ReactDOM.createRoot(rootEl).render(app);
}
