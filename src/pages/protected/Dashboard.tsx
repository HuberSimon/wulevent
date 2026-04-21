import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;

      const q = query(
        collection(db, "private-events"),
        where("creatorId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEvents(data);
    };

    loadEvents();
  }, [user]);

  return (
    <div className="dashboard">

      <div className="dashboard-info">
        <h1>Hey {user.displayName} 👋</h1>
        <p>
          <br></br>
          Hier kannst du private Events erstellen und mit deinen Freunden teilen.
        </p>
      </div>

      <div className="divider"></div>

      <div className="event-grid">

        {events.map(event => (
          <div
            key={event.id}
            className="event-card"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            <h3>{event.title}</h3>
            <p>{event.description}</p>
          </div>
        ))}

        <div
          className="add-card"
          onClick={() => navigate("/create-event")}
        >
          <span>+</span>
          <p>Event erstellen</p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;