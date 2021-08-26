#pragma once
#include "ReactPackageProvider.g.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::driver_manager::implementation
{
  struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider>
  {
    ReactPackageProvider() = default;
    void CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept;
  };
}

namespace winrt::driver_manager::factory_implementation
{
  struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider, implementation::ReactPackageProvider>
  {
  };
}
