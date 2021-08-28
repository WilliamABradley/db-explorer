const { exec, rust } = require('./utils');

console.log(`Building iOS universal`);

exec(`cargo lipo --release`, {
  cwd: rust.dir,
});