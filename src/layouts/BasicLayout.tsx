import type { ReactNode } from "react";
import Footer from "../components/Footer";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-container">
      <main style={{ minHeight: "90vh" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}