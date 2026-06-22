import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import JSZip from "jszip";
import { db } from "../../firebase";
import {
  uploadImageToCloudinary,
  optimizedCloudinaryUrl,
} from "../../services/database/cloudinary-service";
import { deleteFromCloudinary } from "../../services/database/cloudinary-service";
import "./EventMoments.css";
import MomentCard from "../../components/MomentCard";
import { getEventById } from "../../services/database/private-event-service";

interface MomentPost {
  id: string;
  text: string;
  images: string[];
  userName: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

const MAX_DIMENSION = 1920;
const JPEG_QUALITY  = 0.82;

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size < 300_000) {
      resolve(file);
      return;
    }
    const img       = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width  = MAX_DIMENSION;
        } else {
          width  = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
};

const UPLOAD_CONCURRENCY = 3;

async function uploadInBatches<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number
) {
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await worker(items[index], index);
      }
    }
  );
  await Promise.all(runners);
}

const EventMoments = ({
  eventId,
  userId,
  userName,
  isEventCreator = false,
}: {
  eventId: string;
  userId: string | null;
  userName: string | null;
  isEventCreator?: boolean;
}) => {
  const [posts,          setPosts]          = useState<MomentPost[]>([]);
  const [text,           setText]           = useState("");
  const [files,          setFiles]          = useState<File[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [eventName,      setEventName]      = useState<string>("");

  const [isEnabled,       setBoardEnabled]    = useState(false);
  const [showNameDialog,  setShowNameDialog]  = useState(false);
  const [guestFirstName,  setGuestFirstName]  = useState("");
  const [guestLastName,   setGuestLastName]   = useState("");
  const [resolvedName,    setResolvedName]    = useState<string | null>(userName ?? null);
  const [screenLoading, setScreenLoading] = useState(true);

  useEffect(() => {
    if (userName) setResolvedName(userName);
  }, [userName]);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedImages,    setSelectedImages]    = useState<Set<string>>(new Set());
  const [zipping,           setZipping]           = useState(false);
  const [zipProgress,       setZipProgress]       = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setScreenLoading(true);
        const event = await getEventById(eventId);
        setBoardEnabled(!!event?.memoriesBoardEnabled);
        if (event) setEventName(event.title);
        const q    = query(collection(db, "private-events", eventId, "moments"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MomentPost[]);
      } catch (err) {
        console.error(err);
      } finally {
        setScreenLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handlePostClick = () => {
    if (!text && files.length === 0) return;
    if (!resolvedName) {
      setShowNameDialog(true);
    } else {
      handleUpload(resolvedName);
    }
  };

  const handleGuestNameConfirm = () => {
    const trimFirst = guestFirstName.trim();
    const trimLast  = guestLastName.trim();
    if (!trimFirst || !trimLast) return;
    const fullName = `${trimFirst} ${trimLast}`;
    setResolvedName(fullName);
    setShowNameDialog(false);
    handleUpload(fullName);
  };

  const handleUpload = async (displayName: string) => {
    if (!text && files.length === 0) return;
    setLoading(true);
    setUploadProgress(0);
    const sliced    = files.slice(0, 10);
    let done        = 0;
    const imageUrls: string[] = new Array(sliced.length);
    try {
      await uploadInBatches(
        sliced,
        async (file, index) => {
          let compressed: File;
          try   { compressed = await compressImage(file); }
          catch { compressed = file; }
          const url = await uploadImageToCloudinary(compressed, eventId);
          if (!url) throw new Error(`Cloudinary hat keine URL zurückgegeben für ${file.name}`);
          imageUrls[index] = url;
          done++;
          setUploadProgress(Math.round((done / sliced.length) * 100));
        },
        UPLOAD_CONCURRENCY
      );
      const docRef = await addDoc(
        collection(db, "private-events", eventId, "moments"),
        { text, images: imageUrls, userName: displayName, userId: userId ?? `guest-${Date.now()}`, createdAt: new Date() }
      );
      setPosts((prev) => [
        { id: docRef.id, text, images: imageUrls, userName: displayName, userId: userId ?? `guest-${Date.now()}`, createdAt: new Date() },
        ...prev,
      ]);
      setText("");
      setFiles([]);
    } catch (err) {
      console.error("Upload fehlgeschlagen:", err);
      alert("Der Post konnte nicht hochgeladen werden. Bitte Internetverbindung prüfen und erneut versuchen.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Diesen Post wirklich löschen?")) return;
    const post      = posts.find((p) => p.id === postId);
    const imageUrls = post?.images ?? [];
    await deleteDoc(doc(db, "private-events", eventId, "moments", postId));
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (imageUrls.length > 0) {
      deleteFromCloudinary(imageUrls); // nicht-blockierend
    }
  };

  const downloadsInFlight = useRef<Set<string>>(new Set());

  const handleDownloadImage = async (url: string, filename?: string): Promise<boolean> => {
    if (downloadsInFlight.current.has(url)) return false;
    downloadsInFlight.current.add(url);
    try {
      const response = await fetch(optimizedCloudinaryUrl(url));
      if (!response.ok) throw new Error(`Download fehlgeschlagen (Status ${response.status})`);
      const blob = await response.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = filename ?? `moment-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
      return true;
    } catch (err) {
      console.error("Bild-Download fehlgeschlagen:", err);
      return false;
    } finally {
      downloadsInFlight.current.delete(url);
    }
  };

  const allImages = posts.flatMap((p) => p.images);

  const openDownloadModal = () => {
    setSelectedImages(new Set(allImages));
    setShowDownloadModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  const toggleImage = (url: string) => setSelectedImages((prev) => { const n = new Set(prev); n.has(url) ? n.delete(url) : n.add(url); return n; });
  const selectAll   = () => setSelectedImages(new Set(allImages));
  const deselectAll = () => setSelectedImages(new Set());

  const getExtensionFromUrl = (url: string) => url.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i)?.[1].toLowerCase() ?? "jpg";

  const handleBulkDownload = async () => {
    const urls = Array.from(selectedImages);
    if (urls.length === 0) return;
    setZipping(true);
    setZipProgress(0);
    const zip  = new JSZip();
    let done   = 0;
    try {
      await uploadInBatches(
        urls,
        async (url, index) => {
          try {
            const response = await fetch(optimizedCloudinaryUrl(url));
            if (!response.ok) throw new Error(`Bild ${index + 1} konnte nicht geladen werden`);
            const blob = await response.blob();
            zip.file(`moment-${index + 1}.${getExtensionFromUrl(url)}`, blob);
          } finally {
            done++;
            setZipProgress(Math.round((done / urls.length) * 100));
          }
        },
        UPLOAD_CONCURRENCY
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a       = document.createElement("a");
      a.href        = URL.createObjectURL(zipBlob);
      a.download    = `${eventName || "moments"}-bilder.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setShowDownloadModal(false);
      setSelectedImages(new Set());
    } catch (err) {
      console.error("ZIP-Download fehlgeschlagen:", err);
      alert("Die Bilder konnten nicht heruntergeladen werden. Bitte erneut versuchen.");
    } finally {
      setZipping(false);
      setZipProgress(0);
    }
  };

  if (screenLoading) {
    return (
      <div className="loader-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-info">
        <h1>Galerie</h1>
        <h2>{eventName}</h2>
        <p><br/>Teile Fotos und Highlights mit allen Teilnehmern</p>
      </div>

      <div className="divider" />

      {isEnabled && (
        <div className="post-add-card">
          <input
            id="fileInput"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => { if (!e.target.files) return; setFiles(Array.from(e.target.files)); }}
            className="hidden-input"
          />
          <label htmlFor="fileInput" className="upload-label">
            <div className="upload-icon">📷</div>
            <div className="upload-text"><strong>Bilder hochladen</strong></div>
          </label>

          {files.length > 0 && (
            <div className="preview-row">
              {files.map((file, i) => (
                <div key={i} className="preview-item">
                  <img src={URL.createObjectURL(file)} className="preview-img" alt="" />
                  <button className="remove-preview" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} title="Bild entfernen">✕</button>
                </div>
              ))}
            </div>
          )}

          <textarea placeholder="Was geht ab..." value={text} onChange={(e) => setText(e.target.value)} />

          {loading && files.length > 0 && (
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
              <span className="progress-label">{uploadProgress}%</span>
            </div>
          )}

          <div className="post-actions">
            {isEventCreator && allImages.length > 0 && (
              <button className="bulk-download-btn" onClick={openDownloadModal}>⬇ Bilder herunterladen</button>
            )}
            <button onClick={handlePostClick} disabled={loading}>
              {loading ? (files.length > 0 ? `Lädt hoch… ${uploadProgress}%` : "Posting…") : "Post erstellen"}
            </button>
          </div>
        </div>
      )}

      {isEnabled && (  
        <div className="board-grid">
          {posts.map((post) => (
            <MomentCard
              key={post.id}
              post={post}
              canDelete={isEventCreator || post.userId === userId}
              canDownload={isEventCreator}
              onDelete={() => handleDeletePost(post.id)}
              onDownload={handleDownloadImage}
            />
          ))}
        </div>
      )}

      {!isEnabled && (
        <p>Fotoalbum ist leider noch nicht vom Veranstalter freigeschaltet.</p>
      )}

      {showNameDialog && (
        <div className="modal-overlay" onClick={() => setShowNameDialog(false)}>
          <div className="modal-box name-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Wie heißt du?</h2>
              <button className="modal-close" onClick={() => setShowNameDialog(false)}>✕</button>
            </div>
            <p className="name-dialog-hint">Dein Name wird am Post angezeigt.</p>
            <div className="name-inputs">
              <input className="name-input" type="text" placeholder="Vorname"  value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} autoFocus />
              <input className="name-input" type="text" placeholder="Nachname" value={guestLastName}  onChange={(e) => setGuestLastName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleGuestNameConfirm(); }} />
            </div>
            <button className="download-all-btn" disabled={!guestFirstName.trim() || !guestLastName.trim()} onClick={handleGuestNameConfirm}>
              Weiter & posten
            </button>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => !zipping && setShowDownloadModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bilder auswählen</h2>
              <button className="modal-close" onClick={() => setShowDownloadModal(false)} disabled={zipping}>✕</button>
            </div>
            <div className="modal-actions">
              <button className="sel-btn" onClick={selectAll}   disabled={zipping}>Alle auswählen</button>
              <button className="sel-btn" onClick={deselectAll} disabled={zipping}>Alle abwählen</button>
              <span className="sel-count">{selectedImages.size} ausgewählt</span>
            </div>
            <div className="modal-grid">
              {allImages.map((url, i) => (
                <div
                  key={i}
                  className={`modal-img-wrap ${selectedImages.has(url) ? "selected" : ""}`}
                  onClick={() => !zipping && toggleImage(url)}
                >
                  <img src={optimizedCloudinaryUrl(url, 300)} className="modal-img" alt="" loading="lazy" />
                  {selectedImages.has(url) && <div className="modal-check">✓</div>}
                </div>
              ))}
            </div>
            {zipping && (
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${zipProgress}%` }} />
                <span className="progress-label">{zipProgress}%</span>
              </div>
            )}
            <button className="download-all-btn" disabled={selectedImages.size === 0 || zipping} onClick={handleBulkDownload}>
              {zipping ? `Erstelle ZIP… ${zipProgress}%` : `⬇ ${selectedImages.size} Bilder als ZIP herunterladen`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMoments;