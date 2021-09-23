enum DriverManagerOutboundMessage {
  case Result(Encodable)
  case Log(DriverManagerLogData)
  case Error(DriverManagerError)
}

struct DriverManagerLogData {
  var level: String
  var message: String
}

enum DriverManagerError {
  case Error(String)
  case FatalError(String)
  case ParseError(String)
  case SerializeError(String)
  case NoConnectionError(DriverManagerUnknownConnection)
  case UnknownMessage(DriverManagerUnknownType)
  case UnknownDriver(DriverManagerUnknownType)
  case UnknownError
}

struct DriverManagerUnknownConnection {
  var connection_type: String
  var connection_id: Int
}

struct DriverManagerUnknownType {
  var unknown_from: String
  var unknown_type: String
}

extension DriverManagerOutboundMessage: Encodable {
  private enum CodingKeys: String, CodingKey {
      case type
      case data
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(String(reflecting: self), forKey: .type)
    
    switch self {
      case .Result(let data):
        try container.encode(AnyEncodable(data), forKey: CodingKeys.data)
      case .Log(let data):
        try container.encode(data, forKey: .data)
      case .Error(let data):
        try container.encode(data, forKey: .data)
    }
  }
}

extension DriverManagerLogData: Encodable {}

extension DriverManagerError: Encodable {
  private enum CodingKeys: String, CodingKey {
      case error_type
      case error_data
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(String(reflecting: self), forKey: .error_type)
    
    switch self {
      case .Error(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .FatalError(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .NoConnectionError(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .ParseError(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .SerializeError(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .UnknownDriver(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .UnknownMessage(let data):
        try container.encode(data, forKey: CodingKeys.error_data)
        
      case .UnknownError:
        try container.encode(nil as String?, forKey: CodingKeys.error_data)
    }
  }
}

extension DriverManagerUnknownConnection: Encodable {}

extension DriverManagerUnknownType: Encodable {}
