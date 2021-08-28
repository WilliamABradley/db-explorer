import Foundation

@objc(DriverManager)
class DriverManager : NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc func greet(_ person: NSString, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let input = String(person)
    let response = say_hello(input)
    let result = String(cString: response!)
    free(UnsafeMutablePointer(mutating: response))
    resolve(result)
  }
}
