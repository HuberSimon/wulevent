import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export interface Note {
  id?: string;
  text: string;
  author: string;
  createdAt?: Timestamp | null;
}

/* =========================
   ADD NOTE
========================= */
export const addNote = async (
  eventId: string,
  note: { text: string; author: string }
): Promise<string> => {
  const docRef = await addDoc(
    collection(db, "private-events", eventId, "notes"),
    {
      text: note.text,
      author: note.author,
      createdAt: serverTimestamp(),
    }
  );

  return docRef.id;
};

/* =========================
   GET NOTES
========================= */
export const getNotes = async (eventId: string): Promise<Note[]> => {
  const q = query(
    collection(db, "private-events", eventId, "notes"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Note, "id">),
  }));
};

/* =========================
   DELETE SINGLE NOTE
========================= */
export const deleteNote = async (
  eventId: string,
  noteId: string
): Promise<void> => {
  await deleteDoc(
    doc(db, "private-events", eventId, "notes", noteId)
  );
};

/* =========================
   DELETE ALL NOTES (für event delete)
========================= */
export const deleteAllNotes = async (eventId: string) => {
  const snap = await getDocs(collection(db, "private-events", eventId, "notes"));

  await Promise.all(
    snap.docs.map((d) =>
      deleteDoc(doc(db, "private-events", eventId, "notes", d.id))
    )
  );
};