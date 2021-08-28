const { exec, platforms: { android: androidConfig } } = require('./utils');
const ndk = require('./utils/ndk');

console.log('Ensuring Rust Targets');
for (const target of Object.keys(androidConfig.targets)) {
  exec(`rustup target add ${target}`);
}

ndk.prepareNDK();