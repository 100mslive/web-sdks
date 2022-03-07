// @ts-check
import { createSignal } from 'solid-js';
import { useHMSActions } from '@100mslive/solid-sdk';

function Join() {
  const hmsActions = useHMSActions();
  const [inputValues, setInputValues] = createSignal({
    name: 'Eswar',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNWZmNTg4MzE4MGI2Njk2OWUxZmIzNWZjIiwicm9vbV9pZCI6IjYwZjFlNzk0Zjg4MTE3YjllNDdiZjVlMiIsInVzZXJfaWQiOiI1ZmY1ODgzMTgwYjY2OTY5ZTFmYjM1ZjgiLCJyb2xlIjoidGVhY2hlciIsImp0aSI6IjdjNmI4NDM3LWQ2NzgtNDE4MS1hOWRhLTgxZmRmNzVkN2M1YSIsInR5cGUiOiJhcHAiLCJ2ZXJzaW9uIjoyLCJleHAiOjE2NDY2NzYxMTN9.ntcuE5HMMIeetZxSfJI9-EIPKfL_vfVLOJRjHx6sf8U peerId=fcf80d70-88e7-411f-99f9-76260c2f7481',
  });

  const handleInputChange = e => {
    setInputValues(prevValues => ({
      ...prevValues,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    hmsActions.join({
      userName: inputValues().name,
      authToken: inputValues().token,
      initEndpoint: 'https://qa-init.100ms.live/init',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Join Room</h2>
      <div className="input-container">
        <input
          required
          value={inputValues().name}
          onChange={handleInputChange}
          id="name"
          type="text"
          name="name"
          placeholder="Your name"
        />
      </div>
      <div className="input-container">
        <input
          required
          value={inputValues().token}
          onChange={handleInputChange}
          id="token"
          type="text"
          name="token"
          placeholder="Auth token"
        />
      </div>
      <button className="btn-primary">Join</button>
    </form>
  );
}

export default Join;
