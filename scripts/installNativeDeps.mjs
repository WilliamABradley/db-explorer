import {exec, platforms, isWindows, findExecutable} from './utils/index.mjs';

const addTargets = platform => {
  for (const [target, info] of Object.entries(platform.targets)) {
    exec(`rustup target add ${target}`);

    exec(
      `vcpkg install openssl:${info.vcpkgName}${
        target.includes('windows') ? '-static-md' : ''
      }`,
    );
  }
};

const ensureVCPKG = () => {
  const vcpkgPath = findExecutable('vcpkg');

  if (!vcpkgPath) {
    console.error('vcpkg needs to be installed, and added to the PATH');
    process.exit(-1);
  }
};

const ensurePatchElf = () => {
  const patchElfPath = findExecutable('patchelf', {wsl: true});

  if (!patchElfPath) {
    console.error(
      'patchelf needs to be installed (WSL on Windows), and added to the PATH',
    );
    process.exit(-1);
  }
};

const ensurePkgConfig = () => {
  const pkgConfigPath = findExecutable('pkg-config');

  if (!pkgConfigPath) {
    console.error('pkg-config needs to be installed, and added to the PATH');
    process.exit(-1);
  }
};

const ensurePerl = () => {
  const perlPath = findExecutable('perl');

  if (!perlPath) {
    console.error('Perl needs to be installed (Use MSYS2 on Windows)');
    process.exit(-1);
  }
};

const targets =
  process.argv[2]?.split(',') ?? (isWindows ? ['windows', 'android'] : ['ios']);
console.log(`Ensuring Native Dependencies for ${JSON.stringify(targets)}`);

// Everything needs vcpkg
ensureVCPKG();

for (const target of targets) {
  switch (target) {
    case 'windows':
      addTargets(platforms.windows);
      break;

    case 'android':
      ensurePerl();
      ensurePatchElf();
      addTargets(platforms.android);

      console.log();
      import('./utils/ndk.mjs').then(ndk => ndk.prepareNDK());

      break;

    case 'ios':
      ensurePkgConfig();
      addTargets(platforms.ios);
      break;

    default:
      throw new Error(`Unknown Target: ${target}`);
  }
}
