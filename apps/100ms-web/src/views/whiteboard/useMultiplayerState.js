// @ts-check
import * as React from "react";
import { useRoom } from "./useRoom";

export function useMultiplayerState(roomId) {
  const [app, setApp] = React.useState();
  const [error, setError] = React.useState();
  const [loading, setLoading] = React.useState(true);
  const room = useRoom();
  // const onUndo = useUndo();
  // const onRedo = useRedo();
  // const updateMyPresence = useUpdateMyPresence();
  const rLiveShapes = React.useRef(new Map());
  const rLiveBindings = React.useRef(new Map());
  // const rLiveAssets = React.useRef<LiveMap<string, TDAsset>>();

  const getObjectFromLiveMaps = React.useCallback(() => {
    return {
      shapes: rLiveShapes.current
        ? Object.fromEntries(rLiveShapes.current)
        : {},
      bindings: rLiveBindings.current
        ? Object.fromEntries(rLiveBindings.current)
        : {},
    };
  }, []);

  const mergeShapes = React.useCallback((shapes, bindings) => {
    const lShapes = rLiveShapes.current;
    const lBindings = rLiveBindings.current;
    // const lAssets = rLiveAssets.current;

    // if (!(lShapes && lBindings && lAssets)) return;
    if (!(lShapes && lBindings)) return;
    if (!(shapes && bindings)) return;

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
  }, []);

  // Callbacks --------------
  // Put the state into the window, for debugging.
  const onMount = React.useCallback(
    app => {
      app.loadRoom(roomId);
      app.pause(); // Turn off the app's own undo / redo stack
      window.app = app;
      setApp(app);
    },
    [roomId]
  );

  // Update the live shapes when the app's shapes change.
  const onChangePage = React.useCallback((_app, shapes, bindings, _assets) => {
    mergeShapes(shapes, bindings);
    console.log("onChangePage", {
      shapes,
      bindings,
      rLiveShapes,
      rLiveBindings,
    });
    room.broadcastEvent("shapeState", { shapes, bindings });
  }, []);

  // Handle presence updates when the user's pointer / selection changes
  // const onChangePresence = React.useCallback(
  //   (app: TldrawApp, user: TDUser) => {
  //     updateMyPresence({ id: app.room?.userId, user });
  //   },
  //   [updateMyPresence]
  // );

  // Document Changes --------
  React.useEffect(() => {
    const unsubs = [];
    console.log({ app, room });
    if (!(app && room)) return;
    // Handle errors
    unsubs.push(room.subscribe("error", error => setError(error)));
    // Handle changes to other users' presence
    unsubs.push(
      room.subscribe("others", others => {
        app.updateUsers(
          others
            .toArray()
            .filter(other => other.presence)
            .map(other => other.presence.user)
            .filter(Boolean)
        );
      })
    );
    // Handle events from the room
    unsubs.push(
      room.subscribe("event", e => {
        switch (e.event.name) {
          case "exit": {
            app === null || app === void 0
              ? void 0
              : app.removeUser(e.event.userId);
            break;
          }
        }
      })
    );
    // Send the exit event when the tab closes
    function handleExit() {
      if (!(room && (app === null || app === void 0 ? void 0 : app.room)))
        return;
      room === null || room === void 0
        ? void 0
        : room.broadcastEvent("exit", {
            name: "exit",
            userId: app.room.userId,
          });
    }

    window.addEventListener("beforeunload", handleExit);
    unsubs.push(() => window.removeEventListener("beforeunload", handleExit));

    let stillAlive = true;
    // Setup the document's storage and subscriptions
    async function setupDocument() {
      const storage = await room.getStorage();
      // Migrate previous versions
      // const version = storage.root.get("version");
      // Initialize (get or create) maps for shapes/bindings/assets
      let lShapes = storage.root.get("shapes");
      // if (!lShapes || !("_serialize" in lShapes)) {
      //   storage.root.set("shapes", new LiveMap<string, TDShape>());
      //   lShapes = storage.root.get("shapes");
      // }
      rLiveShapes.current = lShapes;
      let lBindings = storage.root.get("bindings");
      // if (!lBindings || !("_serialize" in lBindings)) {
      //   storage.root.set("bindings", new LiveMap<string, TDBinding>());
      //   lBindings = storage.root.get("bindings");
      // }
      rLiveBindings.current = lBindings;
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
      const handleChanges = (shapes, bindings) => {
        mergeShapes(shapes, bindings);
        const newLiveObjects = getObjectFromLiveMaps();
        console.log("Handle shapeState", {
          shapes,
          bindings,
          rLiveShapes,
          rLiveBindings,
        });
        app === null || app === void 0
          ? void 0
          : app.replacePageContent(
              newLiveObjects.shapes,
              newLiveObjects.bindings,
              {} // Object.fromEntries(lAssets.entries())
            );
      };
      if (stillAlive) {
        unsubs.push(room.subscribe("shapeState", handleChanges));
        // Update the document with initial content
        handleChanges();
        setLoading(false);
      }
    }
    setupDocument();
    return () => {
      stillAlive = false;
      unsubs.forEach(unsub => unsub());
    };
  }, [app]);
  return {
    onMount,
    onChangePage,
    error,
    loading,
  };
}
