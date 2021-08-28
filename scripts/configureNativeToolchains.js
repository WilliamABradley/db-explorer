const { exec, allTargets } = require('./utils');
const ndk = require('./utils/ndk');

console.log('Ensuring Rust Targets');
for (const target of allTargets) {
  exec(`rustup target add ${target}`);
}

console.log();
ndk.prepareNDK();