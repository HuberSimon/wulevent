import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth"

import { auth, db } from "../../firebase"
import "./Authentication.css"
import { doc, setDoc } from "firebase/firestore"

const Authentication: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const redirectEvent = localStorage.getItem("redirectEvent");

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!firstName || !lastName))) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        toast.success("Willkommen zurück 👋")
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
      toast.error(err.message)
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
        className="primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "..." : isLogin ? "Login" : "Registrieren"}
      </button>

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
        {isLogin ? "Noch kein Account?" : "Zurück zum Login"}
      </p>
    </div>
  )
}

export default Authentication