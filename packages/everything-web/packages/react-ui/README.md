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
