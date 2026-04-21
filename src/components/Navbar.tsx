import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const location = useLocation();
  const { user, logout } = useAuth();

  const showLogin = location.pathname !== "/login" && !user;
  const isHome = location.pathname === "/";

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        

        <Link className="logo" to="/" onClick={closeMenu}>
          {isHome ? (
            "Wulevent"
          ) : (
            <img 
              src="/images/we_logo.png" 
              alt="Wulevent Logo" 
              className="logo-img"
            />
          )}
        </Link>

        <div className="menu-container">

          {user && (
            <div className="user-info">
              {user.displayName}
            </div>
          )}

          {!user ? (
            showLogin && (
              <Link to="/login" className={`login-btn ${open ? "hide" : ""}`}>
                Login
              </Link>
            )
          ) : (
            <button className={`logout-btn ${open ? "hide" : ""}`} onClick={handleLogout}>
              Logout
            </button>
          )}

          <div className={`burger ${open ? "open" : ""}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className={`overlay ${open ? "show" : ""}`} onClick={closeMenu}></div>

          <div className={`menu ${open ? "active" : ""}`}>
            {!user && (
              <Link className="home" to="/" onClick={closeMenu}>
                Home
              </Link>
            )}
            
            {user && (
              <Link to="/dashboard" onClick={closeMenu}>
                Meine Events
              </Link>
            )}

            <Link to="/publicevents" onClick={closeMenu}>Public Events</Link>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;