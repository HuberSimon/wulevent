import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./UnlockEvent.css";

interface Props {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any;
  children: React.ReactNode;
}

const UnlockEvent = ({ eventId, event, children }: Props) => {
  const { user } = useAuth();

  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");

  const [accessGranted, setAccessGranted] = useState(() =>
    sessionStorage.getItem(`event-access-${eventId}`) === "true"
  );

  const isCreator =
    !!user &&
    !!event &&
    event.creatorId === user.uid;

  const hasPassword =
    !!event?.password?.trim();

  const canAccess =
    isCreator ||
    accessGranted ||
    !hasPassword;

  useEffect(() => {
    if (canAccess) {
      sessionStorage.setItem(
        `event-access-${eventId}`,
        "true"
      );
    }
  }, [canAccess, eventId]);

  const checkPassword = () => {
    if (inputPassword === event.password) {
      setAccessGranted(true);

      sessionStorage.setItem(
        `event-access-${eventId}`,
        "true"
      );

      setError("");
    } else {
      setError("Falsches Passwort");
    }
  };

  if (!event) return null;

  if (!canAccess) {
    return (
      <div className="unlock-screen">

        <div className="unlock-card">

          <div className="unlock-icon">
            🔒
          </div>

          <h1>Geschütztes Event</h1>

          <p>
            Für dieses Event wurde ein Passwort gesetzt.
          </p>

          <input
            type="password"
            placeholder="Passwort eingeben"
            value={inputPassword}
            onChange={(e) =>
              setInputPassword(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              checkPassword()
            }
          />

          <button
            onClick={checkPassword}
          >
            Freischalten
          </button>

          {error && (
            <span className="unlock-error">
              {error}
            </span>
          )}

        </div>

      </div>
    );
  }

  return <>{children}</>;
};

export default UnlockEvent;