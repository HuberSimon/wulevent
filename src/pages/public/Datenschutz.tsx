import type { JSX } from "react";
import "./LegalPages.css";
import { Link } from "react-router-dom";

/**
 * Datenschutzerklärung gemäß Art. 13/14 DSGVO.
 *
 * WICHTIG – bitte vor Veröffentlichung prüfen/ausfüllen:
 * - Alle Platzhalter in eckigen Klammern [ ] ersetzen.
 * - Mit Google (Firebase) und Cloudinary solltet ihr jeweils einen
 *   Auftragsverarbeitungsvertrag (AVV) abschließen bzw. die Standard-
 *   vertragsklauseln (SCC) nutzen, da beide Anbieter Daten ggf. auch
 *   in den USA verarbeiten (Drittlandtransfer, Art. 44 ff. DSGVO).
 *   - Firebase: Google bietet einen DPA inkl. SCC an, im Firebase/
 *     Google Cloud Console-Account abschließbar.
 *   - Cloudinary: AVV/DPA ebenfalls über deren Account-Einstellungen
 *     bzw. auf Anfrage verfügbar – unbedingt abschließen.
 * - Sobald ihr euch für Cookies/Analytics entscheidet, den Abschnitt
 *   "Cookies und Tracking" entsprechend anpassen und ggf. ein
 *   Cookie-Consent-Banner einbauen (Pflicht bei nicht technisch
 *   notwendigen Cookies, § 25 TTDSG / ePrivacy).
 * - Diese Vorlage ersetzt keine Rechtsberatung im Einzelfall.
 */
