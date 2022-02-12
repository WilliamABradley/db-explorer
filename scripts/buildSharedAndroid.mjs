import fs from 'fs';
import path from 'path';
import {exec, link, rmIfExists, rust, platforms} from './utils/index.mjs';

const {android: androidConfig} = platforms;
const jniFolder = path.resolve(
  androidConfig.dir,
  'app',
  'src',
  'main',
  'jniLibs',
);
const rustBinary = `${rust.libName}.so`;

for (const [target, info] of Object.entries(androidConfig.targets)) {
  console.log(`Building Android ${target}`);

  const abiJniFolder = path.resolve(jniFolder, info.abiName);
  fs.mkdirSync(abiJniFolder, {recursive: true});
  const buildTargetFolder = path.resolve(rust.dir, 'target', target, 'release');

  const buildBinary = path.resolve(buildTargetFolder, rustBinary);
  const destBinary = path.resolve(abiJniFolder, rustBinary);
  rmIfExists(destBinary);

  const openSSLDir = `${process.env.VCPKG_ROOT}/installed/${info.vcpkgName}`;
  console.log(`OpenSSL Dir: ${openSSLDir}`);

  const sslBinary = 'libssl.so';
  const sslBuildBinary = path.resolve(openSSLDir, 'lib', sslBinary);
  const sslDestBinary = path.resolve(abiJniFolder, sslBinary);
  rmIfExists(sslDestBinary);

  const cryptoBinary = 'libcrypto.so';
  const cryptoBuildBinary = path.resolve(openSSLDir, 'lib', cryptoBinary);
  const cryptoDestBinary = path.resolve(abiJniFolder, cryptoBinary);
  rmIfExists(cryptoDestBinary);

  exec(
    `cargo build --features "android" --no-default-features --target ${target} --release`,
    {
      cwd: rust.dir,
      env: {
        OPENSSL_DIR: openSSLDir,
      },
    },
  );

  console.log();
  link(buildBinary, destBinary);
  link(sslBuildBinary, sslDestBinary);
  link(cryptoBuildBinary, cryptoDestBinary);
  console.log();

  // Patch openssl elf info
  exec(
    `bash -c "patchelf --replace-needed libssl.so.1.1 libssl.so ${rustBinary}"`,
    {
      cwd: abiJniFolder,
    },
  );
  exec(
    `bash -c "patchelf --replace-needed libcrypto.so.1.1 libcrypto.so ${rustBinary}"`,
    {
      cwd: abiJniFolder,
    },
  );
  exec(
    `bash -c "patchelf --replace-needed libcrypto.so.1.1 libcrypto.so ${sslBinary}"`,
    {
      cwd: abiJniFolder,
    },
  );
  exec(`bash -c "patchelf --set-soname libssl.so ${sslBinary}"`, {
    cwd: abiJniFolder,
  });
  exec(`bash -c "patchelf --set-soname libcrypto.so ${cryptoBinary}"`, {
    cwd: abiJniFolder,
  });
}
