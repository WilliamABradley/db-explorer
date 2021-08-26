#pragma once

#include "pch.h"
#include "NativeModules.h"
#include "PostgresDriver.h"
#include <map>
#include <string>

using namespace std;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace driver_manager_shared;

namespace driver_manager
{
    REACT_MODULE(PostgresDriverModule, L"NVPostgresDriver");
    struct PostgresDriverModule
    {
        REACT_METHOD(Create, L"create");
        void Create(map<string, string> connectionInfo, ReactPromise<int> promise) noexcept
        {
            int id = postgres::create(connectionInfo);
            promise.Resolve(id);
        }
    };
}
