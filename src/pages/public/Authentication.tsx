import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth"
import { auth, db } from "../../firebase"
import "./Authentication.css"
import { doc, getDoc, setDoc } from "firebase/firestore"

const Authentication: React.FC = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const redirectEvent = localStorage.getItem("redirectEvent");
  const initialMode = location.state?.mode
    ? location.state.mode === "register"
      ? false
      : true
    : true
  const [isLogin, setIsLogin] = useState(initialMode)
  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!firstName || !lastName))) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);

        const user = result.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          await auth.signOut();
          toast.error("User nicht gefunden");
          return;
        }

        const data = userDoc.data();

        if (!data.isEnabled) {
          await auth.signOut();
          toast.error("Account ist deaktiviert - Kontaktiere Simon, um deinen Account zu aktivieren");
          return;
        }

        toast.success("Willkommen zurück 👋");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        const user = result.user
        await updateProfile(user, {
          displayName: firstName
        })
        await setDoc(doc(db, "users", user.uid), {
          firstName: firstName,
          lastName: lastName,
          email: email
        })
        toast.success("Account erstellt 🎉")
      }
      if (redirectEvent) {
        navigate(`/event/${redirectEvent}`);
        localStorage.removeItem("redirectEvent");
      } else {
        navigate("/dashboard");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
        switch (err.code) {
          case "auth/user-not-found":
            toast.error("Benutzer existiert nicht")
            break
          case "auth/invalid-credential":
            toast.error("Passwort ist falsch")
            break
          case "auth/invalid-email":
            toast.error("Ungültige E-Mail Adresse")
            break
          case "auth/too-many-requests":
            toast.error("Zu viele Versuche. Bitte später erneut versuchen")
            break
          case "auth/email-already-in-use":
            toast.error("E-Mail wird bereits verwendet")
            break
          case "auth/weak-password":
            toast.error("Passwort ist zu schwach")
            break
          default:
            toast.error("Ein Fehler ist aufgetreten")
            break
        }
    }
    setLoading(false)
  }
  return (
    <div className="login-container">
      <h1>{isLogin ? "Login" : "Account erstellen"}</h1>
      {!isLogin && (
        <div className="login-container-name">
          <input
            placeholder="Vorname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
            <input
            placeholder="Nachname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      )}
      <input
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "..." : isLogin ? "Login" : "Registrieren"}
      </button>
      <div className="login-divider">
        <span>oder</span>
      </div>
      <button
        className="btn-secondary"
        onClick={() => setIsLogin(!isLogin)}
        type="button"
      >
        {isLogin ? "Noch kein Account? Jetzt registrieren" : "Zurück zum Login"}
      </button>
      <button
        className="btn-tertiary"
        onClick={() => navigate("/")}
        type="button"
      >
        ← Zurück zur Startseite
      </button>
    </div>
  )
}
export default Authentication