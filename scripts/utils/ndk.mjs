import fs from 'fs';
import path from 'path';
import os from 'os';
import {copy, optExtension} from './index.mjs';

export const ndkHome = process.env.NDK;

if (!fs.existsSync(ndkHome)) {
  throw new Error('NDK Toolchain not found in environment variables!');
}

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
    throw new Error(
      'Unknown prebuilt see: https://developer.android.com/ndk/guides/other_build_systems',
    );
}

export const toolchainsPrebuiltDir = path.resolve(
  ndkHome,
  'toolchains',
  'llvm',
  'prebuilt',
);
export const toolchainsDir = path.resolve(
  toolchainsPrebuiltDir,
  platformBinaryFolder,
);
export const toolchainBinaryDir = path.resolve(toolchainsDir, 'bin');

const gradleData = fs.readFileSync(androidConfig.gradle.root, 'utf-8');
const targetSDKVersionMatcher = gradleData.matchAll(
  /targetSdkVersion ?= ?(.*)/g,
);
export const androidTargetSDKVersion = targetSDKVersionMatcher.next().value[1];

export function prepareNDK() {
  console.log(`Android SDK Target Version: ${androidTargetSDKVersion}`);

  // Get the expected tools for cargo in the expected place.
  console.log('Strategically copying desired binaries');
  for (const target of Object.values(androidConfig.targets)) {
    const {ndkName} = target;
    const clangTool = `${ndkName}${androidTargetSDKVersion}-clang`;
    let sourceFile = path.resolve(
      toolchainBinaryDir,
      optExtension(clangTool, '.cmd'),
    );

    // This adds .cmd regardless of platform, it seems cargo refuses to give configurable platform based options.
    // Also windows refuses to execute a .cmd without it's extension
    const destFile = path.resolve(toolchainBinaryDir, `${ndkName}-clang.cmd`);

    copy(sourceFile, destFile);
  }

  if (!process.env.PATH.includes(toolchainBinaryDir)) {
    console.log(`Add "${toolchainBinaryDir}" to your PATH`);
  }
}
