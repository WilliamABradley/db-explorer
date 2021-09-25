@objc(RNEventEmitter)
open class RNEventEmitter: RCTEventEmitter {
  public static var shared: RCTEventEmitter!

  override init() {
    super.init()
    RNEventEmitter.shared = self
  }

  open override func supportedEvents() -> [String] {
    ["DriverManagerEvent"]
  }
}
