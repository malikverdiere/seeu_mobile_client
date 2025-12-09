import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, TextInput } from 'react-native';
import Svg, { G, Circle, LinearGradient, Stop, Defs } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)
const AnimatedSvg = Animated.createAnimatedComponent(Svg)

export default function DonutIndicator({
    defaultValue = 0, 
    radius = 80,
    strokeWidth = 10,
    duration = 1000,
    color = "#767676",
    gradient1 = "#4625FE",
    gradient2 = "#ED1A1A",
    gradientEnd1 = "#DE9F11",
    gradientEnd2 = "#F5FF00",
    delay = 500,
    numColor = "#000",
    textColor = "#000",
    max = 100,
    animePoint,
    cursor=true,
    cursorSize=30,
    numStyle={},
    textStyle={},
}){

    const animatedValue = useRef(new Animated.Value(0)).current
    const circleRef = useRef()
    const inputRef = useRef()
    const halfCircle = radius + strokeWidth
    const circleCircumference = 2 * Math.PI * radius
    const [isMax, setIsMax] = useState(false)

    const animation = (toValue) =>{
        return Animated.timing(animatedValue,{
            toValue,
            duration,
            delay,
            useNativeDriver:true,
            easing: Easing.out(Easing.ease),
        }).start()
    }

    const outputEnd = (defaultValue * 360) / max
    const indicator_cap = animatedValue.interpolate({
        inputRange: [0, defaultValue],
        outputRange: ['0deg', `${outputEnd}deg`]
    })

    useEffect(()=>{
        animation(defaultValue)
        animatedValue.addListener((v)=>{
            const maxPerc = (100 * v.value) / max
            const strokeDashoffset = circleCircumference - (circleCircumference * maxPerc) / 100

            if(circleRef?.current){
                circleRef.current.setNativeProps({
                    strokeDashoffset,
                })
            }
            if(inputRef?.current){
                inputRef.current.setNativeProps({
                    text:`${Math.round(v.value)}`
                })
            }
            if(v.value >= max){
                setIsMax(true)
            } else {
                setIsMax(false)
            }
        })
        
        return ()=> animatedValue.removeAllListeners()
    },[max, defaultValue])

    useEffect(()=>{
        Animated.timing(animatedValue,{
            toValue:defaultValue < max ? defaultValue : max,
            duration,
            useNativeDriver:true,
        }).start()
    },[max, defaultValue])

    return(<>
        <View style={[{justifyContent:"center",alignItems:"center"}]}>
            <Svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
                <Defs>
                    <LinearGradient
                        id="prefix__a"
                        gradientUnits="userSpaceOnUse"
                        x1={100}
                        y1={250}
                        x2={0}
                        y2={0}
                    >
                        <Stop offset={0.28} stopColor={isMax ? gradientEnd1 : gradient1} />
                        <Stop offset={1} stopColor={isMax ? gradientEnd2 : gradient2} />
                    </LinearGradient>
                </Defs>
                <G rotation={"-90"} origin={`${halfCircle}, ${halfCircle}`}>
                    <Circle 
                        cx={"50%"}
                        cy={"50%"}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={0.2}
                        fill={"transparent"}
                    />
                    <AnimatedCircle
                        ref={circleRef}
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke="url(#prefix__a)"
                        strokeLinecap="round"
                        strokeWidth={strokeWidth}
                        strokeDashoffset={circleCircumference}
                        strokeDasharray={circleCircumference}
                    />
                </G>
            </Svg>
            <AnimatedSvg 
                width={radius * 2}
                height={radius * 2}
                viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}
                style={{
                    position:"absolute",
                    transform:[
                        {rotate:indicator_cap}
                    ]
                }}
            >
                {cursor && <G rotation={"-90"} origin={`${halfCircle}, ${halfCircle}`} >
                    <Circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke="white"
                        strokeLinecap="round"
                        strokeWidth={cursorSize}
                        strokeDashoffset={circleCircumference}
                        strokeDasharray={circleCircumference + 1}
                    />
                </G>}
            </AnimatedSvg>
            <View style={[StyleSheet.absoluteFillObject,{justifyContent:"center"}]}>
                {animePoint ? <>
                    <AnimatedTextInput
                        ref={inputRef}
                        underlineColorAndroid="transparent"
                        editable={false}
                        defaultValue="0"
                        style={[
                            {fontSize:radius * 0.6,color:numColor ?? color},
                            {fontWeight:"900",textAlign:"center",padding:0},
                            numStyle,
                        ]}
                    />
                </> : <>
                    <TextInput
                        value={max.toString()}
                        underlineColorAndroid="transparent"
                        editable={false}
                        defaultValue={max.toString()}
                        style={[
                            {fontSize:radius * 0.6,color:numColor ?? color},
                            {fontWeight:"900",textAlign:"center",padding:0},
                            numStyle,
                        ]}
                    />
                </>}
                <Text style={[
                    {fontSize:radius * 0.15,color:textColor ?? color},
                    {fontWeight:"600",textAlign:"center",textTransform:"uppercase"},
                    textStyle,
                ]}>{max <=1 ? "point" : "points"}</Text>
            </View>
        </View>
    </>)
}