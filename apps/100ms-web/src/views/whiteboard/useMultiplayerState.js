// @ts-check
import * as React from "react";
import { useRoom } from "./useRoom";

export function useMultiplayerState(roomId) {
  const [app, setApp] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  const room = useRoom();
  // const onUndo = useUndo();
  // const onRedo = useRedo();
  // const updateMyPresence = useUpdateMyPresence();

  /**
   * Stores current state(shapes, bindings, [assets]) of the whiteboard
   */
  const rLiveShapes = React.useRef(new Map());
  const rLiveBindings = React.useRef(new Map());
  // const rLiveAssets = React.useRef<LiveMap<string, TDAsset>>();

  const getCurrentState = React.useCallback(() => {
    return {
      shapes: rLiveShapes.current
        ? Object.fromEntries(rLiveShapes.current)
        : {},
      bindings: rLiveBindings.current
        ? Object.fromEntries(rLiveBindings.current)
        : {},
    };
  }, []);

  const sendCurrentState = React.useCallback(() => {
    if (room.amIWhiteboardPeer && isReady) {
      room.broadcastEvent("currentState", getCurrentState());
    }
  }, [room, isReady, getCurrentState]);

  const updateLocalState = React.useCallback(
    ({ shapes, bindings, merge = true }) => {
      if (!(shapes && bindings)) return;

      if (merge) {
        const lShapes = rLiveShapes.current;
        const lBindings = rLiveBindings.current;
        // const lAssets = rLiveAssets.current;

        // if (!(lShapes && lBindings && lAssets)) return;
        if (!(lShapes && lBindings)) return;
        Object.entries(shapes).forEach(([id, shape]) => {
          if (!shape) {
            lShapes.delete(id);
          } else {
            lShapes.set(shape.id, shape);
          }
        });

        Object.entries(bindings).forEach(([id, binding]) => {
          if (!binding) {
            lBindings.delete(id);
          } else {
            lBindings.set(binding.id, binding);
          }
        });

        // Object.entries(assets).forEach(([id, asset]) => {
        //   if (!asset) {
        //     lAssets.delete(id);
        //   } else {
        //     lAssets.set(asset.id, asset);
        //   }
        // });
      } else {
        rLiveShapes.current = new Map(Object.entries(shapes));
        rLiveBindings.current = new Map(Object.entries(bindings));
      }
    },
    []
  );

  const applyStateToBoard = React.useCallback(
    state => {
      app === null || app === void 0
        ? void 0
        : app.replacePageContent(
            state.shapes,
            state.bindings,
            {} // Object.fromEntries(lAssets.entries())
          );
    },
    [app]
  );

  // Callbacks --------------
  // Put the state into the window, for debugging.
  const onMount = React.useCallback(
    app => {
      app.loadRoom(roomId);
      app.pause(); // Turn off the app's own undo / redo stack
      // window.app = app;
      setApp(app);
    },
    [roomId]
  );

  // Update the live shapes when the app's shapes change.
  const onChangePage = React.useCallback(
    (_app, shapes, bindings, _assets) => {
      updateLocalState({ shapes, bindings });
      // whiteboardLog("onChangePage", {
      //   shapes,
      //   bindings,
      //   rLiveShapes,
      //   rLiveBindings,
      // });
      room.broadcastEvent("stateChange", { shapes, bindings });

      /**
       * Tldraw thinks that the next update passed to replacePageContent after onChangePage is the own update triggered by onChangePage
       * and the replacePageContent doesn't have any effect if it is a valid update from remote.
       *
       * To overcome this replacePageContent locally onChangePage(not costly - returns from first line).
       *
       * Refer: https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/state/TldrawApp.ts#L684
       */
      applyStateToBoard(getCurrentState());
    },
    [room, updateLocalState, applyStateToBoard, getCurrentState]
  );

  // Handle presence updates when the user's pointer / selection changes
  // const onChangePresence = React.useCallback(
  //   /**
  //    *
  //    * @param {import("@tldraw/tldraw").TldrawApp} app
  //    * @param {import("@tldraw/tldraw").TDUser} user
  //    */
  //   (app, user) => {
  //     whiteboardLog({ id: app.room?.userId, user });
  //     // updateMyPresence({ id: app.room?.userId, user });
  //   },
  //   []
  //   // [updateMyPresence]
  // );

  // Document Changes --------
  React.useEffect(() => {
    const unsubs = [];
    if (!(app && room)) return;

    // Handle errors
    // unsubs.push(room.subscribe("error", error => setError(error)));

    // Handle changes to other users' presence
    // unsubs.push(
    //   room.subscribe("others", others => {
    //     app.updateUsers(
    //       others
    //         .toArray()
    //         .filter(other => other.presence)
    //         .map(other => other.presence.user)
    //         .filter(Boolean)
    //     );
    //   })
    // );

    // Handle events from the room
    // unsubs.push(
    //   room.subscribe("event", e => {
    //     switch (e.event.name) {
    //       case "exit": {
    //         app === null || app === void 0
    //           ? void 0
    //           : app.removeUser(e.event.userId);
    //         break;
    //       }
    //       default:
    //         break;
    //     }
    //   })
    // );

    // Send the exit event when the tab closes
    function handleExit() {
      if (!(room && (app === null || app === void 0 ? void 0 : app.room)))
        return;
      // room === null || room === void 0
      //   ? void 0
      //   : room.broadcastEvent("exit", {
      //       name: "exit",
      //       userId: app.room.userId,
      //     });

      sendCurrentState();
    }

    window.addEventListener("beforeunload", handleExit);
    unsubs.push(() => window.removeEventListener("beforeunload", handleExit));

    let stillAlive = true;

    // Setup the document's storage and subscriptions
    async function setupDocument() {
      // const storage = await room.getStorage();

      // Migrate previous versions
      // const version = storage.root.get("version");

      // Initialize (get or create) maps for shapes/bindings/assets
      // let lShapes = storage.root.get("shapes");
      // if (!lShapes || !("_serialize" in lShapes)) {
      //   storage.root.set("shapes", new LiveMap<string, TDShape>());
      //   lShapes = storage.root.get("shapes");
      // }
      // rLiveShapes.current = lShapes;

      // let lBindings = storage.root.get("bindings");
      // if (!lBindings || !("_serialize" in lBindings)) {
      //   storage.root.set("bindings", new LiveMap<string, TDBinding>());
      //   lBindings = storage.root.get("bindings");
      // }
      // rLiveBindings.current = lBindings;

      // let lAssets: LiveMap<string, TDAsset> = storage.root.get("assets");
      // if (!lAssets || !("_serialize" in lAssets)) {
      //   storage.root.set("assets", new LiveMap<string, TDAsset>());
      //   lAssets = storage.root.get("assets");
      // }
      // rLiveAssets.current = lAssets;
      // if (!version) {
      //   // The doc object will only be present if the document was created
      //   // prior to the current multiplayer implementation. At this time, the
      //   // document was a single LiveObject named 'doc'. If we find a doc,
      //   // then we need to move the shapes and bindings over to the new structures
      //   // and then mark the doc as migrated.
      //   const doc = storage.root.get("doc") as LiveObject<{
      //     uuid: string;
      //     document: TDDocument;
      //     migrated?: boolean;
      //   }>;
      //   // No doc? No problem. This was likely a newer document
      //   if (doc) {
      //     const {
      //       document: {
      //         pages: {
      //           page: { shapes, bindings },
      //         },
      //         // assets,
      //       },
      //     } = doc.toObject();
      //     Object.values(shapes).forEach(shape => lShapes.set(shape.id, shape));
      //     Object.values(bindings).forEach(binding =>
      //       lBindings.set(binding.id, binding)
      //     );
      //     // Object.values(assets).forEach(asset => lAssets.set(asset.id, asset));
      //   }
      // }

      // Save the version number for future migrations
      // storage.root.set("version", 2.1);

      // Subscribe to changes
      const handleChanges = state => {
        if (!state) {
          return;
        }

        const { shapes, bindings, eventName } = state;
        updateLocalState({
          shapes,
          bindings,
          merge: eventName === "stateChange",
        });
        // whiteboardLog("Handle shapeState", {
        //   eventName,
        //   shapes,
        //   bindings,
        //   rLiveShapes,
        //   rLiveBindings,
        // });

        applyStateToBoard(getCurrentState());
      };

      if (stillAlive) {
        unsubs.push(room.subscribe("stateChange", handleChanges));
        unsubs.push(room.subscribe("currentState", handleChanges));

        // On peer join, send whole current state to update the new peer's whiteboard
        unsubs.push(room.subscribe("peerJoin", sendCurrentState));

        setIsReady(true);

        if (room.amIWhiteboardPeer) {
          // On board open, update the document with initial/stored content
          handleChanges(room.getStoredState("currentState"));
          // Send current state to other peers in the room currently
          sendCurrentState();
        } else if (room.shouldRequestState()) {
          /**
           * Newly joined peers request the owner(send peerJoin) for current state
           * and update their boards when they receive "currentState"
           */
          room.broadcastEvent("peerJoin");
        }
      }
    }

    setupDocument();

    return () => {
      stillAlive = false;
      handleExit();
      unsubs.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  return {
    onMount,
    onChangePage,
  };
}