export default function Datenschutz(): JSX.Element {
  return (
    <main className="datenschutz">
      <h1>Datenschutzerklärung</h1>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO)
          ist:
        </p>
        <p>
          [Vorname] [Nachname]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ] [Ort]
          <br />
          E-Mail: [deine-email@beispiel.de]
        </p>
      </section>

      <section>
        <h2>2. Überblick: Welche Daten wir verarbeiten</h2>
        <p>
          Diese Plattform ermöglicht es registrierten Nutzern
          ("Veranstalter"), private Events (z.B. Hochzeiten, Geburtstage) zu
          erstellen und Gäste einzuladen. Gäste können ohne eigene
          Registrierung passwortgeschützt auf eine Event-Seite zugreifen,
          dort zu- oder absagen, Fotos hochladen und Beiträge auf einer
          digitalen Pinnwand veröffentlichen. Dabei werden folgende
          Kategorien personenbezogener Daten verarbeitet:
        </p>
        <ul>
          <li>Konto- und Kontaktdaten der Veranstalter (E-Mail, Passwort)</li>
          <li>Event-Daten (Titel, Datum, Ort, Beschreibung, Event-Passwort)</li>
          <li>
            Rückmeldedaten der Gäste (Name, Zu-/Absage, ggf. Anzahl
            Begleitpersonen, Kommentare)
          </li>
          <li>von Gästen hochgeladene Fotos</li>
          <li>Pinnwand-Beiträge (Texte, ggf. Namen/Pseudonyme)</li>
          <li>technische Daten (IP-Adresse, Zugriffszeiten, Logdaten)</li>
        </ul>
      </section>

      <section>
        <h2>3. Hosting und Infrastruktur</h2>
        <h3>Firebase (Google Ireland Limited)</h3>
        <p>
          Wir nutzen Firebase (Authentication, Datenbank/Firestore, ggf.
          Hosting) der Google Ireland Limited, Gordon House, Barrow Street,
          Dublin 4, Irland, als Auftragsverarbeiter zur Speicherung von
          Konto-, Event-, RSVP- und Pinnwand-Daten. Eine Verarbeitung kann
          dabei auch auf Servern außerhalb der EU/des EWR, einschließlich
          den USA, erfolgen. Google hat sich zur Einhaltung der EU-
          Standardvertragsklauseln (SCC) verpflichtet, die ein angemessenes
          Datenschutzniveau sicherstellen sollen.
        </p>
        <p>
          Weitere Informationen:{" "}
          <a
            href="https://firebase.google.com/support/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            firebase.google.com/support/privacy
          </a>
        </p>

        <h3>Cloudinary</h3>
        <p>
          Von Gästen und Veranstaltern hochgeladene Fotos werden über
          Cloudinary Ltd. gespeichert und ausgeliefert. Auch hier ist eine
          Verarbeitung außerhalb der EU/des EWR, einschließlich den USA,
          möglich.
        </p>
        <p>
          Weitere Informationen:{" "}
          <a
            href="https://cloudinary.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            cloudinary.com/privacy
          </a>
        </p>

        <p>
          Rechtsgrundlage für den Einsatz beider Dienste ist Art. 6 Abs. 1
          lit. b DSGVO (Erfüllung des Nutzungsvertrags) sowie Art. 6 Abs. 1
          lit. f DSGVO (berechtigtes Interesse an einem technisch
          zuverlässigen und sicheren Betrieb).
        </p>
      </section>

      <section>
        <h2>4. Registrierung als Veranstalter</h2>
        <p>
          Zur Erstellung eines Kontos erheben wir E-Mail-Adresse und
          Passwort (verschlüsselt gespeichert über Firebase Authentication).
          Diese Daten werden benötigt, um ein Event anzulegen und zu
          verwalten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung).
        </p>
      </section>

      <section>
        <h2>5. Event-Erstellung und Passwortschutz</h2>
        <p>
          Veranstalter können ein Event mit Titel, Datum, Ort und weiteren
          Angaben erstellen. Der Zugriff für Gäste wird über ein
          Event-Passwort geschützt, das der Veranstalter selbst an seine
          Gäste weitergibt. Wir empfehlen, dieses Passwort nur über sichere
          Kanäle (z.B. persönlich, verschlüsselte Nachricht) zu teilen, da
          wir die Weitergabe außerhalb unserer Plattform nicht
          kontrollieren können.
        </p>
      </section>

      <section>
        <h2>6. Rückmeldungen, Fotos und Pinnwand-Beiträge der Gäste</h2>
        <p>
          Gäste können, ohne ein eigenes Konto anzulegen, über das
          Event-Passwort auf die Event-Seite zugreifen und dort
        </p>
        <ul>
          <li>eine Zu- oder Absage mit Namen abgeben,</li>
          <li>Fotos hochladen,</li>
          <li>Beiträge auf der Pinnwand veröffentlichen.</li>
        </ul>
        <p>
          Diese Angaben sind freiwillig, aber zur Nutzung der jeweiligen
          Funktion erforderlich. Sie sind für alle Personen sichtbar, die
          im Besitz des Event-Passworts sind – Veranstalter sollten ihre
          Gäste hierauf hinweisen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
          DSGVO (Erfüllung des Nutzungsverhältnisses zwischen Gast und
          Plattform) bzw. Art. 6 Abs. 1 lit. f DSGVO, soweit kein
          Vertragsverhältnis vorliegt.
        </p>
        <p>
          Für Inhalte, die Gäste selbst hochladen (Fotos, Pinnwand-Texte),
          ist der jeweilige Gast als Hochladender selbst verantwortlich,
          insbesondere im Hinblick auf Persönlichkeits- und Urheberrechte
          abgebildeter oder erwähnter Dritter. Bitte nur Fotos hochladen,
          bei denen die abgebildeten Personen einverstanden sind.
        </p>
      </section>

      <section>
        <h2>7. Speicherdauer und Löschung</h2>
        <p>
          Event-Daten, RSVP-Antworten, Fotos und Pinnwand-Beiträge werden
          gespeichert, solange das Event vom Veranstalter nicht gelöscht
          wird. Der Veranstalter kann sein Event und die zugehörigen Daten jederzeit
          über Event button löschen. Konto-Daten werden
          bis zur Löschung des Nutzerkontos gespeichert.
        </p>
      </section>

      <section>
        <h2>8. Cookies und Tracking</h2>
        <p>
          Wir setzen aktuell nur technisch notwendige Cookies/Speicher-
          mechanismen ein, die für den Login (Session-Verwaltung über
          Firebase Authentication) erforderlich sind. Diese sind gemäß § 25
          Abs. 2 TTDSG bzw. Art. 6 Abs. 1 lit. f DSGVO ohne separate
          Einwilligung zulässig, da sie für den Betrieb der Plattform
          unbedingt erforderlich sind.
        </p>
        <p>
          Sollten künftig zusätzliche Cookies oder Analyse-/Tracking-Tools
          eingesetzt werden, wird diese Datenschutzerklärung entsprechend
          aktualisiert und – soweit erforderlich – vorab eine Einwilligung
          eingeholt.
        </p>
      </section>

      <section>
        <h2>9. Empfänger und Drittlandtransfer</h2>
        <p>
          Eine Übermittlung personenbezogener Daten erfolgt ausschließlich
          an die in Abschnitt 3 genannten Auftragsverarbeiter (Firebase/
          Google, Cloudinary) sowie an Personen, die im Besitz des jeweiligen
          Event-Passworts sind. Eine Weitergabe an sonstige Dritte oder zu
          Werbezwecken findet nicht statt.
        </p>
      </section>

      <section>
        <h2>10. Ihre Rechte</h2>
        <p>Betroffene Personen haben das Recht auf:</p>
        <ul>
          <li>Auskunft über die verarbeiteten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung ("Recht auf Vergessenwerden", Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung dieser Rechte wenden Sie sich an die in Abschnitt 1
          genannte Kontaktadresse. Außerdem besteht ein Beschwerderecht bei
          einer Datenschutz-Aufsichtsbehörde, z.B. der für [Bundesland]
          zuständigen Landesdatenschutzbehörde.
        </p>
      </section>

      <section>
        <h2>11. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Maßnahmen ein, um Ihre
          Daten gegen Verlust, Missbrauch und unbefugten Zugriff zu
          schützen, u.a. Verschlüsselung der Übertragung (HTTPS) und
          passwortgeschützten Zugriff auf Event-Daten. Ein vollständiger
          Schutz gegen alle Risiken kann jedoch nicht garantiert werden.
        </p>
      </section>

      <p className="datenschutz__stand">Stand: [Monat Jahr]</p>

      <p className="datenschutz__back">
        <Link to="/">Zurück zur Startseite</Link>
      </p>
    </main>
  );
}