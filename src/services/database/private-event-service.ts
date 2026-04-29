import {
  collection,
  addDoc,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { deleteAllNotes } from "./note-service";
import { deleteAllRSVPs } from "./rsvp-service";

export interface PrivateEvent {
  id?: string;
  title: string;
  description: string;
  creatorId: string;
  showAttendees?: boolean;
  password: string;
  imagePath: string;
}

export const createEvent = async (data: PrivateEvent) => {
  const eventRef = await addDoc(collection(db, "private-events"), {
    ...data,
    createdAt: new Date(),
  });

  await setDoc(
    doc(db, "users", data.creatorId, "createdEvents", eventRef.id),
    {
      eventId: eventRef.id,
      createdAt: new Date(),
    }
  );

  return eventRef.id;
};

export const saveInvitedEvent = async (
  userId: string,
  eventId: string
) => {
  const ref = doc(db, "users", userId, "invitedEvents", eventId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(
    doc(db, "users", userId, "invitedEvents", eventId),
    {
      eventId,
      savedAt: new Date(),
    }
  );
};


export const getEventById = async (id: string) => {
  const docRef = doc(db, "private-events", id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: data.title,
    description: data.description,
    creatorId: data.creatorId,
    showAttendees: data.showAttendees ?? true,
    password: data.password,
    imagePath: data.imagePath || "",
  };
};

export const getUserEvents = async (userId: string) => {
  const createdSnap = await getDocs(
    collection(db, "users", userId, "createdEvents")
  );

  const invitedSnap = await getDocs(
    collection(db, "users", userId, "invitedEvents")
  );

  const createdIds = createdSnap.docs.map((d) => d.id);
  const invitedIds = invitedSnap.docs.map((d) => d.id);

  return {
    createdIds,
    invitedIds,
  };
};

export const deleteEventCompletely = async (
  eventId: string,
  userId: string
) => {
  try {
    await Promise.all([
      deleteAllNotes(eventId),
      deleteAllRSVPs(eventId),
    ]);

    await deleteDoc(doc(db, "private-events", eventId));

    await deleteDoc(
      doc(db, "users", userId, "createdEvents", eventId)
    );

    await deleteDoc(
      doc(db, "users", userId, "invitedEvents", eventId)
    );

  } catch (err) {
    console.error("Delete failed:", err);
    throw err;
  }
};