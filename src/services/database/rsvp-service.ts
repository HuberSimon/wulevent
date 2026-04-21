import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addRSVP = async (eventId: string, data: any) => {
  await addDoc(collection(db, "events", eventId, "attendees"), data);
};

export const getRSVPs = async (eventId: string) => {
  const snapshot = await getDocs(collection(db, "events", eventId, "attendees"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};