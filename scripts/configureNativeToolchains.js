const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.resolve(rootDir, 'android');
const gradleFile = path.resolve(androidDir, 'build.gradle');
const sharedDir = path.resolve(rootDir, 'shared');
const localToolchainDir = path.resolve(sharedDir, '.NDK');
const ndkHome = process.env.NDK;

const gradleData = fs.readFileSync(gradleFile, 'utf-8');
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
const targets = [
  'aarch64-linux-android',
  ['armv7-linux-androideabi', 'armv7a-linux-androideabi'],
  'i686-linux-android',
  'x86_64-linux-android'
];

const optExtension = (path, ext) => {
  if (os.platform() === 'win32') {
    return path + ext;
  }
  return path;
};

const exec = (command) => {
  console.log(command);
  try {
    execSync(command);
  } catch (e) {
    console.error(e.message);
    process.exit(e.code);
  }
};

const copy = (source, dest) => {
  console.log(`Copying ${source} > ${dest}`);
  fs.copyFileSync(source, dest);
};

const targetInfo = (target, info) => {
  if (!Array.isArray(target)) {
    return target;
  }
  return info === 'abi' ? target[1] : target[0];
};

console.log('Ensuring Rust Targets');
for (const target of targets) {
  exec(`rustup target add ${targetInfo(target)}`);
}

// Get the expected tools for cargo in the expected place.
console.log('Strategically copying desired binaries');
for (const target of targets) {
  const abi = targetInfo(target, 'abi');
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