import Foundation

@objc(DriverManager)
class DriverManager : NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc func postMessage(_ data: NSString, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.global(qos: .background).async {
      let input = data.cString(using: String.Encoding.utf8.rawValue)
      let response = receive_message(input)
      let result = String(cString: response!)
      free_message(UnsafeMutablePointer(mutating: response))
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
}
