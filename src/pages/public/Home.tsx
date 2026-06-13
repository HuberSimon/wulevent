import './Home.css'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="hero-container">

      <div className="hero-glow" />

      <div className="hero-content">

        <div className="hero-badge fade-up delay-1">
          <div className="badge-dot" />
          <span>Private Events</span>
          <div className="badge-divider" />
          <span>Einladungen • Fotos • Memories</span>
        </div>

        <h1 className="fade-up delay-2">
          Plane deine Veranstaltung. <br />
          <span>Erlebe Erinnerungen gemeinsam.</span>
        </h1>

        <p className="fade-up delay-3">
          Erstelle private Veranstaltungen für Hochzeiten, Geburtstage oder besondere Momente
          und lade deine Gäste einfach per Link oder QR-Code ein.
          <br /><br />
          Gäste können ohne Login teilnehmen und Beiträge teilen –
          alles wird automatisch auf eurer Event-Seite gesammelt.
        </p>

        <div className="hero-buttons fade-up delay-4">

          <Link to="/create-event">
            <button className="primary-btn">
              Event erstellen
            </button>
          </Link>

          <Link to="/login" state={{ mode: "register" }}>
            <button className="secondary-btn">
              Account erstellen
            </button>
          </Link>

        </div>

      </div>

      <div className="hero-features">

        <div className="feature-card fade-up delay-5">
          <div className="feature-header">
            <div className="feature-icon">🎉</div>
            <h3>Events & Organisation</h3>
          </div>
          <p>
            Erstelle deine exklusiven Veranstaltungen mit ansprechenden Einladungen.<br />
            Rückmeldungen, Teilnehmerliste und Gäste einfach verwalten.
          </p>
        </div>

        <div className="feature-card fade-up delay-6">
          <div className="feature-header">
            <div className="feature-icon">🔗</div>
            <h3>Einladung per Link</h3>
          </div>
          <p>
            Gäste treten sofort per Link oder QR-Code bei – ohne Login.
          </p>
        </div>

        <div className="feature-card fade-up delay-7">
          <div className="feature-header">
            <div className="feature-icon">📸</div>
            <h3>Fotos & Memories</h3>
          </div>
          <p>
            Gäste teilen Bilder und Erinnerungen direkt im Event. <br />
            Sammle alle Momente an einem Ort und erlebe sie gemeinsam.
          </p>
        </div>

        <div className="feature-card fade-up delay-8">
          <div className="feature-header">
            <div className="feature-icon">📌</div>
            <h3>Pinwand</h3>
          </div>
          <p>
            Nachrichten, Wünsche und Grüße werden auf einer Pinwand sichtbar.
          </p>
        </div>

      </div>

    </section>
  )
}

export default Home