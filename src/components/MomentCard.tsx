import { useState } from "react";
import "./MomentCard.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MomentCard = ({ post }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev: number) =>
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const prev = () => {
    setCurrentIndex((prev: number) =>
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  const date = post.createdAt?.seconds
    ? new Date(post.createdAt.seconds * 1000)
    : new Date();

  return (
    <div className="moment-card">

      {/* HEADER */}
      <div className="moment-header">
        <div className="moment-user">{post.userName}</div>
        <div className="moment-date">
          {date.toLocaleString()}
        </div>
      </div>

      {/* IMAGE */}
      {post.images?.length > 0 && (
        <div className="moment-image-wrapper">

          <img
            src={post.images[currentIndex]}
            className="moment-image"
          />

          {post.images.length > 1 && (
            <>
              <button className="arrow left" onClick={prev}>‹</button>
              <button className="arrow right" onClick={next}>›</button>
            </>
          )}
        </div>
      )}

      {/* TEXT */}
      {post.text && (
        <p className="moment-text">{post.text}</p>
      )}

    </div>
  );
};

export default MomentCard;