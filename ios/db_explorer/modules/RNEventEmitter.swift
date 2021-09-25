@objc(RNEventEmitter)
open class RNEventEmitter: RCTEventEmitter {
  public static var shared: RCTEventEmitter!

  override init() {
    super.init()
    RNEventEmitter.shared = self
  }
  
  @objc public override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  open override func supportedEvents() -> [String] {
    ["DriverManagerEvent"]
  }
}
