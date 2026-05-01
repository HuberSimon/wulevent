import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getEventById } from "../../services/database/private-event-service";
import { saveInvitedEvent } from "../../services/database/private-event-service";
import { addRSVP, getRSVPs } from "../../services/database/rsvp-service";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./PrivateEvent.css";
import { getUser } from "../../services/database/user-service";

const PrivateEvent = () => {
  const { id } = useParams();
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendees, setAttendees] = useState<any[]>([]);

  const [inputPassword, setInputPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(() => {
    return sessionStorage.getItem(`event-access-${id}`) === "true";
  });
  const [error, setError] = useState("");

  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [guests, setGuests] = useState(1);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("yes");

  const [newPassword, setNewPassword] = useState("");

  const [copied, setCopied] = useState(false);
  const [alreadyRSVP, setAlreadyRSVP] = useState(false);

  const rsvpKey = `rsvp-${id}`;
  const eventLink = `${window.location.origin}/event/${id}`;
  const isLoggedIn = !!user;
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const eventData = await getEventById(id);
      const rsvps = await getRSVPs(id);

      if (!eventData) return;


      if(isLoggedIn){
        const userDB = await getUser(user.uid);
        if (userDB) {
          setFirstName(userDB.firstName);
          setLastName(userDB.lastName);
        }
      }
      

      setEvent({
        ...eventData,
        showAttendees: eventData?.showAttendees ?? true
      });

      setAttendees(rsvps);

      if (localStorage.getItem(rsvpKey)) {
        setAlreadyRSVP(true);
      }

      if (user && user.uid !== eventData.creatorId) {
        try {
          await saveInvitedEvent(user.uid, id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          console.log("Event evtl. schon gespeichert");
        }
      }
    };

    load();
  }, [id, user]);

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
      sessionStorage.setItem(`event-access-${id}`, "true");
      setError("");
    } else {
      setError("Falsches Passwort");
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/event/${id}`;

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not supported");
      }

      await navigator.clipboard.writeText(link);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

    } catch (err) {
      console.error("Copy failed:", err);

      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRSVP = async () => {
    if (!firstName) return alert("Bitte Vorname eingeben");
    if (!lastName) return alert("Bitte Nachname eingeben");

    const exists = attendees.find(
      (a) => a.firstName.toLowerCase() === firstName.toLowerCase() && a.lastName.toLowerCase() === lastName.toLowerCase()
    );

    if (exists) return alert("Name existiert bereits");

    await addRSVP(id!, { firstName, lastName, guests, comment, status });

    const updated = await getRSVPs(id!);
    setAttendees(updated);

    localStorage.setItem(rsvpKey, "true");
    setAlreadyRSVP(true);

    setFirstName("");
    setLastName("");
    setGuests(1);
    setComment("");
    setShowRSVPModal(false);
  };

  const toggleAttendeesVisibility = async () => {
    if (!id) return;

    const currentValue = event?.showAttendees ?? true;
    const newValue = !currentValue;

    try {
      await updateDoc(doc(db, "private-events", id), {
        showAttendees: newValue
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvent((prev: any) => ({
        ...prev,
        showAttendees: newValue
      }));

    } catch (error) {
      console.error("Failed to update visibility:", error);
    }
  };

  const handlePasswordUpdate = async () => {
    await updateDoc(doc(db, "private-events", id!), {
      password: newPassword
    });
    console.log("open modal clicked")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvent((prev: any) => ({
      ...prev,
      password: newPassword
    }));

    setNewPassword("");
    setShowPasswordModal(false);
  };

  if (!canAccess) {
    return (
      <div className="password-screen">
        <h1>🔒 Veranstaltung geschützt</h1>

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

          {isLoggedIn && (
            <div className="event-features">

                <button className="event-board-btn" onClick={() => navigate(`/event/${id}/board`)}>
                  Pinnwand
                </button>

                <button className="event-post-btn" onClick={() => navigate(`/event/${id}/moments`)}>
                  Momente
                </button>

            </div>
          )}



        </div>

        <img
          className="event-img"
          src={event?.imagePath || "/images/sonstige-veranstaltung.png"}
          alt=""
        />

        <div className="overlay"></div>
      </div>

      <div className="event-content">
        <p>{event.description}</p>

        <div className="event-content-right">
          {!alreadyRSVP && !isCreator && (
            <button
              className="open-rsvp-btn"
              onClick={() => setShowRSVPModal(true)}
            >
              Rückmelden
            </button>
          )}

          {alreadyRSVP && !isCreator && <span>✅ Erfolgreich zurückgemeldet!</span>}

          {!isLoggedIn && !isCreator && (
            <button
              className="login-save-btn"
              onClick={() => {
                localStorage.setItem("redirectEvent", id!);
                navigate("/login");
              }}
            >
              Einloggen & Event speichern
            </button>
          )}

          {isCreator && eventLink &&  (
            <div className="qr-section">
              <QRCodeCanvas
                value={eventLink}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
          )}
        </div>

      </div>

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

      {showRSVPModal && (
        <div className="modal-overlay" onClick={() => setShowRSVPModal(false)}>
          <div className="rsvp-modal" onClick={(e) => e.stopPropagation()}>

            <div className="rsvp-header">
              <h2>🎉 Rückmeldung</h2>
              <p>Sag uns kurz ob du kommst</p>

              <button className="rsvp-modal-close" onClick={() => setShowRSVPModal(false)}>
                ✖
              </button>
            </div>

            <div className="rsvp-body">

              {firstName === "" && (<input
                placeholder="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />)}

              {lastName === "" && (<input
                placeholder="Nachname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />)}

              <input
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                placeholder="Anzahl Personen"
              />

              <textarea
                placeholder="Kommentar (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="rsvp-choice">
                <button
                  className={status === "yes" ? "active yes" : ""}
                  onClick={() => setStatus("yes")}
                >
                  ✅ Ich komme
                </button>

                <button
                  className={status === "no" ? "active no" : ""}
                  onClick={() => setStatus("no")}
                >
                  ❌ Leider nicht
                </button>
              </div>

              <button className="rsvp-submit" onClick={handleRSVP}>
                Absenden
              </button>

            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
              ✖
            </button>

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

            <div className="modal-save">
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