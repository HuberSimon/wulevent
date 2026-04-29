import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { deleteEventCompletely } from "../../services/database/private-event-service";
import toast from "react-hot-toast";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invitedEvents, setInvitedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setLoading(true);

      const createdSnap = await getDocs(
        collection(db, "users", user.uid, "createdEvents")
      );

      const created = await Promise.all(
        createdSnap.docs.map(async (d) => {
          const eventId = d.id;

          const eventDoc = await getDoc(doc(db, "private-events", eventId));
          if (!eventDoc.exists()) return null;

          const eventData = eventDoc.data();

          const rsvpSnap = await getDocs(
            collection(db, "private-events", eventId, "attendees")
          );

          let count = 0;

          rsvpSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.status === "yes") {
              count += data.guests || 1;
            }
          });

          return {
            id: eventId,
            ...eventData,
            attendeeCount: count,
          };
        })
      );

      // =========================
      // INVITED EVENTS
      // =========================
      const invitedSnap = await getDocs(
        collection(db, "users", user.uid, "invitedEvents")
      );

      const invited = await Promise.all(
        invitedSnap.docs.map(async (d) => {
          const eventId = d.id;

          const eventDoc = await getDoc(doc(db, "private-events", eventId));
          if (!eventDoc.exists()) return null;

          const eventData = eventDoc.data();

          const rsvpSnap = await getDocs(
            collection(db, "private-events", eventId, "attendees")
          );

          let count = 0;

          rsvpSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.status === "yes") {
              count += data.guests || 1;
            }
          });

          return {
            id: eventId,
            ...eventData,
            attendeeCount: count,
          };
        })
      );

      setCreatedEvents(created.filter(Boolean));
      setInvitedEvents(invited.filter(Boolean));

      setLoading(false);
    };

    load();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();

    if (!user) return;
    if (!window.confirm("Event wirklich löschen?")) return;

    try {
      setDeletingId(eventId);

      await deleteEventCompletely(eventId, user.uid);

      setCreatedEvents((prev) => prev.filter((ev) => ev.id !== eventId));

      toast.success("Event gelöscht 🗑️");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard">

      <div className="dashboard-info">
        <h1>Hey {user?.displayName} 👋</h1>
        <p>Erstelle und verwalte deine Veranstaltungen</p>
      </div>

      <div className="divider" />

      {loading && <p>Lade Events...</p>}

      {/* =========================
          INVITED EVENTS
      ========================= */}
      <h2>Eingeladen</h2>

      {!loading && invitedEvents.length === 0 && (
        <div className="empty-state">
          <p>Noch in keine Veranstaltungen eingeladen...</p>
        </div>
      )}

      <div className="event-grid">
        {invitedEvents.map((event) => (
          <div
            key={event.id}
            className="event-card"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            <h3>{event.title}</h3>
            <p>{event.attendeeCount} Teilnehmer</p>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* =========================
          CREATED EVENTS
      ========================= */}
      <h2>Meine Veranstaltungen</h2>

      {!loading && createdEvents.length === 0 && (
        <div className="empty-state">
          <p>Noch keine Veranstaltung erstellt...</p>
        </div>
      )}

      <div className="event-grid">

        {createdEvents.map((event) => (
          <div
            key={event.id}
            className="event-card"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            <button
              className="delete-btn"
              onClick={(e) => handleDelete(e, event.id)}
              disabled={deletingId === event.id}
            >
              {deletingId === event.id ? "..." : "✕"}
            </button>

            <h3>{event.title}</h3>
            <p>{event.attendeeCount} Teilnehmer</p>
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