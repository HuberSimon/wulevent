import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase"

export interface User {
  uid: string
  firstName: string
  lastName: string
  email: string
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        uid,
        ...(docSnap.data() as Omit<User, "uid">)
      }
    } else {
      console.warn("User nicht gefunden")
      return null
    }
  } catch (error) {
    console.error("Fehler beim Laden des Users:", error)
    return null
  }
}

export async function createUser(user: User): Promise<void> {
  try {
    const docRef = doc(db, "users", user.uid)

    await setDoc(docRef, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    })
  } catch (error) {
    console.error("Fehler beim Erstellen des Users:", error)
    throw error
  }
}

export async function updateUser(
  uid: string,
  data: Partial<Pick<User, "firstName" | "lastName">>
): Promise<void> {
  try {
    const docRef = doc(db, "users", uid)

    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Fehler beim Updaten des Users:", error)
    throw error
  }
}

export async function getUserDisplayName(uid: string): Promise<string> {
  const user = await getUser(uid);

  if (!user) return "Anonymous";

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return fullName || user.email.split("@")[0] || "Anonymous";
}