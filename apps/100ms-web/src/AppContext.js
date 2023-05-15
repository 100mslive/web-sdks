import React, { useContext } from "react";

export const AppContext = React.createContext({
  showPreview: true,
  showLeave: true,
  roomId: "",
  role: "",
  roomCode: "",
  onLeave: () => {},
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
