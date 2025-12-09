import React, { useContext, useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Header, UserContext, goToScreen, traductor } from './AGTools';
import { useIsFocused } from '@react-navigation/native';
import { auth } from '../firebase.config';
import QRCode from 'react-native-qrcode-svg';

const arrowBack = require("./img/arrow/arrowBackBg.png")

const widthW = Dimensions.get("window").width
const headerImgSize = 40

export default function TicketsQrCode({
    navigation,
    route,
}){
    const {
        user,
    } = useContext(UserContext)

    const currentUser = auth.currentUser
    const campaignId = route?.params?.campaignId
    const isFocused = useIsFocused()

    const onBack = () =>{
        goToScreen(navigation,"goBack")
    }

    useEffect(()=>{
        if((user?.docData?.currentScanShop) && (user?.docData?.scanActive === true)){
            goToScreen(navigation,"Shop",{shopId:user?.docData?.currentScanShop, userId:currentUser.uid})
        }
    },[user])

    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])
        
    return(<>
        <View style={[styles.header]}>
            <Header
                title={traductor("Scan QR Code")}
                containerStyle={[styles.headerContainer]}
                titleStyle={[styles.headerTitle]}
                imgLeft={arrowBack}
                imgLeftContainerStyle={[styles.headerImgContainer]}
                imgLeftStyle={[styles.headerImg]}
                leftAction={onBack}
            />
            <Text style={[styles.headerSupTitle]}>{traductor("Scannez le QR code du coupon")}</Text>
            <View style={[styles.qrcodeContainer]}>
                <View style={[styles.qrcodeContainer]}>
                    <QRCode
                        value={campaignId}
                        size={widthW/2}
                    />
                </View>
            </View>
        </View>
    </>)
}

const styles = StyleSheet.create({
    header:{
        flex:1,
        width:"100%",
        backgroundColor:"#FFFAF3",
    },
    headerContainer:{
        height:130,
        paddingTop:0,
    },
    headerTitle:{
        fontSize:22,
        fontWeight:"600",
        color:"#fff",
        textAlign:"center",
        paddingRight:headerImgSize,
    },
    headerImgContainer:{
        height:130,
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    headerSupTitle:{
        fontSize:13,
        fontWeight:"500",
        color:"#fff",
        textAlign:"center",
        marginTop:-30,
        marginBottom:10,
    },
    qrcodeContainer:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
    },
    textContainer:{
        backgroundColor:"#fff",
        borderRadius:13,
        padding:20,
    },
    title:{
        fontSize:16,
        marginBottom:10,
        color:"#333333",
        fontWeight:"600",
        textAlign:"center",
    },
    text:{
        fontSize:14,
        color:"#B1B1B1",
        fontWeight:"600",
        textAlign:"center",
    },
})