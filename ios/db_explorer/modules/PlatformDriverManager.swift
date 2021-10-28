@objc(PlatformDriverManager)
class PlatformDriverManager : NSObject {
  public static var shared: PlatformDriverManager?
  let logger = Logger()
  let encoder = JSONEncoder()
  let decoder = JSONDecoder()
  
  override init() {
    super.init()
    PlatformDriverManager.shared = self
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc func postMessage(
    _ data: NSString,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) -> Void {
    do {
      let message: DriverManagerInboundMessage
      do {
        message = try fromJSON(String(data))
      }
      catch {
        resolve(
          try toJSON(
            DriverManagerOutboundMessage.Error(
              DriverManagerError.ParseError("\(error)")
            )
          )
        )
        return
      }
      
      let response = handleMessage(message)
      resolve(try! toJSON(response))
    }
    catch {
      resolve(
        try! toJSON(
          DriverManagerOutboundMessage.Error(
            DriverManagerError.Error("\(error)")
          )
        )
      )
    }
  }
  
  func emit(_ message: DriverManagerOutboundMessage) -> Void {
    RNEventEmitter.shared.sendEvent(withName: "DriverManagerEvent", body: try! toJSON(message))
  }
  
  private func fromJSON(_ data: String) throws -> DriverManagerInboundMessage {
    return try decoder.decode(DriverManagerInboundMessage.self, from: data.data(using: .utf8)!)
  }
  
  private func toJSON(_ data: DriverManagerOutboundMessage, throwOnFail: Bool = false) throws -> String {
    do {
      let encodedData = try encoder.encode(AnyEncodable(data))
      return String(data: encodedData, encoding: .utf8)!
    } catch {
      if throwOnFail {
        throw error
      }
      
      return try toJSON(
        DriverManagerOutboundMessage.Error(DriverManagerError.SerializeError("\(error)")),
        throwOnFail: true
      )
    }
  }
  
  private func handleMessage(_ message: DriverManagerInboundMessage) -> DriverManagerOutboundMessage {
    do {
      switch message {
      case .Unknown(let type):
        return DriverManagerOutboundMessage.Error(
          DriverManagerError.UnknownMessage(
            DriverManagerUnknownType(unknown_from: "Message Class", unknown_type: type)
          )
        )
      }
    }
    catch {
      return DriverManagerOutboundMessage.Error(
        DriverManagerError.Error("\(error)")
      )
    }
  }
}
