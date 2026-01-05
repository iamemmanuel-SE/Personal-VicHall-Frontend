import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import SignUpPage from "./SignUpPage";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import VerificationCode from "./VerificationCode";
import MainPage from "./MainPage";
import Events from "./Events";
import CheckoutPage from "./checkoutPage";
import TicketConfirmation from "./TicketConfirmation";
import TicketPage from "./TicketPage";
import AccountPage from "./AccountPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<VerificationCode />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<TicketConfirmation />} />
        <Route path="/ticket" element={<TicketPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
