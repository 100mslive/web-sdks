Esbuild follows a different approach from other bundles for treeshaking where it keeps the code where there is a possibility of having side effects.

Refer [this](https://github.com/evanw/esbuild/issues/2171#issuecomment-1094064623) for examples.

For that reason, we won't be to tree-shake libs built with esbuild unless we use /_ @**PURE** _/ annotations in code and also wrap things in IIFE's. Since it will not look good writing those things for every components or function, we are going ahead with rollup for acheiving treeshaking.

Also it would need more time to make it work with esbuild as we would need to find ways to restructure our code so it works with that.

# Rollup config:

Rollup provides an option called preserveModules with esm builds which make the libraries built with rollup easily tree-shakeable as esm modules are
tree-shakeable by themselves.

we are using esbuild, commonjs and typescript plugins with rollup to generate both commonjs and esm output along with types.

For reference to the config, check any of react-sdk, react-icons, roomkit-react folder.
