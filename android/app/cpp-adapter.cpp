#include <jni.h>
#include "PostgresDriver.h"
#include <map>
#include <string>

using namespace std;

extern "C" JNIEXPORT jint JNICALL
Java_com_db_1explorer_drivers_NVPostgresDriver_1create(JNIEnv *, jobject, jobjectArray)
{
    map<string, string> connectionInfo;
    connectionInfo["port"] = "66";
    return driver_manager_shared::postgres::create(connectionInfo);
}
