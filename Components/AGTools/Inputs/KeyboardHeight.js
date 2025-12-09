import React, { useState, useEffect, useContext } from "react";
import { DeviceEventEmitter, Platform } from 'react-native';
import { LoadingContext } from "../AGContext";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";

export default function KeyboardHeight(){
    const {setKeyboardVisible} = useContext(LoadingContext)
    const [keyboardHeight, setKeyboardHeight] = useState(0)

    const height = useSharedValue(0)

    const derivedHeight = useDerivedValue(() =>
        withTiming(height.value + keyboardHeight)
    )
    const bodyStyle = useAnimatedStyle(() => ({
        height: derivedHeight.value,
    }))

    const keyboardDidShow = (e) =>{
        setKeyboardHeight(e.endCoordinates.height - 30)
        setKeyboardVisible(true)
    }
    const keyboardDidHide = (e) =>{
        setKeyboardHeight(0)
        setKeyboardVisible(false)
    }

    useEffect(()=>{
        const keyboardDidShowListener = DeviceEventEmitter.addListener("keyboardDidShow", keyboardDidShow)
        const keyboardDidHideListener = DeviceEventEmitter.addListener("keyboardDidHide", keyboardDidHide)
        return () => {
            keyboardDidShowListener.remove()
            keyboardDidHideListener.remove()
        }
    },[])

    return(<>
        {Platform.OS === "ios" && <Animated.View style={[bodyStyle]} />}
    </>)
}