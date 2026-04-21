import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export interface PublicEvent {
  id?: string;
  title: string;
  description: string;
  image: string;
  creatorId: string;
}

export const createEvent = async (event: PublicEvent) => {
  const docRef = await addDoc(collection(db, "events"), event);
  return docRef.id;
};

export const getEventById = async (id: string) => {
  const docRef = doc(db, "events", id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
};