# `@100mslive/roomkit-web`

A web component implementation of the HMSPrebuilt component from [roomkit-react](https://www.100ms.live/docs/javascript/v2/quickstart/prebuilt-quickstart) library.

## Usage

```
import '@100mslive/roomkit-web'

Vue

YourComponent.vue

<template>
 <hms-prebuilt room-code="<room-code-goes-here>"></hms-prebuilt>
</template>
<script>
import '@100mslive/roomkit-web';
</script>
```

## Props

`hms-prebuilt` accepts the following props:

`room-code` (optional if room-id and role are being used instead)
- The room code of the room you want to join. You can get the room code from the [100ms dashboard](https://dashboard.100ms.live). This prop can be skipped if the room-id and role are being provided instead.

`logo` (optional)
- An image URL as a string which is displayed in the preview screen and header.

`auth-token` (optional)
- This token is room and role specific. It can be copied from the join room modal on the [dashboard](https://dashboard.100ms.live). Read more about it [here](/get-started/v2/get-started/security-and-tokens#auth-token-for-client-sdks).

`room-id` (optional unless room-code is not being used)
- The room ID of the room you want to join. You can get the room ID from the [dashboard](https://dashboard.100ms.live). It should be specified with the role prop if the room-code is not being provided.

`role` (optional unless room-id is specified)
- A string specifying the role of the peer. Should be specified if the room-id is being used to join the room.

`on-join` (optional)
- A callback function that will be executed after the peer joins the call. 

`on-leave` (optional)
- A callback function that will be executed after the peer leaves the call, the session ends or if the peer gets kicked out.

`options` (optional)
- A stringified JSON object which accepts the following parameters:
    - `userName` (optional): The name to be assigned to the peer.

    - `userId` (optional): The user ID to be assigned to the peer.

> NOTE: The callbacks on-join and on-leave have to be present on the `window` as of now for them to be triggered.