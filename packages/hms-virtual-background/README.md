# How to use

1. npm i @100mslive/hms-virtual-background
2. import { setVirtualBackground } from '@100mslive/hms-virtual-background'
3. setVirtualBackground accepts 2 parameters :-
   a) background, Its a string, can be one of these 3 parameters: ['default' | 'blur' | 'Image']
   i) 'default' -> No virtual background is set
   ii) 'blur' -> Background will be blurred
   iii) 'Image' -> It's a source URL of image you want to replace your background with
   b) stream: It's the input camera feed on which virtual background will work

   For ex:->
   To blur your background, Use: `setVirtualBackground( background: 'blur', stream: stream )`
   To Add Virtual Image, specify an Image URL in background, Use: setVirtualBackground(background: Image, stream: stream)
   For default mode , Use `setVirtualBackground( background: 'default', stream: stream )`

## Commands

```bash
npm start # or yarn start
```

This builds to `/dist` and runs the project in watch mode so any edits you save inside `src` causes a rebuild to `/dist`.

To do a one-off build, use `npm run build` or `yarn build`.

To run tests, use `npm test` or `yarn test`.
