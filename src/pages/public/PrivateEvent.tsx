import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventById } from "../../services/database/private-event-service";
import { addRSVP, getRSVPs } from "../../services/database/rsvp-service";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./PrivateEvent.css";

const PrivateEvent = () => {
  const { id } = useParams();
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendees, setAttendees] = useState<any[]>([]);

  // PASSWORD ACCESS
  const [inputPassword, setInputPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState("");

  // MODALS
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // RSVP
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(1);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("yes");

  // PASSWORD EDIT
  const [newPassword, setNewPassword] = useState("");

  const [copied, setCopied] = useState(false);
  const [alreadyRSVP, setAlreadyRSVP] = useState(false);

  const rsvpKey = `rsvp-${id}`;

  // LOAD EVENT
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const eventData = await getEventById(id);
      const rsvps = await getRSVPs(id);

      setEvent({
        ...eventData,
        showAttendees: eventData?.showAttendees ?? true
      });

      setAttendees(rsvps);

      if (localStorage.getItem(rsvpKey)) {
        setAlreadyRSVP(true);
      }
    };

    load();
  }, [id]);

  // scroll lock
  useEffect(() => {
    document.body.style.overflow = showRSVPModal || showPasswordModal
      ? "hidden"
      : "auto";
  }, [showRSVPModal, showPasswordModal]);

  if (!event) return <h1>Lade Event...</h1>;

  const isCreator = user && event.creatorId === user.uid;
  const canAccess = isCreator || accessGranted || !event?.password;

  const checkPassword = () => {
    if (inputPassword === event.password) {
      setAccessGranted(true);
      setError("");
    } else {
      setError("Falsches Passwort");
    }
  };

  // COPY LINK
  const handleCopyLink = async () => {
    const link = `${window.location.origin}/event/${id}`;
    await navigator.clipboard.writeText(link);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // RSVP
  const handleRSVP = async () => {
    if (!name) return alert("Bitte Name eingeben");

    const exists = attendees.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) return alert("Name existiert bereits");

    await addRSVP(id!, { name, guests, comment, status });

    const updated = await getRSVPs(id!);
    setAttendees(updated);

    localStorage.setItem(rsvpKey, "true");
    setAlreadyRSVP(true);

    setName("");
    setGuests(1);
    setComment("");
    setShowRSVPModal(false);
  };

  const toggleAttendeesVisibility = async () => {
    const newValue = !(event.showAttendees ?? true);

    await updateDoc(doc(db, "private-events", id!), {
      showAttendees: newValue
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvent((prev: any) => ({
      ...prev,
      showAttendees: newValue
    }));
  };

  const handlePasswordUpdate = async () => {
    await updateDoc(doc(db, "private-events", id!), {
      password: newPassword
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvent((prev: any) => ({
      ...prev,
      password: newPassword
    }));

    setNewPassword("");
    setShowPasswordModal(false);
  };

  // 🔒 PASSWORD SCREEN
  if (!canAccess) {
    return (
      <div className="password-screen">
        <h1>🔒 Event geschützt</h1>

        <input
          type="password"
          placeholder="Passwort eingeben"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
        />

        <button onClick={checkPassword}>
          Zugriff freischalten
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="event-container">

      {/* HERO */}
      <div className="event-hero">

        <div className="hero-left">
          <h1 className="event-title">{event.title}</h1>

          {isCreator && (
            <div className="creator-panel">

              <div className="creator-actions">
                <button className="copy-link-btn" onClick={handleCopyLink}>
                  {copied ? "✅ Kopiert!" : "🔗 Link für Einladung kopieren"}
                </button>

                <button className="toggle-btn" onClick={toggleAttendeesVisibility}>
                  {event.showAttendees ? "👁 Teilnehmerliste sichtbar" : "🙈 Teilnehmerliste verborgen"}
                </button>
              </div>

              <div className="password-card">
                <h3>🔐 Sicherheit</h3>

                <div className="password-row">
                  <span>Passwort:</span>
                  <strong>{event.password || "Keins gesetzt"}</strong>
                </div>

                <button
                  className="edit-password-btn"
                  onClick={() => setShowPasswordModal(true)}
                >
                  ✏️ Passwort ändern
                </button>
              </div>

            </div>
          )}
        </div>

        <img
          className="event-img"
          src="/images/geburtstag.png"
          alt=""
        />

        <div className="overlay"></div>
      </div>

      {/* CONTENT */}
      <div className="event-content">
        <p>{event.description}</p>

        {!alreadyRSVP && (
          <button
            className="open-rsvp-btn"
            onClick={() => setShowRSVPModal(true)}
          >
            Rückmelden
          </button>
        )}

        {alreadyRSVP && <span>✅ Erfolgreich zurückgemeldet!</span>}
      </div>

      {/* ATTENDEES */}
      {(event.showAttendees || isCreator) && (
        <div className="attendees">
          <h2>Teilnehmer</h2>

          {attendees.map((a) => (
            <div key={a.id} className="attendee">
              <strong>{a.name}</strong>
              <span>{a.status === "yes" ? "✅" : "❌"}</span>
              <span>{a.guests} Personen</span>
              {a.comment && <p>{a.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* RSVP MODAL */}
      {showRSVPModal && ( 
        <div className="modal-overlay" onClick={() => setShowRSVPModal(false)}> 
          <div className="modal" onClick={(e) => e.stopPropagation()}> 
            <div className="modal-close" onClick={() => setShowRSVPModal(false)}> 
              ✖ 
            </div> 
            <h2>Teilnehmen</h2> 
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /> 
            <input type="number" min="1" value={guests} onChange={(e) => setGuests(Number(e.target.value))} /> 
            <textarea placeholder="Kommentar" value={comment} onChange={(e) => setComment(e.target.value)} /> 
              <div className="rsvp-buttons"> 
                <button onClick={() => setStatus("yes")} className={status === "yes" ? "active yes" : ""}>
                  ✅ Komme
                </button> 
                <button onClick={() => setStatus("no")} className={status === "no" ? "active no" : ""}>
                  ❌ Absage
                </button> 
              </div> 
              <button onClick={handleRSVP}> Absenden </button> 
              </div> 
            </div> 
          )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-close" onClick={() => setShowPasswordModal(false)}>
              ✖
            </div>

            <h2>🔐 Passwort ändern</h2>

            <p>
              Aktuell: <strong>{event.password || "Keins gesetzt"}</strong>
            </p>

            <input
              type="text"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="rsvp-buttons">
              <button onClick={() => setShowPasswordModal(false)}>
                Abbrechen
              </button>

              <button className="active" onClick={handlePasswordUpdate}>
                Speichern
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateEvent;