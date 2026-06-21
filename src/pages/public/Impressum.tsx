import type { JSX } from "react";
import "./LegalPages.css";
import { Link } from "react-router-dom";

/**
 * Impressum gemäß § 5 DDG (vormals § 5 TMG).
 *
 */
export default function Impressum(): JSX.Element {
  return (
    <main className="impressum">
      <h1>Impressum</h1>

      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          Simon Huber
          <br />
            [Straße und Hausnummer]
          <br />
            [PLZ] [Ort]
          <br />
          Deutschland
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: sim-email
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Simon Huber
          <br />
          Holzhamerstraße 22a
          <br />
          84335 Mitterskirchen
        </p>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen
          zu überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen.
        </p>
        <p>
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
          Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir
          diese Inhalte umgehend entfernen.
        </p>
      </section>

      <section>
        <h2>Inhalte Dritter (von Gästen hochgeladene Fotos und Pinnwand-Beiträge)</h2>
        <p>
          Auf dieser Plattform können eingeladene Personen Fotos und Beiträge
          zu einem Event hochladen. Für diese fremden Inhalte sind die
          jeweiligen Ersteller verantwortlich. Wir machen uns diese Inhalte
          nicht zu eigen. Bei Hinweisen auf rechtswidrige Inhalte werden
          diese nach Prüfung umgehend entfernt. Hinweise bitte an die oben
          genannte E-Mail-Adresse.
        </p>
      </section>

      <section>
        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an einem
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </section>

      <p className="impressum__back">
        <Link to="/">Zurück zur Startseite</Link>
      </p>
    </main>
  );
}