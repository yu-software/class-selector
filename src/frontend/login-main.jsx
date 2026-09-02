//This file is the responsible to be the entry point, and build the root component

import { createRoot } from "react-dom/client";
import LoginPage from "./LoginPage.jsx";

createRoot(document.getElementById("root")).render(<LoginPage />);
