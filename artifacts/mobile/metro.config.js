const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// Two levels up: artifacts/mobile -> artifacts -> workspace root
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro sees changes in any workspace package
config.watchFolders = [monorepoRoot];

// Teach Metro (and Babel's require()) where to find node_modules.
// Without this, the Metro transform worker resolves packages from the
// pnpm virtual store root and misses packages installed under artifacts/mobile.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
