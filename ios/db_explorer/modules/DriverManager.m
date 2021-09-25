#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DriverManager, NSObject)

RCT_EXTERN_METHOD(postMessage:(NSString *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
