const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Metro no resuelve bien `exports` con comodín (`./utils/*`) en `@better-auth/core`.
 * `@better-auth/expo` importa `@better-auth/core/utils/json` → falla el bundle web si no se fuerza la ruta.
 */
const betterAuthCoreUtilsJson = path.resolve(
  __dirname,
  'node_modules',
  '@better-auth',
  'core',
  'dist',
  'utils',
  'json.mjs',
);

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@better-auth/core/utils/json') {
    return {
      type: 'sourceFile',
      filePath: betterAuthCoreUtilsJson,
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
