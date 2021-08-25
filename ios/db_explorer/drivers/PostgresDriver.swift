import Foundation

@objc(PostgresDriver)
class PostgresDriver : NSObject, NativeDatabaseDriver {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc func create(_ connectionInfo: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let id = -1
      resolve(id)
    } catch {
      reject("postgres_driver_create", error.localizedDescription, error)
    }
  }
  
  @objc func connect(_ id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      resolve(nil)
    } catch {
      reject("postgres_driver_connect", error.localizedDescription, error)
    }
  }
  
  @objc func close(_ id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
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
    do {
      resolve(nil)
    } catch {
      reject("postgres_driver_flush", error.localizedDescription, error)
    }
  }
}
