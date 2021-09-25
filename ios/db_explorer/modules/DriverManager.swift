@objc(DriverManager)
class DriverManager : NSObject {
  public static var shared: DriverManager?
  let logger = Logger()
  
  override init() {
    super.init()
    DriverManager.shared = self
    
    logger.Info("Initialising DriverManager")
    db_shared_init()
    
    db_shared_register_postback_handler { messagePtr in
      DriverManager.shared?.receiveMessage(messagePtr)
    }
  }
  
  deinit {
    logger.Info("Closing DriverManager")
    db_shared_deinit()
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc func postMessage(
    _ data: NSString,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) -> Void {
    let input = String(data)
    let resultPtr = db_shared_receive_message(input)
    let result = ptrToString(ptr: resultPtr)
    resolve(result)
  }
  
  func receiveMessage(_ messagePtr: UnsafeMutablePointer<CChar>?) -> Void {
    let message = ptrToString(ptr: messagePtr)
    emit(message: message)
  }
  
  func emit(message: String) -> Void {
    RNEventEmitter.shared.sendEvent(withName: "DriverManagerEvent", body: message)
  }
  
  private func ptrToString(ptr: UnsafePointer<CChar>?) -> String {
    let result = String(cString: ptr!)
    db_shared_free_message(UnsafeMutablePointer(mutating: ptr))
    return result
  }
}
