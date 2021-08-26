#pragma once
#include "pch.h"
#include <map>
#include <string>
using namespace std;

namespace driver_manager_shared::postgres
{
    int create(map<string, string> connectionInfo) noexcept;
}
