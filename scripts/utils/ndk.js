const fs = require('fs');
const path = require('path');
const os = require('os');
const { copy, optExtension, platforms: { android: androidConfig }, sharedDir } = require('.');

function prepareNDK() {
  const localToolchainDir = path.resolve(sharedDir, '.NDK');
  const ndkHome = process.env.NDK;

  const gradleData = fs.readFileSync(androidConfig.gradle.root, 'utf-8');
  const targetSDKVersionMatcher = gradleData.matchAll(/targetSdkVersion ?= ?(.*)/g);
  const targetSDKVersion = targetSDKVersionMatcher.next().value[1];
  console.log(`Android SDK Target Version: ${targetSDKVersion}`);

  if (!fs.existsSync(ndkHome)) {
    throw new Error('NDK Toolchain not found in environment variables!');
  }

  if (fs.existsSync(localToolchainDir)) {
    console.log('Deleting existing NDK folder');
    fs.rmSync(localToolchainDir, { recursive: true, force: true });
  }
  fs.mkdirSync(localToolchainDir, { recursive: true });

  let platformBinaryFolder;
  switch (os.platform()) {
    case 'win32':
      platformBinaryFolder = 'windows-x86_64';
      break;

    case 'darwin':
      platformBinaryFolder = 'darwin-x86_64';
      break;

    case 'linux':
      platformBinaryFolder = 'linux-x86_64';
      break;

    default:
      throw new Error('Unknown prebuilt see: https://developer.android.com/ndk/guides/other_build_systems');
  }

  const toolchainBinaryDir = path.resolve(ndkHome, 'toolchains', 'llvm', 'prebuilt', platformBinaryFolder, 'bin');
  // Get the expected tools for cargo in the expected place.
  console.log('Strategically copying desired binaries');
  for (const target of Object.keys(androidConfig.targets)) {
    const abi = androidConfig.targets[target].abi || target;
    const clangTool = `${abi}${targetSDKVersion}-clang`;
    let sourceFile = path.resolve(toolchainBinaryDir, optExtension(clangTool, '.cmd'));

    // This adds .cmd regardless of platform, it seems cargo refuses to give configurable platform based options.
    // Also windows refuses to execute a .cmd without it's extension
    const destFile = path.resolve(toolchainBinaryDir, `${abi}-clang.cmd`);

    copy(sourceFile, destFile);
  }

  if (!process.env.PATH.includes(toolchainBinaryDir)) {
    console.log(`Add "${toolchainBinaryDir}" to your PATH`);
  }
}

module.exports = {
  prepareNDK,
};