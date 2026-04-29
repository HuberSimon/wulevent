import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPublicEvent } from "../../services/database/public-event-service";
import toast from "react-hot-toast";
import "./CreatePublicEvent.css";

const cities = ["Eggenfelden", "München", "Berlin", "Hamburg"];

const CreatePublicEvent = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Eggenfelden");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title || !date) {
      return toast.error("Bitte Titel und Datum eingeben");
    }

    try {
      setLoading(true);

      await createPublicEvent({
        title,
        description,
        city,
        date,
      });

      toast.success("Event erstellt 🎉");

      navigate("/public-events"); // zurück zur Übersicht
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-public-container">

      <h1>🌍 Öffentliches Event erstellen</h1>

      <div className="form">

        <input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Beschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* CITY SELECT */}
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* DATE */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button onClick={handleCreate} disabled={loading}>
          {loading ? "..." : "Event erstellen"}
        </button>

      </div>

    </div>
  );
};

export default CreatePublicEvent;