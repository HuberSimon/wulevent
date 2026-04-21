import { useState } from "react";
import { createEvent } from "../../services/database/private-event-service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./CreateEvent.css";

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [showAttendees, setShowAttendees] = useState(true);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const handleCreate = async () => {
    if (!user) return;

    if (!title || !description) {
      alert("Bitte Titel und Beschreibung eingeben");
      return;
    }

    setLoading(true);

    try {
      const eventId = await createEvent({
        title,
        description,
        image,
        creatorId: user.uid,
        showAttendees,
        password
      });

      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error(error);
      alert("Fehler beim Erstellen");
    }

    setLoading(false);
  };

  return (
    <div className="create-container">
      <h1>Veranstaltung erstellen</h1>

      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Bild URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />

      <textarea
        placeholder="Beschreibung"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="password"
        placeholder="Event Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="toggle-row">
        <span>Teilnehmer anzeigen</span>

        <label className="switch">
          <input
            type="checkbox"
            checked={showAttendees}
            onChange={(e) => setShowAttendees(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      <button onClick={handleCreate}>
        {loading ? "Erstelle..." : "Event erstellen"}
      </button>
    </div>
  );
};

export default CreateEventPage;