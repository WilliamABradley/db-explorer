import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as url from 'url';
import { execSync } from 'child_process';

process.env.VCPKG_ROOT = process.env.VCPKG_ROOT ?? `${process.env.HOME}/vcpkg`;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, '..', '..');
export const isWindows = os.platform() === 'win32';

export const sharedDir = path.resolve(rootDir, 'shared');
export const rustDir = sharedDir;
export const libsDir = path.resolve(sharedDir, '.libs');
export const windowsDir = path.resolve(rootDir, 'windows');
export const androidDir = path.resolve(rootDir, 'android');
export const iosDir = path.resolve(rootDir, 'ios');

export const rust = {
  dir: rustDir,
  libName: 'libdb_explorer_shared',
};

export const platforms = {
  windows: {
    dir: windowsDir,
    targets: {
      'x86_64-pc-windows-msvc': {
        platform: 'x64',
        vcpkgName: 'x64-windows',
      },
      'aarch64-pc-windows-msvc': {
        platform: 'ARM64',
        vcpkgName: 'arm64-windows',
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
        vcpkgName: 'arm-android',
      },
      'aarch64-linux-android': {
        platform: 'arm64',
        ndkName: 'aarch64-linux-android',
        abiName: 'arm64-v8a',
        libName: 'aarch64-linux-android',
        vcpkgName: 'arm64-android',
      },
      'x86_64-linux-android': {
        platform: 'x86_64',
        ndkName: 'x86_64-linux-android',
        abiName: 'x86_64',
        libName: 'x86_64-linux-android',
        vcpkgName: 'x64-android',
      },
    },
  },
  ios: {
    dir: iosDir,
    targets: {
      'aarch64-apple-ios': {
        vcpkgName: 'arm64-ios',
      },
      'x86_64-apple-ios': {
        vcpkgName: 'x64-ios',
      },
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
export const exec = (command, options) => {
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
    if (options?.throw !== false) {
      console.error(e.message);
      process.exit(e.code);
    }
    return null;
  }
};

export const copy = (source, dest) => {
  console.log(`Copying ${source} > ${dest}`);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(source)) {
      copy(path.resolve(source, item), path.resolve(dest, item));
    }
  } else {
    fs.copyFileSync(source, dest);
  }
};

export const link = (source, dest) => {
  console.log(`Linking ${source} > ${dest}`);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(source)) {
      link(path.resolve(source, item), path.resolve(dest, item));
    }
  } else {
    fs.linkSync(source, dest);
  }
};

export const rmIfExists = source => {
  if (fs.existsSync(source)) {
    console.log(`Deleting existing ${source}`);
    fs.rmSync(source, { recursive: true, force: true });
  }
};

export const optExtension = (path, ext) => {
  if (os.platform() === 'win32') {
    return path + ext;
  }
  return path;
};

export const findExecutable = exe => {
  let appPath;
  switch (os.platform()) {
    case 'win32':
      appPath = exec(`where.exe ${exe}`, { stdio: 'pipe', throw: false })?.toString('utf8');
      break;

    default:
      appPath = exec(`which ${exe}`, { stdio: 'pipe', throw: false })?.toString('utf8');
      break;
  }
  return appPath;
};
