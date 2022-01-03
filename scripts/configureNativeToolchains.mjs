import os from 'os';
import {exec, platforms} from './utils/index.mjs';
import ndk from './utils/ndk.mjs';

const addTargets = platform => {
  for (const target of Object.keys(platform.targets)) {
    exec(`rustup target add ${target}`);
  }
};

const ensurePerl = () => {
  let perlPath;
  switch (os.platform()) {
    case 'win32':
      perlPath = exec('where.exe perl', {stdio: 'pipe'});
      break;

    default:
      perlPath = exec('which perl', {stdio: 'pipe'});
      break;
  }

  if (!perlPath) {
    console.error('Perl needs to be installed (Use MSYS2 on Windows)');
    process.exit(-1);
  }
};

switch (os.platform()) {
  case 'win32':
    addTargets(platforms.windows);
    addTargets(platforms.android);

    console.log();
    ndk.prepareNDK();

    ensurePerl();
    break;

  case 'darwin':
    addTargets(platforms.ios);
    break;
}
