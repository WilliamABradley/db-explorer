const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const isWindows = os.platform() === 'win32';

const sharedDir = path.resolve(rootDir, 'shared');
const rustDir = sharedDir;
const windowsDir = path.resolve(rootDir, 'windows');
const androidDir = path.resolve(rootDir, 'android');
const iosDir = path.resolve(rootDir, 'ios');

const rust = {
  dir: rustDir,
  libName: 'libshared',
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
      }
    },
  },
  android: {
    dir: androidDir,
    gradle: {
      root: path.resolve(androidDir, 'build.gradle')
    },
    targets: {
      'armv7-linux-androideabi': {
        ndkName: 'armv7a-linux-androideabi',
        abi: 'armeabi-v7a',
      },
      'aarch64-linux-android': {
        ndkName: 'aarch64-linux-android',
        abi: 'arm64-v8a',
      },
      'x86_64-linux-android': {
        ndkName: 'x86_64-linux-android',
        abi: 'x86_64',
      }
    }
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
    execSync(command, {
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
  fs.copyFileSync(source, dest);
};

const link = (source, dest) => {
  console.log(`Linking ${source} > ${dest}`);
  fs.linkSync(source, dest);
};

const rmIfExists = (source) => {
  if (fs.existsSync(source)) {
    console.log(`Deleting existing ${source}`);
    fs.rmSync(source, { recursive: true, force: true });
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
  platforms,
  allTargets,
  exec,
  copy,
  link,
  rmIfExists,
  optExtension,
};