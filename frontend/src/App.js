import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} language={language} setLanguage={setLanguage} />} />
        <Route path="/signup" element={<Signup isDarkMode={isDarkMode} toggleTheme={toggleTheme} language={language} setLanguage={setLanguage} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} language={language} setLanguage={setLanguage} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;