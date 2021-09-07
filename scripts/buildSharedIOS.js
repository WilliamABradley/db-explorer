const { exec, rust, platforms } = require('./utils');

console.log(`Building iOS universal`);

exec(`cargo lipo --features "ios" --no-default-features --release`, {
  cwd: rust.dir,
});

exec(`pod install`, {
  cwd: platforms.ios.dir,
});