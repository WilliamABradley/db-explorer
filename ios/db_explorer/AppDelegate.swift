import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  var window: UIWindow?
  
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  #if FB_SONARKIT_ENABLED
  static func InitializeFlipper(application: UIApplication) -> Void {
    let client = FlipperClient.shared()
    let layoutDescriptorMapper = SKDescriptorMapper.init()
    client?.add(FlipperKitLayoutPlugin.init(rootNode: application, with: layoutDescriptorMapper))
    client?.add(FKUserDefaultsPlugin.init(suiteName: nil))
    client?.add(FlipperKitReactPlugin())
    client?.add(FlipperKitNetworkPlugin.init(networkAdapter: SKIOSNetworkAdapter()))
  }
  #endif

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    let moduleName = "db_explorer"
    
    #if FB_SONARKIT_ENABLED
    AppDelegate.InitializeFlipper(application: application)
    #endif
    
    let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)!
    
    // initialize the react rootView
    let rootView = RCTRootView(bridge: bridge, moduleName: moduleName, initialProperties: nil)
    
    if #available(iOS 13.0, *) {
      rootView.backgroundColor = UIColor.systemBackground
    } else {
      rootView.backgroundColor = UIColor.white
    }

    // Set window to use rootViewController
    self.window = UIWindow(frame: UIScreen.main.bounds)
    
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    self.window?.rootViewController = rootViewController
    
    self.window?.makeKeyAndVisible()
    return true
  }
}
