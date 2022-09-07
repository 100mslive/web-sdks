### TODO Planned Hooks

#### Breakout Rooms

```ts
function useBreakoutRoles({filter: regexOrArray, filterOut: regexOrArray}) {
  {
        allRoles, // all breakout roles options for this user
        currRole,
        switchToRole() // takes in a role name
    }
}
```

#### Waiting Room

On the guest side who joins a waiting room - 
```ts
// onconfirm if role change is not forced, fn returns true/false
// onapprovval - use this to play a tone maybe
function useWaitingRoom({waitingRoomRole, postApprovalRole, onApproval}) {
    {
        amIInWaitingRoom,
        isConfirmationPending, // boolean, true when role change is not forced
        confirmOrDeny(confirm) // pass in true or false
    }
}
```

On the host side who needs to see who is in waiting room and let them in.
```ts
function useWaitingRoomApprover({waitingRoomRole, postApprovalRole, approverRoles: []}) {
    {
        peersInWaitingRoom,
        approvePeer = (peerID, ask) // force role change to postApprovalRole
    }
}
```

