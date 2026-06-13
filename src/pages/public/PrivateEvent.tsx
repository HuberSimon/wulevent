import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getEventById } from "../../services/database/private-event-service";
import { saveInvitedEvent } from "../../services/database/private-event-service";
import { addRSVP, getRSVPs, updateRSVPGroup } from "../../services/database/rsvp-service";
import { useAuth } from "../../context/AuthContext";
import { useEvent } from "../../context/EventContext";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./PrivateEvent.css";
import { getUser } from "../../services/database/user-service";

// ─── useTouchDragDrop ─────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const useTouchDragDrop = (
  isEnabled: boolean,
  onDrop: (attendeeId: string, targetGroup: string) => void
) => {
  const draggedId      = useRef<string | null>(null);
  const ghost          = useRef<HTMLElement | null>(null);
  const dragging       = useRef(false);
  const startPos       = useRef({ x: 0, y: 0 });
  const currentPos     = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame      = useRef<number | null>(null);
  const scrolling      = useRef(false);

  const LONG_PRESS = 400;
  const EDGE       = 120;
  const SPEED      = 18;

  // ── ghost ──────────────────────────────────────────────────────────────

  const createGhost = useCallback((el: HTMLElement, x: number, y: number) => {
    const rect = el.getBoundingClientRect();
    const g    = el.cloneNode(true) as HTMLElement;
    g.classList.add("drag-ghost");
    Object.assign(g.style, {
      position:      "fixed",
      left:          `${x}px`,
      top:           `${y}px`,
      width:         `${rect.width}px`,
      transform:     "translate(-50%, -50%) scale(1.04)",
      pointerEvents: "none",
      zIndex:        "99999",
      opacity:       "0.88",
    });
    document.body.appendChild(g);
    return g;
  }, []);

  const removeGhost = () => {
    ghost.current?.remove();
    ghost.current = null;
  };

  // ── autoscroll via rAF (avoids setInterval fighting the browser) ───────

  const stopAutoScroll = useCallback(() => {
    scrolling.current = false;
    if (animFrame.current !== null) {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = null;
    }
  }, []);

  const scrollStep = () => {
    if (!scrolling.current || !dragging.current) {
      stopAutoScroll();
      return;
    }

    const y = currentPos.current.y;

    const topZone = EDGE;
    const bottomZone = window.innerHeight - EDGE;

    let delta = 0;

    if (y < topZone) {
      delta = -SPEED * ((topZone - y) / topZone);
    } else if (y > bottomZone) {
      delta = SPEED * ((y - bottomZone) / EDGE);
    }

    if (delta !== 0) window.scrollBy(0, delta);

    animFrame.current = requestAnimationFrame(scrollStep);
  };

  const startAutoScroll = () => {
    if (scrolling.current) return;

    scrolling.current = true;
    animFrame.current = requestAnimationFrame(scrollStep);
  };

  // ── drop helpers ────────────────────────────────────────────────────────

  const getDropTarget = (x: number, y: number): string | null => {
    if (ghost.current) ghost.current.style.visibility = "hidden";
    const els = document.elementsFromPoint(x, y);
    if (ghost.current) ghost.current.style.visibility = "";

    for (const el of els) {
      const h = el as HTMLElement;
      if (h.classList.contains("group-box")) return h.dataset.group ?? null;
      if (h.classList.contains("attendees")) return "";
    }
    return null;
  };

  const updateHighlight = (x: number, y: number) => {
    document.querySelectorAll(".drop-highlight")
      .forEach(el => el.classList.remove("drop-highlight"));

    if (ghost.current) ghost.current.style.visibility = "hidden";
    const els = document.elementsFromPoint(x, y);
    if (ghost.current) ghost.current.style.visibility = "";

    for (const el of els) {
      const h = el as HTMLElement;
      if (h.classList.contains("group-box") || h.classList.contains("attendees")) {
        h.classList.add("drop-highlight");
        break;
      }
    }
  };

  // ── cleanup ─────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    dragging.current  = false;
    draggedId.current = null;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    stopAutoScroll();
    removeGhost();

    document.querySelectorAll(".drop-highlight")
      .forEach(el => el.classList.remove("drop-highlight"));

    // restore overscroll behaviour we may have set on scroll containers
    document.querySelectorAll<HTMLElement>(".attendees, .group-box").forEach(el => {
      el.style.overscrollBehavior = "";
    });
  }, [stopAutoScroll]);

  // ── global touch listeners ───────────────────────────────────────────────
  //
  // Key insight: we register { passive: false } on document so we can call
  // e.preventDefault() and block the browser's native scroll ONLY while a
  // drag is in progress. When not dragging we return early and never call
  // preventDefault, so normal page scroll is completely unaffected.

  useEffect(() => {
    if (!isEnabled) return;

    const onMove = (e: TouchEvent) => {
      // not dragging yet → let the browser scroll normally
      if (!dragging.current) return;

      // dragging → block native scroll so the page doesn't scroll under us
      e.preventDefault();

      const t = e.touches[0];
      currentPos.current = { x: t.clientX, y: t.clientY };

      if (ghost.current) {
        ghost.current.style.left = `${t.clientX}px`;
        ghost.current.style.top  = `${t.clientY}px`;
      }

      updateHighlight(t.clientX, t.clientY);
      startAutoScroll();
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging.current || !draggedId.current) { cleanup(); return; }

      const t      = e.changedTouches[0];
      const target = getDropTarget(t.clientX, t.clientY);
      if (target !== null) onDrop(draggedId.current, target);

      cleanup();
    };

    document.addEventListener("touchmove",   onMove, { passive: false });
    document.addEventListener("touchend",    onEnd,  { passive: true });
    document.addEventListener("touchcancel", onEnd,  { passive: true });

    return () => {
      document.removeEventListener("touchmove",   onMove);
      document.removeEventListener("touchend",    onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [isEnabled, onDrop, startAutoScroll, cleanup]);

  // ── per-card handlers ────────────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isEnabled) return;

      const touch  = e.touches[0];
      const target = e.currentTarget as HTMLElement;

      startPos.current   = { x: touch.clientX, y: touch.clientY };
      currentPos.current = { x: touch.clientX, y: touch.clientY };

      longPressTimer.current = setTimeout(() => {
        dragging.current  = true;
        draggedId.current = id;
        ghost.current     = createGhost(target, touch.clientX, touch.clientY);
        // autoscroll will kick in on first touchmove
      }, LONG_PRESS);
    },
    [isEnabled, createGhost]
  );

  // cancel long-press if finger wanders before threshold
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragging.current) return;

    const t  = e.touches[0];
    const dx = Math.abs(t.clientX - startPos.current.x);
    const dy = Math.abs(t.clientY - startPos.current.y);

    if ((dx > 8 || dy > 8) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel: handleTouchEnd,
  };
};

