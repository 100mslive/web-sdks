# `@100mslive/roomkit-web-component`

A web component version of the [roomkit-react](https://www.100ms.live/docs/javascript/v2/quickstart/prebuilt-quickstart) library.

## Usage

```
import '@100mslive/roomkit-web-component'

Vue

YourComponent.vue

<template>
 <hms-prebuilt room-code="<room-code-goes-here>"></hms-prebuilt>
</template>
<script>
import '@100mslive/roomkit-web-component';
</script>
```

## Props

`hms-prebuilt` accepts the following props:

`room-code` (optional)

- The room code of the room you want to join. You can get the room code from the [100ms dashboard](https://dashboard.100ms.live). This prop can be skipped if the roomId and role are being provided instead.

`room-id` (optional)

- The room ID of the room you wish to join. Can be copied from the dashboard and used in combination with `role`

`role` (optional)

- The name of the role you wish to join as. Used in combination with the `room-id`

`auth-token` (optional)

- This room and role specific token can be copied from the corresponding template page from the dashboard

`on-leave` (optional)

- A callback function that will be executed when the user leaves or is removed from the call. It must be present on the window object

`options`

```json
{
  "userName": "",
  "userId": ""
}
```

- `userName` will auto-fill in the call preview, and `userId` will be assigned to the user. Both values are optional
