import React, { useContext } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext, goToScreen, primaryColor } from '../AGTools';

const header_img_size = 40
const chat_icon_size = 50
const chat_indicator_size = chat_icon_size * 0.20

export default function ChatRoom({
    navigation,
}){
    const {
        shops,
        chatRooms,
    } = useContext(UserContext)

    const getCurrentShop = (shopId)=>{
        return shops.filter((shop)=>{
            return shop.docId === shopId
        })
    }

    return(<View style={[styles.viewContainer]}>

        <FlatList
            data={chatRooms}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item,index}) => {
                const shop = getCurrentShop(item?.docData?.shopId)
                const last_message_date = item?.docData?.last_message_shop_date?.seconds * 1000
                const chat_date = item?.docData?.createAt?.seconds * 1000
                const oneday = 60 * 60 * 24 * 1000
                const today = new Date().getTime()

                const onChat = ()=>{
                    goToScreen(navigation,"Chat",{clientId:item?.docData?.clientId,shopId:item?.docData?.shopId,shopName:item?.docData?.shopName})
                }

                return(<View>
                    <TouchableOpacity style={[styles.item, (index % 2 === 0) && {backgroundColor:"#6857E50D"}]} onPress={onChat}>

                        <View style={[styles.chatContainer]}>
                            {shop[0]?.docData?.logo_Shop_Img
                                &&  <Image style={[styles.chatIcon]} source={{uri:shop[0]?.docData?.logo_Shop_Img}} />
                            }
                            {(item?.docData?.status_client === 1 || item?.docData?.status_client === 2)
                                && <View style={[styles.chatIndicator]}/>
                            }
                        </View>

                        <View style={[styles.tilteContainer]}>
                            <Text style={[styles.shopName]} numberOfLines={1}>{item?.docData?.shopName}</Text>
                            {(item?.docData?.status_client === 1 || item?.docData?.status_client === 2) 
                                && <Text style={[styles.message]} numberOfLines={1}>{item?.docData?.last_message_shop}</Text>
                            }
                        </View>

                        <View style={[styles.timeContainer]}>
                            {last_message_date
                                ? <Text style={[styles.time]}>
                                    {today >= (last_message_date + oneday)
                                        ? new Date(last_message_date).toLocaleDateString()
                                        : new Date(last_message_date).toLocaleTimeString()
                                    }
                                </Text>
                                : <Text style={[styles.time]}>
                                    {today >= (chat_date + oneday)
                                        ? new Date(chat_date).toLocaleDateString()
                                        : new Date(chat_date).toLocaleTimeString()
                                    }
                                </Text>
                            }
                        </View>

                    </TouchableOpacity>
                    <View style={[styles.separator]} />
                </View>)
            }}
        />
        
    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    headerContainer:{
        paddingHorizontal:20,
    },
    headerTitle:{
        fontSize:20,
        fontWeight:"bold",
    },
    headerImg:{
        width:header_img_size,
        height:header_img_size,
    },
    item:{
        flexDirection:"row",
        justifyContent:"space-between",
        paddingVertical:30,
        paddingHorizontal:20,
    },
    chatContainer:{
        width:chat_icon_size,
    },
    chatIcon:{
        width:chat_icon_size,
        height:chat_icon_size,
        borderRadius:chat_icon_size/2,
    },
    chatIndicator:{
        width:chat_indicator_size,
        height:chat_indicator_size,
        backgroundColor:primaryColor,
        position:"absolute",
        top:2,
        right:2,
        borderRadius:chat_indicator_size,
    },
    tilteContainer:{
        paddingHorizontal:12,
        flex:1,
    },
    shopName:{
        color:"#1D1D1B",
        fontSize:16,
        fontWeight:"800",
        marginBottom:4,
    },
    message:{
        color:"#8C91A2",
        fontSize:16,
        fontWeight:"400",
    },
    timeContainer:{
    },
    time:{
        color:"#B8BBC6",
        fontSize:14,
        fontWeight:"500",
    },
    separator:{
        backgroundColor:"#F5F5F5",
        height:1,
        marginHorizontal:20,
    },
})