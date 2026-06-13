import { createContext, useContext, useState } from "react";

type EventContextType = {
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [activeEventId, setActiveEventIdState] = useState<string | null>(
    localStorage.getItem("activeEventId")
  );

  const setActiveEventId = (id: string | null) => {
    setActiveEventIdState(id);

    if (id) {
      localStorage.setItem("activeEventId", id);
    } else {
      localStorage.removeItem("activeEventId");
    }
  };

  return (
    <EventContext.Provider value={{ activeEventId, setActiveEventId }}>
      {children}
    </EventContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used inside EventProvider");
  return ctx;
}