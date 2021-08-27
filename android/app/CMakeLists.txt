cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

##include(../cpp/pkg/conanbuildinfo.cmake)
##conan_basic_setup()

add_library(cpp
            SHARED
            ../../cpp/PostgresDriver.cpp
            cpp-adapter.cpp
)

# Specifies a path to native header files.
include_directories(
            .
            ../../cpp
)
