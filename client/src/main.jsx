import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App.jsx";

import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <ToastContainer
            // Clear of the Save buttons, which sit at the bottom left of the forms
            position="bottom-right"
            hideProgressBar
            closeButton={false}
            autoClose={3500}
            icon={false}
        />
    </StrictMode>,
);
