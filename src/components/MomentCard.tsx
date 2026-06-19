import { useState, type TouchEventHandler } from "react";
import "./MomentCard.css";

interface MomentPost {
  id: string;
  text: string;
  images: string[];
  userName: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

interface MomentCardProps {
  post: MomentPost;
  canDelete?: boolean;
  canDownload?: boolean;
  onDelete?: () => void;
  onDownload?: (url: string, filename?: string) => Promise<boolean>;
}

const SWIPE_THRESHOLD = 50;

const MomentCard = ({
  post,
  canDelete = false,
  canDownload = false,
  onDelete,
  onDownload,
}: MomentCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [downloadState, setDownloadState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Touch-Tracking für Swipe-Geste (Instagram-artiges Karussell auf Mobile)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const next = () => {
    setCurrentIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
    setDownloadState("idle");
  };
  const prev = () => {
    setCurrentIndex((prevIdx) => (prevIdx === 0 ? post.images.length - 1 : prevIdx - 1));
    setDownloadState("idle");
  };

  const handleTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
    if (post.images.length <= 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX === null || touchStartY === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const date = post.createdAt?.seconds
    ? new Date(post.createdAt.seconds * 1000)
    : new Date();
  const currentImage = post.images?.[currentIndex];

  const handleDownloadClick = async () => {
    if (!onDownload || downloadState === "loading") return;

    setDownloadState("loading");
    const success = await onDownload(
      currentImage,
      `${post.userName}-moment-${currentIndex + 1}.jpg`
    );
    setDownloadState(success ? "success" : "error");

    setTimeout(() => setDownloadState("idle"), success ? 1500 : 2500);
  };

  return (
    <div className="moment-card">
      {/* HEADER */}
      <div className="moment-header">
        <div className="moment-user">{post.userName}</div>
        <div className="moment-date">{date.toLocaleString()}</div>
        {/* Delete (X) button — top-right, only for authorised users */}
        {canDelete && onDelete && (
          <button
            className="moment-delete-btn"
            onClick={onDelete}
            title="Post löschen"
          >
            ✕
          </button>
        )}
      </div>

      {/* IMAGE */}
      {post.images?.length > 0 && (
        <div
          className="moment-image-wrapper"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img src={currentImage} className="moment-image" alt="" draggable={false} />

          {post.images.length > 1 && (
            <>
              <button className="arrow left" onClick={prev}>
                ‹
              </button>
              <button className="arrow right" onClick={next}>
                ›
              </button>
            </>
          )}

          {canDownload && onDownload && (
            <button
              className={`moment-download-btn ${downloadState}`}
              onClick={handleDownloadClick}
              disabled={downloadState === "loading"}
              title={
                downloadState === "error"
                  ? "Download fehlgeschlagen — erneut versuchen"
                  : "Bild herunterladen"
              }
            >
              {downloadState === "loading" && (
                <span className="download-spinner" />
              )}
              {downloadState === "success" && "✓"}
              {downloadState === "error" && "!"}
              {downloadState === "idle" && "⬇"}
            </button>
          )}

          {/* Image counter */}
          {post.images.length > 1 && (
            <div className="image-counter">
              {currentIndex + 1} / {post.images.length}
            </div>
          )}

          {/* Swipe-Dots*/}
          {post.images.length > 1 && (
            <div className="image-dots">
              {post.images.map((_, i) => (
                <span
                  key={i}
                  className={`image-dot ${i === currentIndex ? "active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEXT */}
      {post.text && <p className="moment-text">{post.text}</p>}
    </div>
  );
};

export default MomentCard;