import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./store/AppContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import DetectItem from "./pages/DetectItem";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="grid-bg" style={{ minHeight: "100vh" }}>
          <Navbar />
          <Routes>
            <Route path="/"       element={<Dashboard />} />
            <Route path="/detect" element={<DetectItem />} />
          </Routes>
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1c24",
              color: "#E8ECF3",
              border: "1px solid #252a35",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
            },
            success: { iconTheme: { primary: "#00D68F", secondary: "#0b0e12" } },
            error:   { iconTheme: { primary: "#F97316", secondary: "#fff" } },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
