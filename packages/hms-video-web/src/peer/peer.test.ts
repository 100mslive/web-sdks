import Peer from "./index"

describe("peer", () => {
  it("returns peer object when initialised", () => {
    const name = "John"
    const isLocal = true
    const peer = new Peer({name, isLocal})
    
    expect(peer).toBeInstanceOf(Peer)
    expect(peer.name).toBe(name)
    expect(peer.isLocal).toBe(isLocal)
  })

  it("has unique peerId", () => {
    const peer1 = new Peer({name: "peer1", isLocal: true})
    const peer2 = new Peer({name: "peer2", isLocal: true})

    expect(peer1.peerId).toEqual(expect.not.stringMatching(peer2.peerId))
  })
})