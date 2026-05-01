import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./EventBoard.css";
import { getEventById } from "../../services/database/private-event-service";

interface Post {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  color?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
}

interface Props {
  eventId: string;
  userId: string;
  userName: string;
}

const COLORS = [
  "#ffe4c2",
  "#ff8c00",
  "#8af775",
  "#a0c4ff",
  "#bdb2ff",
  "#fa9d9d",
  "#ff4747",
];

export default function EventBoard({
  eventId,
  userId,
  userName,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const event = await getEventById(eventId);

      if (event) {
        setEventName(event.title);
      }
    };

    load();

    const q = query(
      collection(db, "private-events", eventId, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Post),
        }))
      );
    });

    return () => unsub();
  }, [eventId]);

  const handlePost = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "private-events", eventId, "posts"), {
      text,
      userId,
      userName,
      color,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div className="board-container">

      <div className="board-info">
        <h1>Pinnwand <br /> {eventName}</h1>
        <p>Teile Gedanken mit allen Teilnehmern</p>
      </div>

      <div className="divider" />

      <div className="board-grid">

        <div className="post-add-card">

          <textarea
            placeholder="Schreibe etwas..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mini-colors">
            {COLORS.map((c) => (
              <span
                key={c}
                className={`mini-dot ${color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <button onClick={handlePost}>
            + Posten
          </button>

        </div>

        {posts.map((post) => (
          <div
            key={post.id}
            className="post-card"
            style={{
              background: post.color || "rgba(233, 203, 169, 0.712)",
            }}
          >

            <div className="post-header">
              <strong>{post.userName}</strong>
              <span>
                {post.createdAt?.toDate?.().toLocaleString?.() || ""}
              </span>
            </div>

            <p className="card-text">{post.text}</p>

          </div>
        ))}

      </div>
    </div>
  );
}