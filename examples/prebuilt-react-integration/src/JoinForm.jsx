import { useHMSActions } from "@100mslive/react-sdk";
import { useState } from "react";

const JoinForm = () => {
  const hmsActions = useHMSActions();
  const [inputValues, setInputValues] = useState({
    name: "",
    token: "",
  });

  const handleInputChange = (e) => {
    setInputValues((prevValues) => ({
      ...prevValues,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { userName = "", roomCode = "" } = inputValues;

    const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });

    try {
      await hmsActions.join({ userName, authToken });
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <h2>Join Room</h2>
      <div className="input-container">
        <input
          required
          id="name"
          type="text"
          name="name"
          value={inputValues.name}
          onChange={handleInputChange}
          placeholder="Your Name"
        ></input>
      </div>
      <div className="input-container">
        <input
          required
          id="room-code"
          type="text"
          name="roomCode"
          onChange={handleInputChange}
          placeholder="Room Code"
        ></input>
      </div>
      <button className="btn-primary">Join</button>
    </form>
  );
};
export default JoinForm;