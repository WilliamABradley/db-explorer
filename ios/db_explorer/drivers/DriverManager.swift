import Foundation

@objc(DriverManager)
class DriverManager : NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc func postMessage(_ data: NSString, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let input = String(data)
    let response = receive_message(input)
    let result = String(cString: response!)
    free(UnsafeMutablePointer(mutating: response))
    resolve(result)
  }
}
