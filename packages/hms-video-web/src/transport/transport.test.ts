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
      
      console.log(result)
      expect(result).toEqual(2);
      done()
    })
  });
});
