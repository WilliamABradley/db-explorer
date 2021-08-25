import Foundation

enum PostgresDriverError : Error {
  case TestError
}

@objc(PostgresDriver)
class PostgresDriver : NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc func create(_ connectionInfo: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let id = try driverCreate(connectionInfo: connectionInfo)
      resolve(id)
    } catch {
      reject("native_driver_create", error.localizedDescription, error)
    }
  }
  
  func driverCreate(connectionInfo: NSDictionary) throws -> Int {
    return -1
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
