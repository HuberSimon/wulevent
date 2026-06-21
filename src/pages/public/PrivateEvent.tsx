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
import UnlockEvent from "../../components/UnlockEvent";

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
    if (y < topZone) delta = -SPEED * ((topZone - y) / topZone);
    else if (y > bottomZone) delta = SPEED * ((y - bottomZone) / EDGE);
    if (delta !== 0) window.scrollBy(0, delta);
    animFrame.current = requestAnimationFrame(scrollStep);
  };

  const startAutoScroll = () => {
    if (scrolling.current) return;
    scrolling.current = true;
    animFrame.current = requestAnimationFrame(scrollStep);
  };

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
    document.querySelectorAll(".drop-highlight").forEach(el => el.classList.remove("drop-highlight"));
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

  const cleanup = useCallback(() => {
    dragging.current  = false;
    draggedId.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    stopAutoScroll();
    removeGhost();
    document.querySelectorAll(".drop-highlight").forEach(el => el.classList.remove("drop-highlight"));
    document.querySelectorAll<HTMLElement>(".attendees, .group-box").forEach(el => {
      el.style.overscrollBehavior = "";
    });
  }, [stopAutoScroll]);

  useEffect(() => {
    if (!isEnabled) return;
    const onMove = (e: TouchEvent) => {
      if (!dragging.current) return;
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
      }, LONG_PRESS);
    },
    [isEnabled, createGhost]
  );

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

  return { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel: handleTouchEnd };
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
        ×
      </button>
    )}
    <strong>{attendee.firstName} {attendee.lastName}</strong>
    <span className={`attendee-status ${attendee.status === "yes" ? "yes" : "no"}`}>
      {attendee.status === "yes" ? "Zugesagt" : "Abgesagt"}
    </span>
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
  const [showRSVPModal,     setShowRSVPModal]     = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGroupInput,    setShowGroupInput]    = useState(false);
  const [showQRModal,       setShowQRModal]       = useState(false);
  const [firstName,         setFirstName]         = useState("");
  const [lastName,          setLastName]          = useState("");
  const [guests,            setGuests]            = useState(1);
  const [comment,           setComment]           = useState("");
  const [status,            setStatus]            = useState("yes");
  const [newPassword,       setNewPassword]       = useState("");
  const [copied,            setCopied]            = useState(false);
  const [alreadyRSVP,       setAlreadyRSVP]       = useState(false);
  const [editingDesc,       setEditingDesc]       = useState(false);
  const [descDraft,         setDescDraft]         = useState("");
  const [loading, setLoading] = useState(true);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const rsvpKey    = `rsvp-${id}`;
  const eventLink  = `${window.location.origin}/event/${id}`;
  const isLoggedIn = !!user;
  const navigate   = useNavigate();
  const isCreator  = !!(user && event?.creatorId === user.uid);
  const { setActiveEventId } = useEvent();

  // ── check if event date has passed → auto-unlock boards ───────────────
  const isEventDateReached = useCallback((eventDate: string | undefined) => {
    if (!eventDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eDate = new Date(eventDate);
    eDate.setHours(0, 0, 0, 0);
    return eDate <= today;
  }, []);

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

      try {
        setLoading(true);

        setActiveEventId(id);

        if (isLoggedIn && user) {
          const userDB = await getUser(user.uid);
          if (userDB) { setFirstName(userDB.firstName); setLastName(userDB.lastName); }
        }

        const loadedEvent = { ...eventData, showAttendees: eventData?.showAttendees ?? true };

        // Auto-unlock boards if event date is reached
        if (isEventDateReached(eventData.eventDate)) {
          const updates: Record<string, boolean> = {};
          if (!eventData.memoriesBoardEnabled) updates.memoriesBoardEnabled = true;
          if (!eventData.pinboardEnabled)      updates.pinboardEnabled      = true;
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "private-events", id), updates);
            Object.assign(loadedEvent, updates);
          }
        }

        setEvent(loadedEvent);
        setDescDraft(eventData.description || "");
        setAttendees(rsvps);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGroups([...new Set(rsvps.map((a: any) => a.group).filter(Boolean))] as string[]);
        if (localStorage.getItem(rsvpKey)) setAlreadyRSVP(true);

        if (user && user.uid !== eventData.creatorId) {
          try { await saveInvitedEvent(user.uid, id); } catch { /* already saved */ }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, isLoggedIn, rsvpKey, isEventDateReached]);

  useEffect(() => {
    document.body.style.overflow = (showRSVPModal || showPasswordModal || showQRModal) ? "hidden" : "";
  }, [showRSVPModal, showPasswordModal, showQRModal]);

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

  const handleSaveDescription = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "private-events", id), { description: descDraft });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvent((prev: any) => ({ ...prev, description: descDraft }));
      setEditingDesc(false);
    } catch (err) { console.error("Beschreibung speichern fehlgeschlagen:", err); }
  };

  const handleToggleBoard = async (board: "memoriesBoardEnabled" | "pinboardEnabled") => {
    if (!id) return;
    const newValue = !event?.[board];
    try {
      await updateDoc(doc(db, "private-events", id), { [board]: newValue });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvent((prev: any) => ({ ...prev, [board]: newValue }));
    } catch (err) { console.error("Board-Status ändern fehlgeschlagen:", err); }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-download-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `einladung-${id}.png`;
    a.click();
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  if (loading || !event) {
    return (
      <div className="loader-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <UnlockEvent eventId={id!} event={event}>
      <div className="event-container">

        {/* hero */}
        <div className="event-hero">
          <div className="hero-left">
            <h1 className="event-title">{event.title}</h1>

            {event.eventDate && (
              <div className="event-date-badge">
                <span>{formatDate(event.eventDate)}</span>
              </div>
            )}

            <div className="event-content">
              <img
                className="event-img"
                src={event?.imagePath || "/images/sonstige-veranstaltung.png"}
                alt=""
              />
              <div className="event-description-wrap">
                {editingDesc ? (
                  <div className="desc-edit-area">
                    <textarea
                      className="desc-textarea"
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      rows={6}
                      autoFocus
                    />
                    <div className="desc-edit-actions">
                      <button className="desc-save-btn" onClick={handleSaveDescription}>Speichern</button>
                      <button className="desc-cancel-btn" onClick={() => { setEditingDesc(false); setDescDraft(event.description || ""); }}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="desc-display">
                    {isCreator && (
                      <button className="desc-edit-btn" title="Beschreibung bearbeiten" onClick={() => { setDescDraft(event.description || ""); setEditingDesc(true); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    )}
                    <p className="desc-text">{event.description}</p>
                  </div>
                )}
              </div>

              <div className="event-content-right">
                {!alreadyRSVP && !isCreator && (
                  <button className="open-rsvp-btn" onClick={() => setShowRSVPModal(true)}>Rückmelden</button>
                )}
                {alreadyRSVP && !isCreator && <span className="rsvp-done">Erfolgreich zurückgemeldet</span>}
                {!isLoggedIn && !isCreator && (
                  <button
                    className="login-save-btn"
                    onClick={() => { localStorage.setItem("redirectEvent", id!); navigate("/login"); }}
                  >
                    Einloggen & Event speichern
                  </button>
                )}
              </div>
            </div>

            {isCreator && (
              <div className="creator-panel">
                <div className="creator-actions">
                  <button className="copy-link-btn" onClick={handleCopyLink}>
                    {copied ? "Link kopiert ✅" : "Link kopieren"}
                  </button>
                  <button className="qr-btn" onClick={() => setShowQRModal(true)}>
                    QR-Code anzeigen
                  </button>
                  <button
                    className={`toggle-btn ${event.showAttendees ? "active" : ""}`}
                    onClick={toggleAttendeesVisibility}
                  >
                    {event.showAttendees ? "Teilnehmerliste öffentlich" : "Teilnehmerliste verborgen"}
                  </button>

                  <button
                    className={`board-btn ${event.memoriesBoardEnabled ? "board-active" : ""}`}
                    onClick={() => handleToggleBoard("memoriesBoardEnabled")}
                  >
                    {event.memoriesBoardEnabled ? "Memories Board aktiv" : "Memories freischalten"}
                  </button>
                  <button
                    className={`board-btn ${event.pinboardEnabled ? "board-active" : ""}`}
                    onClick={() => handleToggleBoard("pinboardEnabled")}
                  >
                    {event.pinboardEnabled ? "Pinwand aktiv" : "Pinwand freischalten"}
                  </button>
                </div>

                <div className="password-card">
                  <h3>Sicherheit</h3>
                  <div className="password-row">
                    <span>Passwort:</span>
                    <strong>{event.password || "Keins gesetzt"}</strong>
                  </div>
                  <button className="edit-password-btn" onClick={() => setShowPasswordModal(true)}>
                    Passwort ändern
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overlay" />
        </div>

        {/* ungrouped attendees */}
        {(event.showAttendees || isCreator) && (
          <div
            className="attendees"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropUngroup}
          >
            <h2>Teilnehmer</h2>
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

        {/* QR modal */}
        {showQRModal && (
          <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
            <div className="modal qr-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowQRModal(false)}>×</button>
              <h2>QR-Code</h2>
              <p className="qr-modal-sub">Teile diesen Code als Einladung</p>
              <div className="qr-canvas-wrap">
                <QRCodeCanvas
                  id="qr-download-canvas"
                  value={eventLink}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#1a1410"
                  level="H"
                  ref={qrCanvasRef}
                />
              </div>
              <p className="qr-link-text">{eventLink}</p>
              <button className="qr-download-btn" onClick={handleDownloadQR}>
                Als Bild herunterladen
              </button>
            </div>
          </div>
        )}

        {/* RSVP modal */}
        {showRSVPModal && (
          <div className="modal-overlay" onClick={() => setShowRSVPModal(false)}>
            <div className="rsvp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rsvp-header">
                <h2>Rückmeldung</h2>
                <p>Sag uns kurz ob du kommst</p>
                <button className="rsvp-modal-close" onClick={() => setShowRSVPModal(false)}>×</button>
              </div>
              <div className="rsvp-body">
                <input placeholder="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input placeholder="Nachname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <input
                  type="number" min={1} value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  placeholder="Anzahl Personen"
                />
                <textarea placeholder="Kommentar (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="rsvp-choice">
                  <button className={status === "yes" ? "active yes" : ""} onClick={() => setStatus("yes")}>Ich komme</button>
                  <button className={status === "no"  ? "active no"  : ""} onClick={() => setStatus("no")}>Leider nicht</button>
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
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              <h2>Passwort ändern</h2>
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
    </UnlockEvent>
  );
};

export default PrivateEvent;