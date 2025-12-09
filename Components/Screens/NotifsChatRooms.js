import React, { useContext, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, UserContext, goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import ChatRoom from '../Chat/ChatRoom';
import Notifications from './Notifications';

const arrowBack = require("../img/arrow/arrowBackBgPurple.png")

const screen_width = Dimensions.get("screen").width
const headerImgSize = 40
const switcher_lign_heigth = 4
const chat_icon_size = 40
const chat_indicator_size = chat_icon_size * 0.20

export default function NotifsChatRooms({
    navigation,
}){
    const {
        chatRooms,
    } = useContext(UserContext)

    const [switcher, setSwitcher] = useState(false)

    const translateX = useSharedValue(0)
    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{
            translateX: withSpring(translateX.value)
        }],
    }))
    const chat_room_notification = chatRooms.filter((chatRoom)=>{
        return chatRoom?.docData?.status_client === 1 || chatRoom?.docData?.status_client === 2
    })

    const onBack = () =>{
        goToScreen(navigation,"goBack")
    }
    
    const onSwitche = (e)=>{
        switch (e) {
            case 1:
                translateX.value = 0
                setSwitcher(false)
                break;
            case 2:
                if(!switcher){
                    translateX.value += ((screen_width - 40) / 2)
                }
                setSwitcher(true)
                break;
            default:
                break;
        }
    }

    return(<View style={[styles.viewContainer]}>

        <Header
            title={traductor("Message")}
            containerStyle={[styles.header,{marginTop:Platform.OS === "ios" ? 30 : statusBarHeigth}]}
            titleStyle={[styles.headerTitle,{marginRight:headerImgSize}]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onBack}
        />

        <View style={[styles.switcherContainer]}>
            <View style={[styles.switcherContainerTitle]}>
                <TouchableOpacity style={[styles.switcherBtn]} onPress={()=>onSwitche(1)}>
                    <Text style={[styles.switcherTitle]}>{traductor("Notification")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.switcherBtn]} onPress={()=>onSwitche(2)}>
                {chat_room_notification.length > 0
                    && <View style={[styles.chatIndicator]}/>
                }
                    <Text style={[styles.switcherTitle]}>{traductor("Chat")}</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.switcherLign]}>
                <Animated.View style={[styles.switcherLignSelected, animatedStyles]} />
            </View>
        </View>

        {switcher 
            ? <ChatRoom navigation={navigation} />
            : <Notifications navigation={navigation} />
        }

    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    header:{
        backgroundColor:"#fff",
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    headerTitle:{
        color:"#000",
        fontSize:26,
        fontWeight:"600",
    },
    switcherContainer:{
        marginHorizontal:20,
    },
    switcherContainerTitle:{
        flexDirection:"row",
    },
    switcherBtn:{
        width:"50%",
        paddingVertical:12,
    },
    switcherTitle:{
        color:"#000",
        fontSize:14,
        fontWeight:"500",
        textAlign:"center",
    },
    switcherLign:{
        backgroundColor:"#F5F5F5",
        height:1,
        borderTopLeftRadius:switcher_lign_heigth,
        borderTopRightRadius:switcher_lign_heigth,
    },
    switcherLignSelected:{
        width:"50%",
        backgroundColor:primaryColor,
        height:switcher_lign_heigth,
        borderTopLeftRadius:switcher_lign_heigth,
        borderTopRightRadius:switcher_lign_heigth,
        bottom:switcher_lign_heigth,
    },
    chatIndicator:{
        width:chat_indicator_size,
        height:chat_indicator_size,
        backgroundColor:primaryColor,
        position:"absolute",
        top:10,
        right:(screen_width - 40) / 6,
        borderRadius:chat_indicator_size,
    },
})