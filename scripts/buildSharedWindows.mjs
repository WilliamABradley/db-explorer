import {exec, rust, platforms} from './utils/index.mjs';

const {windows: windowsConfig} = platforms;
const isRelease = !!process.env.npm_config_release;
const isDebug = !isRelease && process.argv.includes('--debug');

for (const [target, info] of Object.entries(windowsConfig.targets)) {
  if (isDebug && info.platform !== 'x64') {
    continue;
  }
  console.log(
    `Building Windows ${target} (${isRelease ? 'Release' : 'Debug'})`,
  );

  // Nightly is required for disabling the shared generics in dev.
  exec(
    `cargo +nightly build --features "windows" --no-default-features --target ${target}${
      isRelease ? ' --release' : ''
    }`,
    {
      cwd: rust.dir,
    },
  );

  console.log();
}
