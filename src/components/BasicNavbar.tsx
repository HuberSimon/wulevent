import { Link, useLocation } from "react-router-dom";
import "./BasicNavbar.css";
import { useAuth } from "../context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";

export default function BasicNavbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const showLogin = location.pathname !== "/login" && !user;

  return (
    <nav className="basic-navbar">
      <div className="basic-navbar-container">

        {/* LEFT */}
        <div className="left">
          <Link className="logo" to="/">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo-img"
            />
          </Link>
        </div>

        {/* RIGHT */}
        <div className="right">
          {user && <div className="user-info">{user.displayName}</div>}

          {!user ? (
            showLogin && (
              <Link to="/login" className="login-btn">
                Login
              </Link>
            )
          ) : (
            <button className="logout-btn" onClick={() => logout()}>
              Logout
            </button>
          )}

          <DarkModeToggle />
        </div>

      </div>
    </nav>
  );
}