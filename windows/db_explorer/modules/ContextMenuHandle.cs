using System;
using Microsoft.ReactNative.Managed;
using Windows.Foundation;
#if !USE_WINUI3
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
#else
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
#endif

namespace db_explorer.modules
{
    [ReactModule("ContextMenu")]
    public class ContextMenuHandle
    {
        private ReactContext context;

        [ReactInitializer]
        public void Initialize(ReactContext reactContext)
        {
            context = reactContext;
        }

        [ReactMethod("openContextMenu")]
        public void OpenContextMenu(double X, double Y)
        {
            context.Handle.UIDispatcher.Post(() =>
            {
                var flyout = new MenuFlyout();
                var testItem = new MenuFlyoutItem { Text = "Test" };
                flyout.Items.Add(testItem);
                flyout.ShowAt((FrameworkElement)Window.Current.Content, new Point
                {
                    X = X,
                    Y = Y,
                });
            });
        }

        //[ReactEvent("onItemClicked")]
        //public event EventHandler<double> AddEvent;
    }
}