// ─── AttendeeCard ─────────────────────────────────────────────────────────────
interface AttendeeCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attendee: any;
  isCreator: boolean;
  onDelete: (id: string) => void;
  dragHandlers: {
    handleTouchStart:  (e: React.TouchEvent, id: string) => void;
    handleTouchMove:   (e: React.TouchEvent) => void;
    handleTouchEnd:    (e: React.TouchEvent) => void;
    handleTouchCancel: () => void;
    handleDragStart:   (e: React.DragEvent, id: string) => void;
  };
}

const AttendeeCard = ({ attendee, isCreator, onDelete, dragHandlers }: AttendeeCardProps) => (
  <div
    className="attendee"
    draggable={isCreator}
    onDragStart={(e) => dragHandlers.handleDragStart(e, attendee.id)}
    onTouchStart={(e) => dragHandlers.handleTouchStart(e, attendee.id)}
    onTouchMove={dragHandlers.handleTouchMove}
    onTouchEnd={dragHandlers.handleTouchEnd}
    onTouchCancel={dragHandlers.handleTouchCancel}
  >
    {isCreator && (
      <button
        className="delete-attendee"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Möchtest du diesen Teilnehmer wirklich entfernen?")) {
            onDelete(attendee.id);
          }
        }}
      >
        ✕
      </button>
    )}
    <strong>{attendee.firstName} {attendee.lastName}</strong>
    <span>{attendee.status === "yes" ? "✅" : "❌"}</span>
    <span>{attendee.guests} Personen</span>
    {attendee.comment && <p>{attendee.comment}</p>}
  </div>
);

