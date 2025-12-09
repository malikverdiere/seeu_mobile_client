import React, { useContext } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primaryColor, secondaryColor, statusBarHeigth } from '../AGGlobalVariables';
import { NoUserContext, UserContext } from '../AGContext';
import { traductor } from '../Traductor';
import { AuthContext } from '../../Login';

const qrCodeBtnImg = require("../../img/btn/qrCode.png")
const notificationImg = require("../../img/btn/notification.png")
const locationImg = require("../../img/locationDist.png")
const appLogo = require("../../img/logo/logo.png")

const btnSize = 40
const logoSize = 50

export default function HomeHead({
    leftAction,
    rigthActionL,
    rigthActionR,
}){
    const authContext = useContext(AuthContext)
    const {
        user,
        notifications,
        noUserlocation,
        chatRooms,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const chat_room_notification = user && chatRooms.filter((chatRoom)=>{
        return chatRoom?.docData?.status_client === 1 || chatRoom?.docData?.status_client === 2
    })

    return(<View style={[styles.row,styles.container]}>

        <View style={[styles.row,styles.containerLeft]}>
            {<TouchableOpacity style={[styles.localisationBtn]} onPress={leftAction}>
                <Image resizeMode={"contain"} style={[styles.imgSize,styles.leftImg]} source={locationImg} />
                {user ? <Text numberOfLines={1}>{user?.docData?.geolocation?.city || traductor("Localisation")}</Text> :
                <Text style={[{color:"#000"}]} numberOfLines={1}>{noUserlocation?.city || traductor("Localisation")}</Text>}
            </TouchableOpacity>}
        </View>

        <View style={[styles.row,styles.containerCenter]}>
            <View style={[styles.logo]}>
                <Image resizeMode={"cover"} style={[styles.imgLogo]} source={appLogo} />
            </View>
        </View>

        <View style={[styles.row,styles.containerRigth]}>
            {user && <TouchableOpacity style={[styles.btn,{marginRight:5}]} onPress={rigthActionL}>
                <Image resizeMode={"contain"} style={[styles.imgSize]} source={notificationImg} />
                {(notifications.length > 0 || chat_room_notification.length > 0) 
                    && <View style={[styles.notifCount]}>
                        <Text>{notifications.length + chat_room_notification.length}</Text>
                    </View>
                }
            </TouchableOpacity>}
            {user && <TouchableOpacity style={[styles.btn]} onPress={rigthActionR}>
                <Image resizeMode={"contain"} style={[styles.imgSize]} source={qrCodeBtnImg} />
            </TouchableOpacity>}
        </View>

    </View>)
}

const styles = StyleSheet.create({
    container:{
        paddingVertical:10,
        marginTop:statusBarHeigth,
    },
    row:{
        flexDirection:"row",
        alignItems:"center",
    },
    containerLeft:{
        flex:1,
        marginLeft:5,
    },
    containerCenter:{
        flex:1,
    },
    containerRigth:{
        flex:1,
        marginRight:5,
        justifyContent:"flex-end",
    },
    logo:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
    },
    imgLogo:{
        width:"70%",
        height:logoSize,
    },
    btn:{
        width:btnSize,
        height:btnSize,
        alignItems:"center",
        justifyContent:"center",
    },
    imgSize:{
        width:btnSize * 0.6,
        height:btnSize * 0.6,
    },
    notifCount:{
        width:btnSize * 0.5,
        height:btnSize * 0.5,
        borderRadius:(btnSize * 0.5) / 2,
        backgroundColor:secondaryColor,
        alignItems:"center",
        justifyContent:"center",
        position:"absolute",
        top:0,
        right:0,
    },
    notifCountText:{
        color:primaryColor,
    },
    localisationBtn:{
        flex:1,
        flexDirection:"row",
        alignItems:"center",
        marginLeft:10,
        marginRight:4,
    },
    leftImg:{
        marginRight:4,
        width:20,
        height:20,
    },
})