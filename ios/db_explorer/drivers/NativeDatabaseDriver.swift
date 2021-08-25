import Foundation

@objc(NativeDatabaseDriver)
class NativeDatabaseDriver : NSObject {
  // Expect subclass to implement the protocol
  var driver: NativeDatabaseDriverProtocol = self as Any as! NativeDatabaseDriverProtocol
  
  @objc func create(connectionInfo: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let id = try driver.driverCreate(connectionInfo: connectionInfo)
      resolve(id)
    } catch {
      reject("native_driver_create", error.localizedDescription, error)
    }
  }
  
  @objc func connect(id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try driver.driverConnect(id: id)
      resolve(nil)
    } catch {
      reject("native_driver_connect", error.localizedDescription, error)
    }
  }
  
  @objc func close(id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try driver.driverClose(id: id)
      resolve(nil)
    } catch {
      reject("native_driver_close", error.localizedDescription, error)
    }
  }
  
  @objc func execute(id: NSInteger, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try driver.driverClose(id: id)
      resolve(nil)
    } catch {
      reject("native_driver_close", error.localizedDescription, error)
    }
  }
  
  @objc func flush(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try driver.driverFlush()
      resolve(nil)
    } catch {
      reject("native_driver_flush", error.localizedDescription, error)
    }
  }
}
