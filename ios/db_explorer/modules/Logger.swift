class Logger {
  func Log(_ level: String, _ message: String) {
    let outboundMessage = DriverManagerOutboundMessage.Log(DriverManagerLogData(level: level, message: message))
    PlatformDriverManager.Current?.emit(outboundMessage)
  }
  
  func Info(_ message: String) {
    Log("Info", message)
  }
  
  func Warn(_ message: String) {
    Log("Warn", message)
  }
  
  func Debug(_ message: String) {
    Log("Debug", message)
  }
  
  func Error(_ message: String) {
    Log("Error", message)
  }
  
  func Fatal(_ message: String) {
    Log("Fatal", message)
  }
}
