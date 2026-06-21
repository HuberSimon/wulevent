import {type JSX } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer(): JSX.Element {
  return (
    <footer className="site-footer">
      <nav className="site-footer__links">
        <Link to="/impressum">Impressum</Link>
        <Link to="/datenschutz">Datenschutz</Link>
      </nav>
      <p className="site-footer__copyright">
        {new Date().getFullYear()} Simon Huber / Wulevent
      </p>
    </footer>
  );
}