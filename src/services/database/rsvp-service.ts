import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";

/* =========================
   ADD RSVP
========================= */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addRSVP = async (eventId: string, data: any) => {
  await addDoc(collection(db, "private-events", eventId, "attendees"), data);
};

/* =========================
   GET ALL RSVPS
========================= */
export const getRSVPs = async (eventId: string) => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteRSVP = async (
  eventId: string,
  rsvpId: string
) => {
  await deleteDoc(
    doc(db, "private-events", eventId, "attendees", rsvpId)
  );
};


export const deleteAllRSVPs = async (eventId: string) => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );

  await Promise.all(
    snapshot.docs.map((d) =>
      deleteDoc(
        doc(db, "private-events", eventId, "attendees", d.id)
      )
    )
  );
};


export const removeRSVPByName = async (
  eventId: string,
  name: string
) => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );

  const match = snapshot.docs.find(
    (d) =>
      (d.data().name || "").toLowerCase() === name.toLowerCase()
  );

  if (!match) return;

  await deleteDoc(
    doc(db, "private-events", eventId, "attendees", match.id)
  );
};