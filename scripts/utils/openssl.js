const fs = require('fs');
const path = require('path');
const { exec, libsDir, isWindows, platforms } = require('.');
const { androidTargetSDKVersion, ndkHome, toolchainBinaryDir } = require('./ndk');

if (!fs.existsSync(libsDir)) {
  fs.mkdirSync(libsDir, { recursive: true });
}

const destDir = path.resolve(libsDir, 'openssl_for_ios_and_android');

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

const scriptsDir = path.resolve(destDir, 'tools');

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

const info = platforms.android.targets['aarch64-linux-android'];
exec(`bash ./build-android-openssl.sh ${info.platform}`, {
  cwd: scriptsDir,
  env: {
    api: androidTargetSDKVersion,
    ANDROID_NDK_ROOT: ndkHome,
    PKG_CONFIG_PATH: '/usr/lib/pkgconfig',
    WSLENV: 'api:ANDROID_NDK_ROOT/p:PKG_CONFIG_PATH',
    PATH: isWindows ? `${process.env.PATH};${toolchainBinaryDir}` : process.env.PATH,
  }
});