const fs = require('fs');
const path = require('path');
const { exec, link, rmIfExists, rust, platforms: { android: androidConfig } } = require('./utils');

const jniFolder = path.resolve(androidConfig.dir, 'app', 'src', 'main', 'jniLibs');
const rustBinary = `${rust.libName}.so`;

for (const [target, info] of Object.entries(androidConfig.targets)) {
  console.log(`Building Android ${target}`);

  const abiJniFolder = path.resolve(jniFolder, info.abi);
  fs.mkdirSync(abiJniFolder, { recursive: true });
  const buildTargetFolder = path.resolve(rust.dir, 'target', target);
  const buildBinary = path.resolve(buildTargetFolder, 'release', rustBinary);
  const destBinary = path.resolve(abiJniFolder, rustBinary);
  rmIfExists(destBinary);

  exec(`cargo build --target ${target} --release`);

  link(buildBinary, destBinary);
  console.log();
}