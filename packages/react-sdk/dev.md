### Developer Guidelines

The core is in HMSRoomProvider, there is one major limitation right now that
only one room can be joined at a time.

If adding a new hook or working on a previous one, do keep in mind of
the below things - 

- don't assume anything on how, when or the frequency at which the hook will 
  be called, every hook should have well-defined and documented input/output
  interfaces and should be subscribing to bare minimum things needed to accomplish its job.
- use useCallback to create any function which will be returned by the hook
  and subsequently called by the UI.
- no errors should be swallowed by the hook, if a function call can give error, take
  an explicit handleError to call.
- make sure to use await for async calls, else try catch won't have an effect
- Pull all usage of hooks on top before defining any functions. 
- Prefer IDs to objects for both input arguments and in result object. This
  facilitates writing optimised code on the app layer, as objects are prone to change
  leading to unnecessary re renders on different levels.