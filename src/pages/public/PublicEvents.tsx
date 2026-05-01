import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPublicEventsByCity
} from "../../services/database/public-event-service";
import "./PublicEvents.css";

const cities = ["Eggenfelden", "Mühldorf", "Burghausen", "Altötting", "Pfarrkirchen"];

const PublicEvent = () => {
  const [selectedCity, setSelectedCity] = useState("Eggenfelden");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const data = await getPublicEventsByCity(selectedCity);

      setEvents(data);
      setLoading(false);
    };

    load();
  }, [selectedCity]);

  return (
    <div className="public-container">

      <h1>🌍 Öffentliche Events</h1>
      <button className="create-button" onClick={() => navigate("/create-public-event")}>
        ➕ Event erstellen
      </button>

      <div className="divider" />

      <div className="city-selector">
        {cities.map((city) => (
          <button
            key={city}
            className={selectedCity === city ? "active" : ""}
            onClick={() => setSelectedCity(city)}
          >
            {city}
          </button>
        ))}
      </div>

      {loading && <p>Lade Events...</p>}

      {!loading && events.length === 0 && (
        <p>Keine Events in dieser Region 😴</p>
      )}

      <div className="event-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <span>📍 {event.city}</span>
            <span>📅 {event.date}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PublicEvent;