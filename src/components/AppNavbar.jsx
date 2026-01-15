import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";
import { getStoredUser } from "../auth/authStore";

export default function AppNavbar() {
  const user = getStoredUser();

  if (!user) return <Navbar />; // guest navbar

  if (user.role === "admin") {
    return <AdminNavbar />;
  }

  return <Navbar />; // logged-in user navbar
}
