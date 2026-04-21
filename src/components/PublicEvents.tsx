import { useEffect, useState } from "react";
import { EventService, type Event } from "../services/database/event-service";
import "./PublicEvents.css";

function PublicEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await EventService.getEvents();
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(data);
    };
    fetchEvents();
  }, []);

  return (
    <section className="public-events">
      <h1>Upcoming Events</h1>
      <div className="events-container">
        {events.map((event) => (
          <div key={event.id} className="event-box">
            <h2>{new Date(event.date).toLocaleDateString()}</h2>
            <h3>{event.name}</h3>
            <p>{event.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PublicEvents;