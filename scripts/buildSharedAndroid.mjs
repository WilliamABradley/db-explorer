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
  const buildTargetFolder = path.resolve(rust.dir, 'target', target);

  const buildBinary = path.resolve(buildTargetFolder, 'release', rustBinary);
  const destBinary = path.resolve(abiJniFolder, rustBinary);
  rmIfExists(destBinary);

  exec(
    `cargo build --features "android" --no-default-features --target ${target} --release`,
    {
      cwd: rust.dir,
    },
  );

  console.log();
  link(buildBinary, destBinary);
  console.log();
}
