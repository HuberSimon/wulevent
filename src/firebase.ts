import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgBPc5H-TrbsyUGLbgOLEkrSEa6ORp2MQ",
  authDomain: "wulevent.firebaseapp.com",
  projectId: "wulevent",
  storageBucket: "wulevent.firebasestorage.app",
  messagingSenderId: "841501063003",
  appId: "1:841501063003:web:bc25f220bdb985c07e8c7e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);