@objc(PlatformDriverManager)
class PlatformDriverManager : NSObject {
  public static var shared: PlatformDriverManager?
  static var TUNNELS: [Int : SSHTunnel] = [:]
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
    switch message {
      case .SSHTunnel(let message):
        let noConnection = { (_ id: Int) -> DriverManagerOutboundMessage in
          return DriverManagerOutboundMessage.Error(
            DriverManagerError.NoConnectionError(
              DriverManagerUnknownConnection(connection_type: "SSH Tunnel", connection_id: id)
            )
          )
        }
        
        switch message {
          case .Create(let configuration):
            let tunnel = SSHTunnel(configuration: configuration)
            let id = PlatformDriverManager.TUNNELS.count
            PlatformDriverManager.TUNNELS[id] = tunnel
            return DriverManagerOutboundMessage.Result(id)
            
          case .Flush:
            let tunnels = PlatformDriverManager.TUNNELS
            for entry in tunnels {
              entry.value.Close()
              PlatformDriverManager.TUNNELS.removeValue(forKey: entry.key)
            }
            return DriverManagerOutboundMessage.Result(nil as String?)
            
          case .TestAuth(let id):
            let tunnel = PlatformDriverManager.TUNNELS[id]
            if let tunnel = tunnel {
              tunnel.TestAuth()
              return DriverManagerOutboundMessage.Result(nil as String?)
            } else {
              return noConnection(id)
            }
            
          case .Connect(let id, let target):
            let tunnel = PlatformDriverManager.TUNNELS[id]
            if let tunnel = tunnel {
              let port = tunnel.Connect(target)
              return DriverManagerOutboundMessage.Result(port)
            } else {
              return noConnection(id)
            }
            
          case .TestPort(let id):
            let tunnel = PlatformDriverManager.TUNNELS[id]
            if let tunnel = tunnel {
              let isOpen = tunnel.TestPort()
              return DriverManagerOutboundMessage.Result(isOpen)
            } else {
              return noConnection(id)
            }
            
          case .Close(let id):
            let tunnel = PlatformDriverManager.TUNNELS[id]
            if let tunnel = tunnel {
              tunnel.Close()
              return DriverManagerOutboundMessage.Result(nil as String?)
            } else {
              return noConnection(id)
            }
            
          case .Unknown(let type):
            return DriverManagerOutboundMessage.Error(
              DriverManagerError.UnknownMessage(
                DriverManagerUnknownType(unknown_from: "SSH Tunnel", unknown_type: type)
              )
            )
          }
          
        case .Unknown(let type):
          return DriverManagerOutboundMessage.Error(
            DriverManagerError.UnknownMessage(
              DriverManagerUnknownType(unknown_from: "Message Class", unknown_type: type)
            )
          )
    }
  }
}
