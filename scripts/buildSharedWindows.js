const { exec, rust, platforms: { windows: windowsConfig } } = require('./utils');
const npmInfo = JSON.parse(process.env.npm_config_argv);
const RELEASE_FLAG = "--release";
const isRelease = npmInfo.cooked.includes(RELEASE_FLAG)
  || npmInfo.original.includes(RELEASE_FLAG)
  || npmInfo.remain.includes(RELEASE_FLAG);
const DEBUG_FLAG = "--debug";
const isDebug = !isRelease && process.argv.includes(DEBUG_FLAG);

for (const [target, info] of Object.entries(windowsConfig.targets)) {
  if (isDebug && info.platform !== 'x64') {
    continue;
  }
  console.log(`Building Windows ${target}`);

  // Nightly is required for disabling the shared generics in dev.
  exec(`cargo +nightly build --features "windows" --no-default-features --target ${target}${isRelease ? ' --release' : ''}`, {
    cwd: rust.dir,
  });

  console.log();
}