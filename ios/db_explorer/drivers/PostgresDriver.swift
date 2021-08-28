import Foundation
import PostgresNIO

enum PostgresDriverError: Error {
    case error(String)
}

@objc(PostgresDriver)
class PostgresDriver : NSObject, NativeDatabaseDriver {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  var connectionInfo = Dictionary<Int, NSDictionary>()
  var connections = Dictionary<Int, PostgresConnection>()
  let eventLoop = EmbeddedEventLoop()
  
  func getConnection(id: Int) throws -> PostgresConnection {
    let connection = connections[id]
    if (connection == nil) {
      throw PostgresDriverError.error("Connection \(id) not found")
    }
  }
  
  @objc func create(_ connectionInfo: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let id = connectionInfo.count
    self.connectionInfo[id] = connectionInfo
    resolve(id)
  }
  
  @objc func connect(_ id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let address = try SocketAddress.makeAddressResolvingHost("my.psql.server", port: 5432)
      PostgresConnection.connect(
        to: address,
        on: eventLoop
      ).whenComplete { result in
        switch result {
        case .success(let connection):
          self.connections[id] = connection
          resolve(nil)
        case .failure(let error):
          reject("postgres_driver_connect", error.localizedDescription, error)
        }
      }
    } catch {
      reject("postgres_driver_connect", error.localizedDescription, error)
      return
    }
  }
  
  @objc func close(_ id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let connection = try getConnection(id: id)
      connection.close()
        .whenComplete { result in
        switch result {
        case .success:
          resolve(nil)
        case .failure(let error):
          reject("postgres_driver_close", error.localizedDescription, error)
        }
      }
      resolve(nil)
    } catch {
      reject("postgres_driver_close", error.localizedDescription, error)
    }
  }
  
  @objc func execute(_ id: Int, sql: String, variables: NSDictionary?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      resolve("{ \"TEST\": \"TEST\" }")
    } catch {
      reject("postgres_driver_close", error.localizedDescription, error)
    }
  }
  
  @objc func flush(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let closers = connections.map({ (key: Int, value: PostgresConnection) in
      return value.close()
    })
    let closeResults = EventLoopFuture<[Void]>.reduce(into: Array<Void>(), closers, on: eventLoop, { array, nextValue in array.append(nextValue) })
    closeResults.whenComplete { result in
      switch result {
      case .success:
        resolve(nil)
      case .failure(let error):
        reject("postgres_driver_flush", error.localizedDescription, error)
      }
    }
  }
}
