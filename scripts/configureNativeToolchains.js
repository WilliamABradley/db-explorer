const os = require('os');
const { exec, platforms, isWindows } = require('./utils');
const ndk = require('./utils/ndk');
const { fetchOpenSSLScripts, ensureOpenSSLToolsReady } = require('./utils/openssl');

const addTargets = (platform) => {
  for (const target of Object.keys(platform.targets)) {
    exec(`rustup target add ${target}`);
  }
};

switch (os.platform()) {
  case 'win32':
    addTargets(platforms.windows);
    addTargets(platforms.android);

    console.log();
    ndk.prepareNDK();

    ensureOpenSSLToolsReady();

    fetchOpenSSLScripts();
    break;

  case 'darwin':
    addTargets(platforms.ios);
    break;
}

