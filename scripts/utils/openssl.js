const fs = require('fs');
const path = require('path');
const { exec, libsDir, isWindows, platforms } = require('.');
const { androidTargetSDKVersion, ndkHome, toolchainBinaryDir } = require('./ndk');

const destDir = path.resolve(libsDir, 'openssl_for_ios_and_android');
const scriptsDir = path.resolve(destDir, 'tools');
const outDir = path.resolve(destDir, 'output');

// On windows, we use wsl to compile openssl
const NDK_PATH = isWindows ? process.env.NDK_LINUX : ndkHome;
let openSSLVersion = '';

function fetchOpenSSLScripts() {
  if (!fs.existsSync(libsDir)) {
    fs.mkdirSync(libsDir, { recursive: true });
  }

  console.log('Cloning Android+iOS Open SSL Repo');
  if (!fs.existsSync(destDir)) {
    exec(`git clone https://github.com/leenjewel/openssl_for_ios_and_android`, {
      cwd: libsDir,
    });
  } else {
    exec('git pull origin master', {
      cwd: destDir,
    });
  }
  console.log();

  const matchOpenSSLVersion = /version="(.*)"/g;
  //const openSSLBuilder = 
}

function ensureOpenSSLToolsReady() {
  fetchOpenSSLScripts();

  // Ensure pkg-config is installed.
  const pkgConfigPath = exec('bash -c \"which pkg-config\"', { stdio: 'pipe' })?.toString();
  if (!pkgConfigPath) {
    if (isWindows) {
      console.error('open wsl and run \"sudo apt-get install -y pkg-config\"');
      process.exit(-1);
    } else {
      exec('brew install pkg-config');
    }
  }

  if (!NDK_PATH) {
    console.error('can\'t find NDK, for windows this must be environment variable named NDK_LINUX, as this is compiled with WSL, otherwise it must be in the NDK Environment variable.');
    process.exit(-1);
  }
}

function getOrBuildOpenSSLDir(target) {
  ensureOpenSSLToolsReady();
  const info = platforms.android.targets[target];
  const targetOutDir = path.resolve(outDir, 'android', `openssl-${info.abiName}`);

  // Only build if not exists.
  if (!fs.existsSync(path.resolve(targetOutDir, 'bin'))) {
    console.log(`Building OpenSSL for ${target}`);
    exec(`bash ./build-android-openssl.sh ${info.platform}`, {
      cwd: scriptsDir,
      env: {
        api: androidTargetSDKVersion,
        ANDROID_NDK_ROOT: NDK_PATH,
        PKG_CONFIG_PATH: '/usr/lib/pkgconfig',
        // Remove the version postfix, it causes load errors.
        SHLIB_VERSION_NUMBER: '',
        SHLIB_EXT: '_11.so',
        WSLENV: 'api:ANDROID_NDK_ROOT/p:PKG_CONFIG_PATH:SHLIB_VERSION_NUMBER:SHLIB_EXT',
        PATH: isWindows ? `${process.env.PATH};${toolchainBinaryDir}` : process.env.PATH,
      }
    });
  }

  console.log();
  return targetOutDir;
}

module.exports = {
  fetchOpenSSLScripts,
  ensureOpenSSLToolsReady,
  getOrBuildOpenSSLDir,
};