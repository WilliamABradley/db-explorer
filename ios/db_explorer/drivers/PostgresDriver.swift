import Foundation

enum PostgresDriverError : Error {
  case TestError
}

@objc(PostgresDriver)
class PostgresDriver : NativeDatabaseDriver, NativeDatabaseDriverProtocol {
  @objc func test() {
    RCTLogInfo("test")
  }
    
  func driverInit(connectionInfo: NSDictionary) throws -> Int {
    throw PostgresDriverError.TestError
  }
  
  func driverConnect(id: Int) throws {
    throw PostgresDriverError.TestError
  }
  
  func driverClose(id: Int) throws {
    throw PostgresDriverError.TestError
  }
  
  func driverExecute(id: Int, sql: String, variables: NSDictionary?) throws -> String {
    throw PostgresDriverError.TestError
    return ""
  }
  
  func driverFlush() throws {
    throw PostgresDriverError.TestError
  }
}
