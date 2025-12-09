import React, {  } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, ScrollView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const window = Dimensions.get('window');

export default function Sheet(props){
    const AnimatedView = Animated.createAnimatedComponent(View)
    const offsetY = useSharedValue(0)
    const savedOffset = useSharedValue(0)
    const sheetMaxHeight = props.maxHeight || (window.height - 100)
    const sheetMinHeight = props.minHeight || 100
    const MAX_Y = sheetMinHeight - sheetMaxHeight
    const MID_Y = MAX_Y / 2
    const MIN_Y = 0
    const THRESHOLD = 20
    const hasMidHeight = props.midHeight || false

    const dragGesture = Gesture.Pan()
        .onUpdate((e)=>{
            offsetY.value = e.translationY + savedOffset.value
        })
        .onEnd((e)=>{
            if(hasMidHeight){
                if(e.translationY < 0){
                    // up
                    if(savedOffset.value === MIN_Y){
                        offsetY.value = e.translationY >= -THRESHOLD ? MIN_Y : MID_Y
                    } else if(savedOffset.value === MID_Y){
                        offsetY.value = e.translationY >= -THRESHOLD ? MID_Y : MAX_Y
                    } else if(savedOffset.value >= MAX_Y){
                        offsetY.value = MAX_Y
                    }
                } else {
                    // down
                    if(savedOffset.value === MAX_Y){
                        offsetY.value = e.translationY < THRESHOLD ? MAX_Y : MID_Y
                    } else if(savedOffset.value === MID_Y){
                        offsetY.value = e.translationY < THRESHOLD ? MID_Y : MIN_Y
                    } else if(savedOffset.value <= MIN_Y){
                        offsetY.value = MIN_Y
                    }
                }
            } else {
                if(e.translationY < 0){
                    // up
                    offsetY.value = e.translationY >= -THRESHOLD ? MIN_Y : MAX_Y
                } else {
                    // down
                    offsetY.value = e.translationY < THRESHOLD ? MAX_Y : MIN_Y
                }
            }
            savedOffset.value = offsetY.value
        })
        
        const animatedStyles = useAnimatedStyle(()=>{
            const animatedHeight = interpolate(
                offsetY.value,
                [MAX_Y, MIN_Y],
                [sheetMaxHeight, sheetMinHeight],
                {
                    extrapolateLeft: Extrapolation.CLAMP,
                    extrapolateRight: Extrapolation.CLAMP,
                },
            )
            
            return {
                height: withSpring(animatedHeight,{
                    damping:16,
                    stiffness:100,
                    mass:0.3,
                })
            }
        })

    

    return (<GestureHandlerRootView style={styles.container}>
            
        <AnimatedView style={[styles.sheetContainer,animatedStyles]}>

            <GestureDetector gesture={dragGesture}>
                <View style={[styles.dragbarContainer]}>
                    <View style={[styles.dragbar]}/>
                </View>
            </GestureDetector>

            <ScrollView bounces={false}>
                {props.children}
            </ScrollView>

        </AnimatedView>

    </GestureHandlerRootView>);
}

const styles = StyleSheet.create({
    container:{
        position:"absolute",
        left:0,
        right:0,
        bottom:0,
    },
    sheetContainer:{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
        backgroundColor:"#fff",
    },
    dragbarContainer:{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical:20,
    },
    dragbar:{
        width: "15%",
        height: 4,
        borderRadius: 8,
        backgroundColor: "#CCCCCC",
    },
});