import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export interface PrivateEvent {
  id?: string;
  title: string;
  description: string;
  image: string;
  creatorId: string;
  showAttendees?: boolean;
  password: string;
}

export const createEvent = async (data: PrivateEvent) => {
  const docRef = await addDoc(collection(db, "private-events"), {
    ...data,
    createdAt: new Date()
  });

  return docRef.id;
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
    image: data.image,
    creatorId: data.creatorId,
    showAttendees: data.showAttendees ?? true,
    password: data.password
  };
};