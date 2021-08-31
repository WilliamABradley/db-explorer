const fs = require('fs');
const path = require('path');
const { exec, libsDir, platforms, rmIfExists, copy } = require('.');

const destDir = path.resolve(libsDir, 'android_openssl_bin');
const target_openssl = 'latest';
const actual_openssl = '1.1.1k';
const postfix = '_1_1.so';
const srcDir = path.resolve(destDir, `openssl-${actual_openssl}`);

function getOpenSSLIncludes() {
  if (!fs.existsSync(srcDir)) {
    const openssl_gz = 'openssl.tar.gz';
    exec(`curl -o ${openssl_gz} https://www.openssl.org/source/openssl-${actual_openssl}.tar.gz`, {
      cwd: destDir,
    });

    exec(`tar -xf ${openssl_gz}`, {
      cwd: destDir,
    });
    fs.rmSync(openssl_gz, { force: true });
  }
}

function getOrFetchOpenSSLDir(target) {
  getOpenSSLIncludes();

  const info = platforms.android.targets[target];
  const targetOutDir = path.resolve(destDir, info.platform);
  const targetOutLibDir = path.resolve(targetOutDir, 'lib');
  const targetOutIncludeDir = path.resolve(targetOutDir, 'include');

  // Only do if not exists.
  if (!fs.existsSync(targetOutDir)) {
    fs.mkdirSync(targetOutLibDir, { recursive: true });
    rmIfExists(targetOutIncludeDir);
    copy(path.resolve(srcDir, 'include'), targetOutIncludeDir);

    console.log(`Fetching OpenSSL lib for ${target}`);
    const files = ['libssl', 'libcrypto'];
    for (const file of files) {
      const fullSOName = `${file}${postfix}`;
      exec(`curl -o ${fullSOName} https://raw.githubusercontent.com/KDAB/android_openssl/master/${target_openssl}/${target.platform}/${fullSOName}`, {
        cwd: targetOutLibDir,
      });
    }
  }

  console.log();
  return targetOutDir;
}

module.exports = {
  getOrFetchOpenSSLDir,
};