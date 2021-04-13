import HMSTransport from "./index"

describe('bleh', () => {
  it('works', done => {
    const transport = new HMSTransport()
    transport.join({
      token: "abc",
      roomId: "sdk"
    }, (error, result) => {
      if(error) {
        done(error)
      }
      
      expect(result.endpoint).toEqual("wss://qa2-us.100ms.live/v2/ws"); // Not an actual test but just to check our init
      done()
    })
  });
});
