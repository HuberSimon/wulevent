import React from "react";
import Navbar from "../components/Navbar";

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div id="root-content">{children}</div>
    </div>
  );
};

export default PublicLayout;