enum DriverManagerInboundMessage {
  case SSHTunnel(SSHTunnelMessage)
  case Unknown(String)
}

enum SSHTunnelMessage {
  case Create(configuration: SSHTunnelConfiguration)
  case TestAuth(_ id: Int)
  case Connect(_ id: Int, target: SSHTunnelPortForward)
  case Close(_ id: Int)
  case Flush
  case Unknown(String)
}

struct SSHTunnelConfiguration {
  var host: String;
  var port: Int;
  var username: String;
  var authenticationMethod: SSHTunnelAuthenticationMethod;
}

enum SSHTunnelAuthenticationMethod {
  case Password(String)
  case PublicKey(privateKey: String, passphrase: String?)
  case Agent
  case Unknown(String)
}

struct SSHTunnelPortForward {
  var remoteHost: String;
  var remotePort: Int;
  var localPort: Int?;
}

extension DriverManagerInboundMessage: Decodable {
  enum CodingKeys: String, CodingKey {
      case `class`
      case payload
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let className = try? container.decode(String.self, forKey: .class)
    
    switch className {
      case "SSHTunnel":
        self = .SSHTunnel(try container.decode(SSHTunnelMessage.self, forKey: .payload))
      default:
        self = .Unknown(className ?? "Unknown")
    }
  }
}

extension SSHTunnelMessage: Decodable {
  enum CodingKeys: String, CodingKey {
      case type
      case data
      case id
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let type = try? container.decode(String.self, forKey: .type)
    let id = try? container.decode(Int.self, forKey: .id)
    
    switch type {
      case "Create":
        self = .Create(configuration: try container.decode(SSHTunnelConfiguration.self, forKey: .data))
      case "TestAuth":
        self = .TestAuth(id!)
      case "Connect":
        self = .Connect(id!, target: try container.decode(SSHTunnelPortForward.self, forKey: .data))
      case "Close":
        self = .Close(id!)
      case "Flush":
        self = .Flush
      default:
        self = .Unknown(type ?? "Unknown")
    }
  }
}

extension SSHTunnelConfiguration: Decodable {
  enum CodingKeys: String, CodingKey {
      case host, port, username, authenticationMethod, password, privateKey, passphrase
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let authenticationMethodVal = try? container.decode(String.self, forKey: .authenticationMethod)
    
    host = try container.decode(String.self, forKey: .host)
    port = try container.decode(Int.self, forKey: .port)
    username = try container.decode(String.self, forKey: .username)
    
    switch authenticationMethodVal {
      case "Password":
        authenticationMethod = .Password(try container.decode(String.self, forKey: .password))
      case "PublicKey":
        authenticationMethod = .PublicKey(
          privateKey: try container.decode(String.self, forKey: .privateKey),
          passphrase: try container.decode(String.self, forKey: .passphrase)
        )
      case "Agent":
        authenticationMethod = .Agent
      default:
        authenticationMethod = .Unknown(authenticationMethodVal ?? "Unknown")
    }
  }
}

extension SSHTunnelPortForward: Decodable {}
