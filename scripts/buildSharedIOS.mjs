import { exec, rust, platforms } from './utils/index.mjs';

console.log(`Building iOS universal`);

const AARCH64_APPLE_IOS_OPENSSL_DIR = `${process.env.VCPKG_ROOT}/installed/${platforms.ios.targets['aarch64-apple-ios'].vcpkgName}`;
const X86_64_APPLE_IOS_OPENSSL_DIR = `${process.env.VCPKG_ROOT}/installed/${platforms.ios.targets['x86_64-apple-ios'].vcpkgName}`;

exec(`cargo lipo --features "ios" --no-default-features --release`, {
  cwd: rust.dir,
  env: {
    AARCH64_APPLE_IOS_OPENSSL_LIB_DIR: `${AARCH64_APPLE_IOS_OPENSSL_DIR}/lib`,
    AARCH64_APPLE_IOS_OPENSSL_INCLUDE_DIR: `${AARCH64_APPLE_IOS_OPENSSL_DIR}/include`,
    X86_64_APPLE_IOS_OPENSSL_LIB_DIR: `${X86_64_APPLE_IOS_OPENSSL_DIR}/lib`,
    X86_64_APPLE_IOS_OPENSSL_INCLUDE_DIR: `${X86_64_APPLE_IOS_OPENSSL_DIR}/include`,
  },
});

exec(`pod install`, {
  cwd: platforms.ios.dir,
});
