### Automation Testing

There are two types of tests that are written as of now.

Unit tests - with jest. They test one particular piece of code.

Integration tests - with cypress. They are used to test certain flows

## Unit tests

Jest is used for unit testing. For any references or examples, check [docs](https://jestjs.io/docs/getting-started)

Write a unit test for a feature or bug fix when then can be tested in isolation and with help of mock functions and mock data

The test files should be included near to the module that is being tested.

Currently there are unit tests for NotificationManager, init and jwt in sdk and few others in store.

They are currently automated with github actions and will run on any new commit made to any branch.

## Integration tests

Cypress is used for integration testing. For any references or examples, check [docs](https://docs.cypress.io/guides/overview/why-cypress)

Write a integration test if you want to test in an environment close to the real word scenario. Also choose this when the amount of mocking required to test via unit test is too much or cannot be accurate for the test(ex: webrtc API).

These can be used to test browser related functionality and webrtc related functionality.

They have to be written in cypress/integration folder.

You can refer to the existing ones before starting a new one.

Current integration tests include preview, join, audio/video plugins, add/remove track api

They are currently automated with github actions and will run on any new commit made to any branch.

**Gotcha for integration tests**

While writing cypress tests, keep in mind that if you are trying to write the expect statements inside a promise from the code, they won't be
executed.

For example, for testing addTrack api, let's say you have the following code:

```js
it('should add track', () => {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then(stream => {
      return stream.getVideoTracks()[0];
    })
    .then(videoTrack => {
      actions.addTrack(videoTrack);
      const localPeer = store.getState(selectLocalPeer);
      expect(localPeer.auxiliaryTracks[0]).to.equal(videoTrack.id);
    });
});
```

The above code doesn't run the internal expect statements and simply passes the test.

To avoid this scenarios, two things can be done:

1. Wrap the promise in cy.wrap.

```js
cy.wrap(actions.addTrack(videoTrack));
```

2. Return the promise from a cypress promise/chainable.

```js
cy.get('@onTrackJoin')
  .should('be.called')
  .then(() => {
    return actions.addTrack(videoTrack);
  });
```

For working of example of this, refer to tests in add-track.spec.ts
