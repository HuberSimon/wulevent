import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { uploadImageToCloudinary } from "../../services/database/cloudinary-service";
import "./EventMoments.css";
import MomentCard from "../../components/MomentCard";
import { getEventById } from "../../services/database/private-event-service";

interface MomentPost {
  id: string;
  text: string;
  images: string[];
  userName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

const EventMoments = ({
  eventId,
  userId,
  userName,
}: {
  eventId: string;
  userId: string;
  userName: string;
}) => {
  const [posts, setPosts] = useState<MomentPost[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    const load = async () => {

      const event = await getEventById(eventId);
      if (event) {
        setEventName(event.title);
      }

      const q = query(
        collection(db, "private-events", eventId, "moments"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      setPosts(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MomentPost[]
      );
    };

    load();
  }, [eventId]);

  const handleUpload = async () => {
    if (!text && files.length === 0) return;

    setLoading(true);

    const imageUrls: string[] = [];

    for (const file of files.slice(0, 10)) {
      const url = await uploadImageToCloudinary(file, eventId);
      imageUrls.push(url);
    }

    await addDoc(collection(db, "private-events", eventId, "moments"), {
      text,
      images: imageUrls,
      userName,
      userId,
      createdAt: new Date(),
    });

    setText("");
    setFiles([]);
    setLoading(false);

    window.location.reload();
  };

  return (
    <div className="board-container">
      <div className="board-info">
        <h1>Momente <br /> {eventName}</h1>
        <p>Teile Momente mit allen Teilnehmern</p>
      </div>

      <div className="post-add-card">

        <input
            id="fileInput"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
                if (!e.target.files) return;
                setFiles(Array.from(e.target.files));
            }}
            className="hidden-input"
            />

        <label htmlFor="fileInput" className="upload-label">
            <div className="upload-icon">📷</div>

            <div className="upload-text">
                <strong>Bilder hochladen</strong>
            </div>
        </label>

        {files.length > 0 && (
        <div className="preview-row">
            {files.map((file, i) => (
            <img
                key={i}
                src={URL.createObjectURL(file)}
                className="preview-img"
            />
            ))}
        </div>
        )}

        <textarea
          placeholder="Was geht ab..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Posting..." : "Post erstellen"}
        </button>
      </div>

      <div className="board-grid">

        {posts.map((post) => (
          <MomentCard key={post.id} post={post} />
        ))}

      </div>
    </div>
  );
};

export default EventMoments;