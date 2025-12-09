import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { primaryColor, secondaryColor, traductor } from './AGTools';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const BUTTON_HEIGTH = 50
const ROUND_SIZE = 46
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export default function SwipeableButton({
    text="",
    onSwipe,
    isLoading = false,
}){
    const [buttonWidth, setButtonWidth] = useState(200)
    const SWIPE_RANGE = buttonWidth - 30

    const X = useSharedValue(0)
    
    const AnimatedStyles = {
        swipeButton: useAnimatedStyle(() => {
            return {
                transform: [{
                    translateX: interpolate(
                        X.value,
                        [0, buttonWidth],
                        [0, buttonWidth],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    ),
                },],
                backgroundColor: interpolateColor(
                    X.value,
                    [0,buttonWidth],
                    ["#fff","#fff"],
                )
            }
        }),
        swipeText: useAnimatedStyle(() => {
            return {
                opacity: interpolate(
                    X.value,
                    [0, buttonWidth / 4],
                    [1, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                ),
                transform: [{
                    translateX: interpolate(
                        X.value,
                        [20, SWIPE_RANGE],
                        [0, buttonWidth / 3],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    ),
                },],
            }
        }),
        colorWave: useAnimatedStyle(()=>{
            return{
                width: BUTTON_HEIGTH + X.value,
                opacity: interpolate(
                    X.value,
                    [0,SWIPE_RANGE],
                    [0,1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                )
            }
        }),
    }

    const panGesture = Gesture.Pan()
        .enabled(!isLoading)
        .onUpdate((e) => {
            const newValue = e.translationX
            if (newValue >= 0 && newValue <= (SWIPE_RANGE - 10)) {
                X.value = newValue
            }
        })
        .onEnd(() => {
            if (X.value < SWIPE_RANGE - 20) {
                X.value = withSpring(0)
            } else {
                runOnJS(onSwipe)()
            }
        });

    useEffect(() => {
        if (!isLoading) {
            X.value = withSpring(0)
        }
    }, [isLoading])

    return (
        <GestureHandlerRootView style={[{width:"100%"}]}>
            <View style={[styles.swipeableContainer]} onLayout={({nativeEvent})=>{
                nativeEvent?.layout?.width && setButtonWidth(nativeEvent?.layout?.width)
            }}>
                <AnimatedLinearGradient
                    colors={[secondaryColor,secondaryColor]}
                    start={{x:0.0,y:0.5}}
                    end={{x:1.0,y:0.5}}
                    style={[styles.colorWave,AnimatedStyles.colorWave]}
                ></AnimatedLinearGradient>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.swipeableRound,AnimatedStyles.swipeButton]}>
                        {isLoading ?
                            <ActivityIndicator color={primaryColor} />
                        : <>
                            <View style={[styles.swipeableArrow]} />
                        </>}
                    </Animated.View>
                </GestureDetector>
                <Animated.Text style={[styles.swipeText,AnimatedStyles.swipeText]}>
                    {text === "" ? traductor("Glisser pour confirmer") : traductor(text)}
                </Animated.Text>
            </View>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    swipeableContainer:{
        height:BUTTON_HEIGTH,
        width:"100%",
        borderRadius:8,
        // borderRadius:BUTTON_HEIGTH / 2,
        backgroundColor:primaryColor,
        justifyContent:"center",
    },
    swipeableRound:{
        height:ROUND_SIZE,
        width:ROUND_SIZE,
        marginLeft:2,
        borderRadius:8,
        // borderRadius:ROUND_SIZE/2,
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        overflow:"hidden",
    },
    swipeableArrow:{
        height:12,
        width:12,
        left:-2,
        backgroundColor:"#ffffff00",
        borderColor:primaryColor,
        borderTopWidth:2,
        borderRightWidth:2,
        transform:[
            {rotate:"45deg"},
        ]
    },
    swipeText: {
        fontSize:12,
        fontWeight:"400",
        color:"#fff",
        alignSelf:"center",
        position:"absolute",
    },
    colorWave:{
        position:"absolute",
        left:0,
        height:BUTTON_HEIGTH,
        borderRadius:8,
        // borderRadius:BUTTON_HEIGTH,
        backgroundColor:"green",
    },
})