#include "pch.h"
#include "PostgresDriver.h"

//const map<int, string> PGINSTS;

namespace driver_manager_shared::postgres
{
    int create(map<string, string> connectionInfo) noexcept
    {
        return std::atoi(connectionInfo["port"].c_str());
    }
}
