import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";

const basename = import.meta.env.BASE_URL || "/";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <WishlistProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </WishlistProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);