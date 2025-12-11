if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/malik/.gradle/caches/8.10.2/transforms/9eb6b013fd83e2189f600c7b646e5c10/transformed/hermes-android-0.76.7-release/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/malik/.gradle/caches/8.10.2/transforms/9eb6b013fd83e2189f600c7b646e5c10/transformed/hermes-android-0.76.7-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

