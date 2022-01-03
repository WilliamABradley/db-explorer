const fs = require('fs');
const path = require('path');
const os = require('os');
const {execSync} = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const isWindows = os.platform() === 'win32';

const sharedDir = path.resolve(rootDir, 'shared');
const rustDir = sharedDir;
const libsDir = path.resolve(sharedDir, '.libs');
const windowsDir = path.resolve(rootDir, 'windows');
const androidDir = path.resolve(rootDir, 'android');
const iosDir = path.resolve(rootDir, 'ios');

const rust = {
  dir: rustDir,
  libName: 'libdb_explorer_shared',
};

const platforms = {
  windows: {
    dir: windowsDir,
    targets: {
      'x86_64-pc-windows-msvc': {
        platform: 'x64',
      },
      'aarch64-pc-windows-msvc': {
        platform: 'ARM64',
      },
    },
  },
  android: {
    dir: androidDir,
    gradle: {
      root: path.resolve(androidDir, 'build.gradle'),
    },
    ndk: {
      version_long: '21.4.7075529',
      version: 'r21e',
    },
    targets: {
      'armv7-linux-androideabi': {
        platform: 'arm',
        ndkName: 'armv7a-linux-androideabi',
        abiName: 'armeabi-v7a',
        libName: 'arm-linux-androideabi',
      },
      'aarch64-linux-android': {
        platform: 'arm64',
        ndkName: 'aarch64-linux-android',
        abiName: 'arm64-v8a',
        libName: 'aarch64-linux-android',
      },
      'x86_64-linux-android': {
        platform: 'x86_64',
        ndkName: 'x86_64-linux-android',
        abiName: 'x86_64',
        libName: 'x86_64-linux-android',
      },
    },
  },
  ios: {
    dir: iosDir,
    targets: {
      'aarch64-apple-ios': {},
      'x86_64-apple-ios': {},
    },
  },
};

const allTargets = [];
for (const platform of Object.values(platforms)) {
  allTargets.push(...Object.keys(platform.targets));
}

/**
 * @param {string} command
 * @param {import('child_process').ExecFileOptionsWithStringEncoding | undefined} options
 */
const exec = (command, options) => {
  console.log(command);
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options,
      env: {
        ...process.env,
        ...(options?.env || {}),
      },
    });
  } catch (e) {
    console.error(e.message);
    process.exit(e.code);
  }
};

const copy = (source, dest) => {
  console.log(`Copying ${source} > ${dest}`);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(dest, {recursive: true});
    for (const item of fs.readdirSync(source)) {
      copy(path.resolve(source, item), path.resolve(dest, item));
    }
  } else {
    fs.copyFileSync(source, dest);
  }
};

const link = (source, dest) => {
  console.log(`Linking ${source} > ${dest}`);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(dest, {recursive: true});
    for (const item of fs.readdirSync(source)) {
      link(path.resolve(source, item), path.resolve(dest, item));
    }
  } else {
    fs.linkSync(source, dest);
  }
};

const rmIfExists = source => {
  if (fs.existsSync(source)) {
    console.log(`Deleting existing ${source}`);
    fs.rmSync(source, {recursive: true, force: true});
  }
};

const optExtension = (path, ext) => {
  if (os.platform() === 'win32') {
    return path + ext;
  }
  return path;
};

module.exports = {
  isWindows,
  rootDir,
  rust,
  sharedDir,
  libsDir,
  platforms,
  allTargets,
  exec,
  copy,
  link,
  rmIfExists,
  optExtension,
};
