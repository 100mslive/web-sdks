import React, { useContext } from "react";

export type AppContextType = {
  showPreview?: boolean;
  showLeave?: boolean;
  roomId?: string;
  role?: string;
  roomCode?: string;
  onLeave?: () => void;
};

export const AppContext = React.createContext<AppContextType>({
  showPreview: true,
  showLeave: true,
  roomId: "",
  role: "",
  roomCode: "",
});

AppContext.displayName = "AppContext";

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw Error(
      "Make sure AppContext.Provider is present at the top level of your application"
    );
  }
  return context;
};
