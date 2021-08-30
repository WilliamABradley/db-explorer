const fs = require('fs');
const path = require('path');
const { exec, link, rmIfExists, rust, platforms: { android: androidConfig } } = require('./utils');
const { ndkHome, toolchainsDir } = require('./utils/ndk');

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

  const SYSROOT = path.join(ndkHome, 'sysroot');
  process.env.PKG_CONFIG_PATH = '';
  process.env.PKG_CONFIG_SYSROOT_DIR = SYSROOT;
  process.env.PKG_CONFIG_LIBDIR = [
    path.join(SYSROOT, 'usr', 'lib', info.libName),
    path.join(toolchainsDir, 'lib', 'pkgconfig'),
  ].join(':');

  exec(`cargo build --target ${target} --release`, {
    cwd: rust.dir,
  });

  link(buildBinary, destBinary);
  console.log();
}