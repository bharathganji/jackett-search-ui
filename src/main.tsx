import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="font-sans antialiased">
        <App />
        <Toaster />
      </div>
    </ThemeProvider>
  </StrictMode>
);
