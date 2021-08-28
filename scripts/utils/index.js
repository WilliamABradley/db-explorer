const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const isWindows = os.platform() === 'win32';

const sharedDir = path.resolve(rootDir, 'shared');
const androidDir = path.resolve(rootDir, 'android');

const platforms = {
  android: {
    dir: androidDir,
    gradle: {
      root: path.resolve(androidDir, 'build.gradle')
    },
    targets: {
      'aarch64-linux-android': {},
      'armv7-linux-androideabi': {
        abi: 'armv7a-linux-androideabi',
      },
      'i686-linux-android': {},
      'x86_64-linux-android': {}
    }
  },
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

const optExtension = (path, ext) => {
  if (os.platform() === 'win32') {
    return path + ext;
  }
  return path;
};

module.exports = {
  rootDir,
  isWindows,
  platforms,
  sharedDir,
  exec,
  copy,
  optExtension,
};