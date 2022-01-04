class SSHTunnel {
  init(configuration: SSHTunnelConfiguration) {
    self.configuration = configuration
  }
  
  let configuration: SSHTunnelConfiguration
  
  func TestAuth() {
    
  }
  
  func Connect(_ target: SSHTunnelPortForward) -> Int {
    return 0
  }
  
  func Close() {
    
  }
}
