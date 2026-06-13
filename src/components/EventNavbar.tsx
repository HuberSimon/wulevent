import { Link, useLocation } from "react-router-dom";
import "./EventNavbar.css";
import { useAuth } from "../context/AuthContext";
import { useEvent } from "../context/EventContext";

export default function EventNavbar() {
  const location = useLocation();
  const { activeEventId } = useEvent();
  const { user } = useAuth();

  const isLoggedIn = !!user;

  if (!activeEventId) return null;

  

  return (
    <nav className="event-navbar">
      <div className="event-navbar-container">

        {isLoggedIn && (
          <Link
            to={`/dashboard`}
            className={location.pathname === `/dashboard` ? "active" : ""}
          >
            Meine <br /> Veranstaltungen
          </Link>
        )}

        <Link
          to={`/event/${activeEventId}`}
          className={location.pathname === `/event/${activeEventId}` ? "active" : ""}
        >
          🏠
          <span>Organisation</span>
        </Link>

        <Link
          to={`/event/${activeEventId}/moments`}
          className={location.pathname.includes("moments") ? "active" : ""}
        >
          📷
          <span>Memories</span>
        </Link>

        <Link
          to={`/event/${activeEventId}/board`}
          className={location.pathname.includes("board") ? "active" : ""}
        >
          📌
          <span>Pinwand</span>
        </Link>

      </div>
    </nav>
  );
}