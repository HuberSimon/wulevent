import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export interface RSVP {
  id: string;
  firstName: string;
  lastName: string;
  guests: number;
  comment: string;
  status: "yes" | "no";
  group: string;
  userId?: string;
}

export interface NewRSVPInput {
  firstName: string;
  lastName: string;
  guests: number;
  comment: string;
  status: "yes" | "no";
  userId?: string;
}

/* =========================
   ADD RSVP
========================= */
export const addRSVP = async (eventId: string, data: NewRSVPInput) => {
  await addDoc(collection(db, "private-events", eventId, "attendees"), {
    ...data,
    group: "",
  });
};

/* =========================
   GET ALL RSVPS
========================= */
export const getRSVPs = async (eventId: string): Promise<RSVP[]> => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<RSVP, "id">),
  }));
};

/* =========================
   DELETE SINGLE RSVP
========================= */
export const deleteRSVP = async (eventId: string, rsvpId: string) => {
  await deleteDoc(doc(db, "private-events", eventId, "attendees", rsvpId));
};

/* =========================
   DELETE ALL RSVPS
========================= */
export const deleteAllRSVPs = async (eventId: string) => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );
  await Promise.all(
    snapshot.docs.map((d) =>
      deleteDoc(doc(db, "private-events", eventId, "attendees", d.id))
    )
  );
};

/* =========================
   REMOVE RSVP BY NAME
   (Hinweis: Dokumente haben firstName/lastName, kein "name"-Feld.
   Daher wird hier korrekt nach firstName + lastName verglichen.)
========================= */
export const removeRSVPByName = async (
  eventId: string,
  firstName: string,
  lastName: string
) => {
  const snapshot = await getDocs(
    collection(db, "private-events", eventId, "attendees")
  );
  const match = snapshot.docs.find((d) => {
    const data = d.data() as Partial<RSVP>;
    return (
      (data.firstName || "").toLowerCase() === firstName.toLowerCase() &&
      (data.lastName || "").toLowerCase() === lastName.toLowerCase()
    );
  });
  if (!match) return;
  await deleteDoc(doc(db, "private-events", eventId, "attendees", match.id));
};

/* =========================
   UPDATE GROUP
========================= */
export const updateRSVPGroup = async (
  eventId: string,
  attendeeId: string,
  group: string
) => {
  await updateDoc(doc(db, "private-events", eventId, "attendees", attendeeId), {
    group,
  });
};