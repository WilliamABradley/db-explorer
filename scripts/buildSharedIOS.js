const { exec, rust } = require('./utils');

console.log(`Building iOS universal`);

exec(`cargo lipo --features "ios" --release`, {
  cwd: rust.dir,
});