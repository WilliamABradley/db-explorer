const { exec, rust, platforms: { windows: windowsConfig } } = require('./utils');
const npmInfo = JSON.parse(process.env.npm_config_argv);
const RELEASE_FLAG = "--release";
const isRelease = npmInfo.cooked.includes(RELEASE_FLAG)
  || npmInfo.original.includes(RELEASE_FLAG)
  || npmInfo.remain.includes(RELEASE_FLAG);

for (const [target] of Object.entries(windowsConfig.targets)) {
  console.log(`Building Windows ${target}`);

  exec(`cargo build --features "windows" --target ${target}${isRelease ? ' --release' : ''}`, {
    cwd: rust.dir,
  });

  console.log();
}