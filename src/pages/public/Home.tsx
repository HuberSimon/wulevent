import './Home.css'
import { Link } from "react-router-dom";

function Home() {
  return (
  <section className='hero-container'>

    <div className='hero-content'>
      <h1 className="fade-up delay-1">
        Finde Events. Plane Momente. <br />
        <span>Alles an einem Ort.</span>
      </h1>

      <p className="fade-up delay-2">
        Entdecke Veranstaltungen in deiner Umgebung oder erstelle eigene Events 
        und teile sie privat mit deinen Gästen – einfach über einen Link.
      </p>

      <div className='hero-buttons fade-up delay-3'>
        <Link to="/public-events">
          <button className='primary-btn'>Events entdecken</button>
        </Link>

        <Link to="/create-event">
          <button className='secondary-btn'>Event erstellen</button>
        </Link>
      </div>
    </div>

    <div className='hero-features'>
      <div className='feature-card fade-up delay-4'>
        <h3>🌍 Öffentliche Events</h3>
        <p>Bleib up to date mit Events in deiner Region.</p>
      </div>

      <div className='feature-card fade-up delay-5'>
        <h3>🔗 Private Einladungen</h3>
        <p>Erstelle Events und teile sie direkt mit deinen Gästen.</p>
      </div>

      <div className='feature-card fade-up delay-6'>
        <h3>✅ Rückmeldungen</h3>
        <p>Zu- oder Absagen mit Teilnehmerzahl und Infos.</p>
      </div>
    </div>

  </section>
  )
}

export default Home;