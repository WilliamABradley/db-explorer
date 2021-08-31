const fs = require('fs');
const path = require('path');
const { exec, link, rmIfExists, rust, platforms: { android: androidConfig }, copy } = require('./utils');
const { getOrFetchOpenSSLDir } = require('./utils/openssl');

const jniFolder = path.resolve(androidConfig.dir, 'app', 'src', 'main', 'jniLibs');
const rustBinary = `${rust.libName}.so`;

for (const [target, info] of Object.entries(androidConfig.targets)) {
  console.log(`Building Android ${target}`);

  const abiJniFolder = path.resolve(jniFolder, info.abiName);
  fs.mkdirSync(abiJniFolder, { recursive: true });
  const buildTargetFolder = path.resolve(rust.dir, 'target', target);

  const buildBinary = path.resolve(buildTargetFolder, 'release', rustBinary);
  const destBinary = path.resolve(abiJniFolder, rustBinary);
  rmIfExists(destBinary);

  const openSSLDir = getOrFetchOpenSSLDir(target);

  exec(`cargo build --target ${target} --release`, {
    cwd: rust.dir,
    env: {
      OPENSSL_DIR: openSSLDir,
    }
  });

  console.log();
  console.log('Copying OpenSSL Libs');
  link(buildBinary, destBinary);
  for (const item of fs.readdirSync(openSSLDir)) {
    const dest = path.resolve(abiJniFolder, item);
    rmIfExists(dest);
    link(path.resolve(openSSLDir, item), dest);
  }

  console.log();
}