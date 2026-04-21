import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Authentication.css";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../../firebase";

const Authentication: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Bitte alle Felder ausfüllen");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(result.user, {
          displayName: name,
        });
      }

      navigate("/dashboard");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h1>{isLogin ? "Login" : "Sign Up"}</h1>

      {!isLogin && (
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <input
        type="email"
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

      <button onClick={handleSubmit}>
        {isLogin ? "Login" : "Registrieren"}
      </button>

      {error && <p className="login-error">{error}</p>}

      <p
        style={{ cursor: "pointer", marginTop: "10px" }}
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin
          ? "Noch kein Account? Registrieren"
          : "Schon einen Account? Login"}
      </p>
    </div>
  );
};

export default Authentication;