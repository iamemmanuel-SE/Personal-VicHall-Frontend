import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import SignUpPage from "./SignUpPage";
import Login from "./Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
