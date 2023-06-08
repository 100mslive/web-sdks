import React, { useContext } from "react";

export const HMSRoomCompositeContext = React.createContext({
  showPreview: true,
  showLeave: true,
  roomId: "",
  role: "",
  roomCode: "",
  userName: "",
  userId: "",
  endPoints: {},
  onLeave: () => {},
});

HMSRoomCompositeContext.displayName = "HMSRoomCompositeContext";

export const useHMSRoomCompositeContext = () => {
  const context = useContext(HMSRoomCompositeContext);
  if (!context) {
    throw Error(
      "Make sure AppContext.Provider is present at the top level of your application"
    );
  }
  return context;
};
