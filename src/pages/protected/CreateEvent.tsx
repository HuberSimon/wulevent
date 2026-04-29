import { useState } from "react";
import { createEvent } from "../../services/database/private-event-service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./CreateEvent.css";

const eventTypeImages: Record<string, string> = {
  Geburtstag: "/images/geburtstag.png",
  Hochzeit: "/images/hochzeit.png",
  "sonstige Veranstaltung": "/images/default.png",
};

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("");
  const [password, setPassword] = useState("");
  const [showAttendees, setShowAttendees] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;

    if (!title || !description || !eventType) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    setLoading(true);

    try {
      const id = await createEvent({
        title,
        description,
        creatorId: user.uid,
        password,
        showAttendees,
        imagePath: eventTypeImages[eventType],
      });

      toast.success("Event erstellt 🎉");
      navigate(`/event/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Erstellen");
    }

    setLoading(false);
  };

  return (
    <div className="create-card">

      <h1 className="create-title">Event erstellen</h1>
      <p className="create-subtitle">
        Erstelle deine Einladung und teile sie mit deinen Gästen
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Veranstaltungs-Einladung"
      />

      {/* 🔽 EVENT TYP DROPDOWN */}
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      >
        <option value="">Veranstaltungs-Typ wählen</option>
        <option value="Geburtstag">🎂 Geburtstag</option>
        <option value="Hochzeit">💍 Hochzeit</option>
        <option value="sonstige Veranstaltung">🎉 Sonstige Veranstaltung</option>
      </select>

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Veranstaltungs-Passwort (optional)"
      />

      <div className="toggle-row">
        <span>Teilnehmerliste öffentlich</span>

        <label className="switch">
          <input
            type="checkbox"
            checked={showAttendees}
            onChange={(e) => setShowAttendees(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      <button
        className="primary-btn"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "Erstelle..." : "Erstellen"}
      </button>

    </div>
  );
};

export default CreateEventPage;