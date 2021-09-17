package com.db_explorer

import android.content.Context
import java.lang.reflect.InvocationTargetException
import android.app.Application
import com.facebook.soloader.SoLoader
import com.facebook.react.*
import android.webkit.WebView

class MainApplication : Application(), ReactApplication {
    override fun getReactNativeHost(): ReactNativeHost {
        return object : ReactNativeHost(this) {
            override fun getUseDeveloperSupport(): Boolean {
                return BuildConfig.DEBUG;
            }

            override fun getPackages(): MutableList<ReactPackage> {
                var initPackages = PackageList(this).packages;
                // Packages that cannot be autolinked yet can be added manually here, for example:
                // packages.add(MyReactNativePackage());
                initPackages.add(ReactPackageProvider());
                return initPackages;
            }

            override fun getJSMainModuleName(): String {
                return "index";
            }
        };
    }

    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        SoLoader.init(this,  /* native exopackage */false)
        initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }

    companion object {
        /**
         * Loads Flipper in React Native templates. Call this in the onCreate method with something like
         * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
         *
         * @param context
         * @param reactInstanceManager
         */
        fun initializeFlipper(
            context: Context, reactInstanceManager: ReactInstanceManager
        ) {
            if (BuildConfig.DEBUG) {
                try {
                    /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
                    val aClass = Class.forName("com.db_explorer.ReactNativeFlipper")
                    aClass
                        .getMethod(
                            "initializeFlipper",
                            Context::class.java,
                            ReactInstanceManager::class.java
                        )
                        .invoke(null, context, reactInstanceManager)
                } catch (e: ClassNotFoundException) {
                    e.printStackTrace()
                } catch (e: NoSuchMethodException) {
                    e.printStackTrace()
                } catch (e: IllegalAccessException) {
                    e.printStackTrace()
                } catch (e: InvocationTargetException) {
                    e.printStackTrace()
                }
            }
        }
    }
}