import Foundation

protocol NativeDatabaseDriverProtocol : NSObject {
  func driverInit(connectionInfo: NSDictionary) throws -> Int
  func driverConnect(id: Int) throws -> Void
  func driverClose(id: Int) throws -> Void
  func driverExecute(id: Int, sql: String, variables: NSDictionary?) throws -> String
  func driverFlush() throws -> Void
}