// ─── PrivateEvent ─────────────────────────────────────────────────────────────
const PrivateEvent = () => {
  const { id }   = useParams();
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event,             setEvent]             = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendees,         setAttendees]         = useState<any[]>([]);
  const [groups,            setGroups]            = useState<string[]>([]);
  const [newGroup,          setNewGroup]          = useState("");
  const [inputPassword,     setInputPassword]     = useState("");
  const [accessGranted,     setAccessGranted]     = useState(() =>
    sessionStorage.getItem(`event-access-${id}`) === "true"
  );
  const [error,             setError]             = useState("");
  const [showRSVPModal,     setShowRSVPModal]     = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGroupInput,    setShowGroupInput]    = useState(false);
  const [firstName,         setFirstName]         = useState("");
  const [lastName,          setLastName]          = useState("");
  const [guests,            setGuests]            = useState(1);
  const [comment,           setComment]           = useState("");
  const [status,            setStatus]            = useState("yes");
  const [newPassword,       setNewPassword]       = useState("");
  const [copied,            setCopied]            = useState(false);
  const [alreadyRSVP,       setAlreadyRSVP]       = useState(false);

  const rsvpKey    = `rsvp-${id}`;
  const eventLink  = `${window.location.origin}/event/${id}`;
  const isLoggedIn = !!user;
  const navigate   = useNavigate();
  const isCreator  = !!(user && event?.creatorId === user.uid);
  const { setActiveEventId } = useEvent();

  // ── attendee move ──────────────────────────────────────────────────────

  const moveAttendee = useCallback(
    async (attendeeId: string, group: string) => {
      if (!id) return;
      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee || attendee.group === group) return;
      await updateRSVPGroup(id, attendeeId, group);
      setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, group } : a));
    },
    [id, attendees]
  );

  const touchHandlers = useTouchDragDrop(isCreator, moveAttendee);

  const handleDragStart = useCallback((e: React.DragEvent, attendeeId: string) => {
    e.dataTransfer.setData("id", attendeeId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const dragHandlers = {
    handleTouchStart:  touchHandlers.handleTouchStart,
    handleTouchMove:   touchHandlers.handleTouchMove,
    handleTouchEnd:    touchHandlers.handleTouchEnd,
    handleTouchCancel: touchHandlers.handleTouchCancel,
    handleDragStart,
  };

  // ── data load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [eventData, rsvps] = await Promise.all([getEventById(id), getRSVPs(id)]);
      if (!eventData) return;

      setActiveEventId(id);

      if (isLoggedIn && user) {
        const userDB = await getUser(user.uid);
        if (userDB) { setFirstName(userDB.firstName); setLastName(userDB.lastName); }
      }

      setEvent({ ...eventData, showAttendees: eventData?.showAttendees ?? true });
      setAttendees(rsvps);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setGroups([...new Set(rsvps.map((a: any) => a.group).filter(Boolean))] as string[]);
      if (localStorage.getItem(rsvpKey)) setAlreadyRSVP(true);

      if (user && user.uid !== eventData.creatorId) {
        try { await saveInvitedEvent(user.uid, id); } catch { /* already saved */ }
      }
    };
    load();
  }, [id, user, isLoggedIn, rsvpKey]);

  // lock body scroll only for modals, never during drag
  useEffect(() => {
    document.body.style.overflow = (showRSVPModal || showPasswordModal) ? "hidden" : "";
  }, [showRSVPModal, showPasswordModal]);

  // ── loading / access guard ─────────────────────────────────────────────

  if (!event) return <h1>Lade Event...</h1>;

  const canAccess = isCreator || accessGranted || !event?.password;

  if (!canAccess) {
    const checkPassword = () => {
      if (inputPassword === event.password) {
        setAccessGranted(true);
        sessionStorage.setItem(`event-access-${id}`, "true");
        setError("");
      } else {
        setError("Falsches Passwort");
      }
    };

    return (
      <div className="password-screen">
        <h1>🔒 Veranstaltung geschützt</h1>
        <input
          type="password"
          placeholder="Passwort eingeben"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkPassword()}
        />
        <button onClick={checkPassword}>Zugriff freischalten</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = eventLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRSVP = async () => {
    if (!firstName) return alert("Bitte Vorname eingeben");
    if (!lastName)  return alert("Bitte Nachname eingeben");

    const exists = attendees.find(
      a => a.firstName.toLowerCase() === firstName.toLowerCase() &&
           a.lastName.toLowerCase()  === lastName.toLowerCase()
    );
    if (exists) return alert("Name existiert bereits");

    await addRSVP(id!, { firstName, lastName, guests, comment, status });
    const updated = await getRSVPs(id!);
    setAttendees(updated);
    localStorage.setItem(rsvpKey, "true");
    setAlreadyRSVP(true);
    setFirstName(""); setLastName(""); setGuests(1); setComment("");
    setShowRSVPModal(false);
  };

  const toggleAttendeesVisibility = async () => {
    if (!id) return;
    const newValue = !(event?.showAttendees ?? true);
    try {
      await updateDoc(doc(db, "private-events", id), { showAttendees: newValue });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvent((prev: any) => ({ ...prev, showAttendees: newValue }));
    } catch (err) { console.error("Failed to update visibility:", err); }
  };

  const handlePasswordUpdate = async () => {
    await updateDoc(doc(db, "private-events", id!), { password: newPassword });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvent((prev: any) => ({ ...prev, password: newPassword }));
    setNewPassword("");
    setShowPasswordModal(false);
  };

  const handleDeleteAttendee = async (attendeeId: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "private-events", id, "attendees", attendeeId));
      setAttendees(prev => prev.filter(a => a.id !== attendeeId));
    } catch (err) { console.error("Teilnehmer löschen fehlgeschlagen:", err); }
  };

  const createGroup = () => {
    if (!newGroup.trim()) return;
    if (!groups.includes(newGroup)) setGroups(g => [...g, newGroup]);
    setNewGroup("");
  };

  const handleDropOnGroup = (e: React.DragEvent, group: string) => {
    e.preventDefault();
    const attendeeId = e.dataTransfer.getData("id");
    if (attendeeId) moveAttendee(attendeeId, group);
  };

  const handleDropUngroup = (e: React.DragEvent) => {
    e.preventDefault();
    const attendeeId = e.dataTransfer.getData("id");
    if (attendeeId) moveAttendee(attendeeId, "");
  };

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="event-container">

      {/* hero */}
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
                <button className="edit-password-btn" onClick={() => setShowPasswordModal(true)}>
                  ✏️ Passwort ändern
                </button>
              </div>
            </div>
          )}

        </div>

        <img
          className="event-img"
          src={event?.imagePath || "/images/sonstige-veranstaltung.png"}
          alt=""
        />
        <div className="overlay" />
      </div>

      {/* description */}
      <div className="event-content">
        <p>{event.description}</p>
        <div className="event-content-right">
          {!alreadyRSVP && !isCreator && (
            <button className="open-rsvp-btn" onClick={() => setShowRSVPModal(true)}>Rückmelden</button>
          )}
          {alreadyRSVP && !isCreator && <span>✅ Erfolgreich zurückgemeldet!</span>}
          {!isLoggedIn && !isCreator && (
            <button
              className="login-save-btn"
              onClick={() => { localStorage.setItem("redirectEvent", id!); navigate("/login"); }}
            >
              Einloggen & Event speichern
            </button>
          )}
          {isCreator && eventLink && (
            <div className="qr-section">
              <QRCodeCanvas value={eventLink} size={160} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
          )}
        </div>
      </div>

      {/* ungrouped attendees */}
      {(event.showAttendees || isCreator) && (
        <div
          className="attendees"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropUngroup}
        >
          <h2>Teilnehmer</h2>
          {isCreator && <p className="drag-hint">💡 Lang drücken zum Verschieben in Gruppen</p>}
          {attendees
            .filter(a => !a.group)
            .map(a => (
              <AttendeeCard
                key={a.id}
                attendee={a}
                isCreator={isCreator}
                onDelete={handleDeleteAttendee}
                dragHandlers={dragHandlers}
              />
            ))}
        </div>
      )}

      {/* groups */}
      {(isCreator || (event.showAttendees && groups.length > 0)) && (
        <div className="group-zone">
          <h2>Gruppen</h2>
          {isCreator && <p>Ziehe Teilnehmer hierher, um sie Gruppen zuzuordnen.</p>}
          <div className="groups">
            {groups.map(group => (
              <div
                key={group}
                className="group-box"
                data-group={group}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnGroup(e, group)}
              >
                <h3>{group}</h3>
                {attendees
                  .filter(a => a.group === group)
                  .map(a => (
                    <div key={a.id} className="group-person">
                      <AttendeeCard
                        attendee={a}
                        isCreator={isCreator}
                        onDelete={handleDeleteAttendee}
                        dragHandlers={dragHandlers}
                      />
                    </div>
                  ))}
              </div>
            ))}
            {isCreator && (
              <div className="group-add-card" onClick={() => setShowGroupInput(true)}>
                <span>+</span>
                <p>Gruppe erstellen</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RSVP modal */}
      {showRSVPModal && (
        <div className="modal-overlay" onClick={() => setShowRSVPModal(false)}>
          <div className="rsvp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rsvp-header">
              <h2>🎉 Rückmeldung</h2>
              <p>Sag uns kurz ob du kommst</p>
              <button className="rsvp-modal-close" onClick={() => setShowRSVPModal(false)}>✖</button>
            </div>
            <div className="rsvp-body">
              <input
                placeholder="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                placeholder="Nachname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="number" min={1} value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                placeholder="Anzahl Personen"
              />
              <textarea placeholder="Kommentar (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="rsvp-choice">
                <button className={status === "yes" ? "active yes" : ""} onClick={() => setStatus("yes")}>✅ Ich komme</button>
                <button className={status === "no"  ? "active no"  : ""} onClick={() => setStatus("no")}>❌ Leider nicht</button>
              </div>
              <button className="rsvp-submit" onClick={handleRSVP}>Absenden</button>
            </div>
          </div>
        </div>
      )}

      {/* password modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✖</button>
            <h2>🔐 Passwort ändern</h2>
            <p>Aktuell: <strong>{event.password || "Keins gesetzt"}</strong></p>
            <input
              type="text" placeholder="Neues Passwort" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="modal-save">
              <button className="active" onClick={handlePasswordUpdate}>Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* group input modal */}
      {showGroupInput && (
        <div className="modal-overlay" onClick={() => setShowGroupInput(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Neue Gruppe</h2>
            <input
              value={newGroup} placeholder="Gruppenname"
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { createGroup(); setShowGroupInput(false); } }}
            />
            <button onClick={() => { createGroup(); setShowGroupInput(false); }}>Erstellen</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrivateEvent;