const { exec, platforms, isWindows } = require('./utils');
const ndk = require('./utils/ndk');

const addTargets = (platform) => {
  for (const target of Object.keys(platform.targets)) {
    exec(`rustup target add ${target}`);
  }
};

switch (isWindows) {
  case true:
    addTargets(platforms.windows);
    addTargets(platforms.android);

    console.log();
    ndk.prepareNDK();
    break;

  case false:
    addTargets(platforms.ios);
    break;
}

