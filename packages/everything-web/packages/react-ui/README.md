## Setting up this Template

Kinda Pain.

```bash
yarn init -y
```

Add TypeScript and React as devDeps

```bash
yarn add --dev react react-dom @types/react typescript
```

Add react & react-dom as peerDeeps

```json
"peerDependencies": {
    "react": "^16.8.0",
    "react-dom": "^16.8.0"
 },
```

Add Storybook

```bash
npx sb init
```

Add the Config in `.storybook/main.js`

```js
"stories": [
    "../src/**/*.stories.tsx"
 ],
```

Adding Bundler -> Rollup

```bash
yarn add --dev rollup rollup-plugin-typescript2 @rollup/plugin-commonjs @rollup/plugin-node-resolve rollup-plugin-peer-deps-external rollup-plugin-postcss postcss
```

To Set up Eslint & Prettier used Deepankar's Template

Scripts:

```json
        "lint": "eslint src/**",
        "format": "prettier -w src/**"
```

## Setting up WebApp

```
// .env

REACT_APP_TILE_SHAPE=1-1
REACT_APP_THEME=dark
REACT_APP_COLOR=#2F80FF
REACT_APP_LOGO=
REACT_APP_FONT=Roboto
REACT_APP_SHOW_CHAT='true'
REACT_APP_SHOW_SCREENSHARE='true'
REACT_APP_VIDEO_AVATAR='true'
REACT_APP_TOKEN_GENERATION_ENDPOINT=<TOKEN-END-POINT>
REACT_APP_ENV=prod
REACT_APP_LOGROCKET_ID=<Your Logrocket project ID>
SKIP_PREFLIGHT_CHECK=true

```
