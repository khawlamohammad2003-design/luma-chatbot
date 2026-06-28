import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Leads from "./Leads.jsx";
import Login from "./Login.jsx";
import LeadProfile from "./LeadProfile.jsx";

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("luma_admin") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        {/* Chatbot */}
        <Route path="/" element={<App />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          }
        />

        {/* Lead Profile */}
        <Route
          path="/lead/:id"
          element={
            <ProtectedRoute>
              <LeadProfile />
            </ProtectedRoute>
          }
        />

        {/* أي رابط غير موجود */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);