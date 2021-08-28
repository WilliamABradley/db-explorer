const { exec, rust, platforms: { windows: windowsConfig } } = require('./utils');

for (const [target] of Object.entries(windowsConfig.targets)) {
  console.log(`Building Windows ${target}`);

  exec(`cargo build --target ${target} --release`, {
    cwd: rust.dir,
  });

  console.log();
}