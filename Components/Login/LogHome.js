import React, { } from 'react';
import { Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';

const landingImg = require("../img/landing.png")
const bgImg = require("../img/bg/bgGradiant.png")
const logoImg = require("../img/logo/logoPurple.png")

const widthS = Dimensions.get("screen").width

export default function LogHome({
    navigation,
}){
    const onSkip = ()=>{
        goToScreen(navigation,"TabLoginNavigator")
    }
    const onStart = ()=>{
        goToScreen(navigation,"SignIn")
    }
    
    return(<ImageBackground source={bgImg} resizeMode={"cover"} style={[styles.viewContainer]}>

        <SafeAreaView/>
        <View style={[{height:statusBarHeigth}]} />

        <View style={[styles.logoContainer]}>
            <Image style={[styles.logo]} source={logoImg} />

            <TouchableOpacity style={[styles.skipBtn]} onPress={onSkip}>
                <Text style={[styles.skipText]}>{traductor("Passer")}</Text>
            </TouchableOpacity>
        </View>

        <Image style={[styles.imgCenter]} resizeMode={"contain"} source={landingImg} />

        <Text style={[styles.text]}>{traductor("Votre Lifestyle")}</Text>
        <Text style={[styles.subText]}>{traductor("Vos Récompenses")}</Text>

        <TouchableOpacity style={[styles.btn]} onPress={onStart}>
            <Text style={[styles.btnText]}>{traductor("Commencer")}</Text>
        </TouchableOpacity>

        <SafeAreaView />

    </ImageBackground>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
    },
    logoContainer:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        margin:20,
    },
    logo:{
        width:111,
        height:56,
    },
    skipBtn:{
        padding:20,
        paddingRight:0,
    },
    skipText:{
        color:primaryColor,
        fontWeight:"600",
    },
    imgCenter:{
        flex:1,
        width:widthS,
    },
    text:{
        color:"#000",
        fontWeight:"600",
        fontSize:20,
        textAlign:"center",
    },
    subText:{
        color:primaryColor,
        fontWeight:"600",
        fontSize:28,
        textAlign:"center",
    },
    btn:{
        backgroundColor:"#000",
        borderRadius:15,
        paddingVertical:15,
        margin:20,
        marginBottom:40,
    },
    btnText:{
        color:"#fff",
        fontWeight:"600",
        fontSize:16,
        textAlign:"center",
    },
})