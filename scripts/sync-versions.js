#!/usr/bin/env node
/**
 * This script syncs internal package versions after lerna version bumps.
 * It replaces the deprecated `lerna add` command removed in Lerna v9.
 *
 * Usage: bun scripts/sync-versions.js
 */

const fs = require('fs');
const path = require('path');

const packagesDir = path.resolve(__dirname, '../packages');
const examplesDir = path.resolve(__dirname, '../examples');

function readPackageJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writePackageJson(filePath, pkg) {
  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function getPackageVersion(packageName) {
  const packagePath = path.join(packagesDir, packageName.replace('@100mslive/', ''), 'package.json');
  if (fs.existsSync(packagePath)) {
    return readPackageJson(packagePath).version;
  }
  return null;
}

function syncVersions() {
  console.log('Syncing internal package versions...\n');

  // 1. Sync hms-video-store peer dependency in hms-virtual-background
  const hmsVideoStoreVersion = getPackageVersion('@100mslive/hms-video-store');
  if (hmsVideoStoreVersion) {
    const vbPackagePath = path.join(packagesDir, 'hms-virtual-background', 'package.json');
    const vbPkg = readPackageJson(vbPackagePath);

    if (vbPkg.peerDependencies?.['@100mslive/hms-video-store']) {
      vbPkg.peerDependencies['@100mslive/hms-video-store'] = hmsVideoStoreVersion;
      vbPkg.devDependencies['@100mslive/hms-video-store'] = hmsVideoStoreVersion;
      writePackageJson(vbPackagePath, vbPkg);
      console.log(
        `✔ Updated @100mslive/hms-virtual-background peerDependencies.@100mslive/hms-video-store to ${hmsVideoStoreVersion}`,
      );
    }
  }

  // 2. Sync roomkit-react dependency in prebuilt-react-integration example
  const roomkitReactVersion = getPackageVersion('@100mslive/roomkit-react');
  if (roomkitReactVersion) {
    const examplePackagePath = path.join(examplesDir, 'prebuilt-react-integration', 'package.json');
    if (fs.existsSync(examplePackagePath)) {
      const examplePkg = readPackageJson(examplePackagePath);

      if (examplePkg.dependencies?.['@100mslive/roomkit-react']) {
        examplePkg.dependencies['@100mslive/roomkit-react'] = roomkitReactVersion;
        writePackageJson(examplePackagePath, examplePkg);
        console.log(
          `✔ Updated prebuilt-react-integration dependencies.@100mslive/roomkit-react to ${roomkitReactVersion}`,
        );
      }
    }
  }

  console.log('\nVersion sync complete!');
}

syncVersions();
