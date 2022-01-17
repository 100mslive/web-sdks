# Multiplayer Whiteboard using Tldraw

## Internal Hooks

### `useMultiplayerState`

- hook which add listeners to broadcast local changes from Tldraw to remote peers
  and updates changes from remote peers in local whiteboard.
- Returns event handlers which as passed to `<Tldraw />`.

### `useRoom`

- hook that provides subscribe and broadcast methods to be used in useMultiplayerState.
- Abstracts over HMS messaging(filtering only whiteboard messages,...) to provide only relevant stuff to useMultiplayerState

useMultiplayerState and useRoom are internal hooks for Whiteboard functionalites

## Public Hooks

### `useWhiteboardMetadata`

- hook providing the metadata of the Whiteboard in the room - enabled, which peer started the whiteboard, method to set the enable/disable the whiteboard.
- Uses peer.metadata to handle whiteboard state(peer who started it will have peer.metadata.whiteboardEnabled = true - whiteboard owner).

## Workflow:

- `onChangePage` handler is called when there's any change in the state(shapes, bindings, [assets]) of the board with newly added shapes, bindings as args.

- In onChangePage handler, the newly added shapes, bindings are broadcasted to all remote peers in room as 'stateChange' event. Along with this, the newly added state is merged with current state and stored locally(in `rLiveShapes`, `rLiveBindings`)

- The remote peer on receiving the 'stateChange' event, receives the only the new state, merges it with the current state and updates the whiteboard page.

## Special Cases

### New Peer Join

- Newly joined peer has the whiteboard metadata(enabled, owner) already from peer metadata but doesn't have the current state(shapes, bindings) of the whiteboard.

- Hence, the owner will broadcast their board's current state(as 'currentState') when they receive a PEER_JOINED notification and the newly joined peers update their boards.

### Opening/Closing Whiteboard within a call

- Desired behaviour is to persist state across multiple opens/closes of whiteboard within a call.

- To achieve this, the owner will broadcast current state with 'currentState' event before closing the whiteboard. On reopening the whiteboard, the state from the last whiteboard message with store event is retrieved and updated in the whiteboard.

### `stateChange` vs `currentState`

- stateChange broadcast only delta(newly added elements) whereas currentState broadcasts the whole state of the board at that instant.

- On receiving stateChange, received state is merged with current state but on receiving currentState, received state is applied as is.

- The differentiation is to make all peer's board in the same state as the board owner's. Even if the other peers have some state previously which the board owner doesn't, the board is reset to the same state as the board owner.

- Consider scenario in which peers A, B are in a room.
  - A starts the whiteboard, draws some stuff, B receives and updates it.
  - A leaves the room(losing all the state) and joins again.
  - Now when A starts the whiteboard, sends empty state(shapes: {}, bindings: {}) to the B. If used 'stateChange', B receives empty state and merges it with the old state it has, thereby diverging from A's state.
  - To overcome this, we use 'currentState'
