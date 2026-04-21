import React from "react";
import Navbar from "../components/Navbar";

const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div id="root-content">{children}</div>
    </div>
  );
};

export default PrivateLayout;