import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../../firebase";

export interface PublicEvent {
  id?: string;
  title: string;
  description: string;
  city: string;
  date: string;
}

export const createPublicEvent = async (data: PublicEvent) => {
  const docRef = await addDoc(collection(db, "public-events"), {
    ...data,
    createdAt: new Date(),
  });

  return docRef.id;
};

export const getPublicEventsByCity = async (city: string) => {
  const q = query(
    collection(db, "public-events"),
    where("city", "==", city),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};