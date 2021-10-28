senum DriverManagerInboundMessage {
  case Unknown(String)
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
      default:
        self = .Unknown(className ?? "Unknown")
    }
  }
}
