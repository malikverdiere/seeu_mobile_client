import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, UserContext, bottomTarSpace, boxShadowInput, goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';
import { useIsFocused } from '@react-navigation/native';
import { ModalBox } from '../ModalBox';
import UseRewards from '../UseRewards';
import NFCRead from '../NFCRead';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const defaultImg = require("../img/logo/defaultImg.png")
const rewardsImg = require("../img/rewards.png")
const filterImg = require("../img/btn/filter.png")
const arrowBackBgImg = require("../img/arrow/arrowBackBg.png")
const giftImg = require("../img/birthday.png")
const comeBackImg = require("../img/comeBack.png")

const heightS = Dimensions.get("screen").height
const ITEM_SIZE = 126
const headerImgSize = 40
const squareSize = 20

export default function Rewards({
    navigation,
}){
    const {
        user,
        shops,
        currentShops,
        setShopsUpdate,
        registeredShops,
        rewardsByShop,
        rewardsByShopUpdate,
        setRewardsByShopUpdate,
        gifts,
        setGiftsUpdate,
    } = useContext(UserContext)

    const [shopSelected, setShopSelected] = useState([])
    const [rewardSelected, setRewardSelected] = useState(null)
    const [rewardSelectedVisible, setRewardSelectedVisible] = useState(false)
    const [rewardsUseable, setRewardsUseable] = useState([])
    const [filterSelected, setFilterSelected] = useState({id: "0-default",text: ""})
    const [filterVisible, setFilterVisible] = useState(false)

    const isFocused = useIsFocused()
    const modalBox = ModalBox()
    const scrollY = useRef(new Animated.Value(0)).current
    const insets = useSafeAreaInsets()

    const shopsExistData = [{id: "0-default",text: ""}]

    currentShops.map((shop)=>{
        rewardsUseable.map((reward)=>{
            if(reward?.docData?.shopId === shop?.docData?.userId){
                shopsExistData.push({
                    id:shop?.docData?.userId,
                    text:shop?.docData?.shopName
                })
            }
        })
    })
    const shopsExistUnique = shopsExistData.filter((obj, index) => shopsExistData.findIndex((item) => item.id === obj.id) === index)
    const rewardsFilter = rewardsUseable.filter((reward)=>{
        if(filterSelected?.id === "0-default" || filterSelected === null){
            return reward
        } else {
            return reward?.docData?.shopId === filterSelected?.id
        }
    })

    const onRefresh = ()=>{
        setShopsUpdate(true)
        setRewardsByShopUpdate(true)
        setGiftsUpdate(true)
    }
    
    const onPressItemFilter = (e) =>{
        if(e?.id === filterSelected?.id){
            setFilterSelected({id: "0-default",text: ""})
        } else {
            setFilterSelected(e)
        }
    }

    const onPressGoToProfil = () =>{
        goToScreen(navigation,"SetPersonnalInfos")
    }

    const currentShop = (shopId)=>{
        if(shopId){
            return currentShops.filter((shop)=>{
                return shop?.docData?.userId === shopId
            })
        }
    }

    const currentPartner = (shopId)=>{
        if(shopId){
            return shops.filter((shop)=>{
                return shop?.docData?.userId === shopId
            })
        }
    }

    const currentClient = (shopId)=>{
        if(shopId){
            return registeredShops.filter((shop)=>{
                return shop?.docData?.shopId === shopId
            })
        }
    }

    const onChangeFilterVisible = (e)=>{
        if(e === 0){
            setFilterVisible(false)
        }
        if(e === 1){
            setFilterVisible(true)
        }
    }
    
    useEffect(()=>{
        let data = []
        gifts.map((gift)=>{
            data.push(gift)
        })
        rewardsByShop.map((reward)=>{
            const client = currentClient(reward?.docData?.shopId)
            if(client[0]?.docData?.points >= reward?.docData?.points){
                data.push(reward)
            }
        })
        setRewardsUseable(data)
    },[registeredShops,rewardsByShopUpdate])

    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])

    return(<View style={[styles.viewContainer]}>

        <SafeAreaView />
        <View style={[styles.headerBg,{height:heightS * 0.3}]} />

        <Header
            title={traductor("Cadeaux disponibles")}
            titleStyle={[styles.headerTitle]}
            containerStyle={[{marginTop:statusBarHeigth}]}
            titleContainerStyle={[{alignItems:"flex-start"}]}
            imgRight={filterImg}
            imgRightStyle={[styles.headerImg]}
            rightAction={()=>onChangeFilterVisible(1)}
        />

        <Animated.FlatList
            data={rewardsFilter}
            onScroll={Animated.event(
                [{nativeEvent: {contentOffset: {y: scrollY} }}],
                { useNativeDriver: true }
            )}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item,index}) => {
                const shop = currentShop(item?.docData?.shopId)
                const partner = currentPartner(item?.docData?.shopId)
                const inputRange = [-1, 0, (ITEM_SIZE + 20) * index, (ITEM_SIZE + ITEM_SIZE * 0.2) * (index + 2)]
                const outputRange = [1,1,1,0]

                const scale = scrollY.interpolate({
                    inputRange: inputRange,
                    outputRange: outputRange,
                })

                const onRewardSelect = () =>{
                    if(!shop[0]?.docData?.userId && partner[0]?.docData?.userId && item?.docData?.giftType === "partner"){
                        let partners_id = item?.docData?.collectionId.split("_").slice(2)
                        let current_partner = partners_id.indexOf(partner[0]?.docData?.userId)
                        let shopId = partner[0]?.docData?.userId
                        
                        let partnerId = partners_id.filter((id)=>{
                            return id !== partners_id[current_partner]
                        })

                        goToScreen(navigation,"Shop",{shopId:shopId,partnerId:partnerId[0]})
                    } else {
                        setShopSelected(shop)
                        setRewardSelected(item)
                        setRewardSelectedVisible(true)
                    }
                }
                
                return(<Animated.View style={[Platform.OS === "ios" && boxShadowInput,{transform:[{scale}]}]}>
                    <TouchableOpacity style={[styles.item,Platform.OS === "android" && boxShadowInput]} onPress={onRewardSelect}>
                        <View style={[styles.itemImgContainer]}>
                            <Image style={[styles.itemImg]} source={{
                                uri: shop[0]?.docData?.logo_Shop_Img ? shop[0]?.docData?.logo_Shop_Img : Image.resolveAssetSource(defaultImg).uri
                            }} />
                        </View>
                        <View style={[styles.itemContent]}>
                            <View style={[styles.itemTitleContainer]}>
                                <Image style={[styles.itemIcon]} source={item?.docData?.giftType === "birthday" ? giftImg : item?.docData?.giftType === "lastVisit" ? comeBackImg : rewardsImg} />
                                <Text style={[styles.itemTitle]} numberOfLines={2}>{item?.docData?.value}{item?.docData?.type === 3 ? "" : item?.docData?.type === 2 ? traductor("% offerts") : ` ${shop[0]?.docData?.currency?.text || "USD"} ${traductor("offerts")}`}</Text>
                            </View>
                            <Text style={[styles.itemSubTitle]} numberOfLines={1}>{shop[0]?.docData?.shopName || partner[0]?.docData?.shopName}</Text>
                            <Text style={[styles.itemDescription]} numberOfLines={2}>{item?.docData?.description}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>)
            }}
            refreshControl={<RefreshControl refreshing={rewardsByShopUpdate} onRefresh={onRefresh} />}
            ListFooterComponent={<View style={[{marginBottom:bottomTarSpace + insets.bottom}]} />}
        />

        <Modal animationType={"slide"} visible={filterVisible} statusBarTranslucent>
            <View style={[styles.headerBg,{height:heightS * 0.3}]} />
            <Header
                title={traductor("Filtre")}
                containerStyle={[{marginTop:30}]}
                titleStyle={[styles.headerTitle,{left:-headerImgSize * 0.5}]}
                titleContainerStyle={[{overflow:"hidden"}]}
                imgLeft={arrowBackBgImg}
                imgLeftStyle={[styles.headerImg]}
                leftAction={()=>onChangeFilterVisible(0)}
            />
            <View style={[styles.filterContainer,boxShadowInput]}>
                <ScrollView style={[styles.filterScroll]}>
                    {shopsExistUnique.map((item, index)=>{
                        return(<TouchableOpacity style={[styles.filterItem]} key={index} onPress={()=>onPressItemFilter(item)}>
                            <View style={[styles.filterSelect]}>
                                <Text style={[styles.filterItemText]}>{index === 0 ? traductor("Aucun filtre") : item.text}</Text>
                                <View style={[styles.filterSquare,{backgroundColor:item?.id === filterSelected?.id ? primaryColor : "#fff"}]}>
                                    <View style={[styles.filterSquareCheck]}/>
                                </View>
                            </View>
                            <View style={[styles.filterSeparator]}/>
                        </TouchableOpacity>)
                    })}
                </ScrollView>

                <TouchableOpacity style={[styles.filterBtn]} onPress={()=>onChangeFilterVisible(0)}>
                    <Text style={[styles.filterBtnText]}>{traductor("Appliquer")}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
        
        <UseRewards
            navigation={navigation}
            shop={shopSelected}
            reward={rewardSelected}
            visible={rewardSelectedVisible}
            onVisible={setRewardSelectedVisible}
            onRefresh={onRefresh}
            goToProfil={onPressGoToProfil}
        />

        {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}

        {modalBox.renderBoxInfos("")}
    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    headerBg:{
        backgroundColor:primaryColor,
        borderBottomLeftRadius:37,
        borderBottomRightRadius:37,
        position:"absolute",
        left:0,
        right:0,
    },
    headerTitle:{
        fontSize:26,
        fontWeight:"600",
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    item:{
        backgroundColor:"#fff",
        flexDirection:"row",
        marginBottom:20,
        marginHorizontal:20,
        borderRadius:8,
        height:ITEM_SIZE,
    },
    itemImgContainer:{
        width:100,
        borderRightWidth:1,
        borderColor:"#cccccc30",
        alignItems:"center",
        justifyContent:"center",
        marginVertical:10,
    },
    itemImg:{
        width:60,
        height:60,
    },
    itemContent:{
        flex:1,
        justifyContent:"space-around",
        margin:20,
    },
    itemIcon:{
        width:20,
        height:20,
        marginRight:4,
    },
    itemTitleContainer:{
        flexDirection:"row",
        alignItems:"center",
    },
    itemTitle:{
        flex:1,
        fontSize:14,
        fontWeight:"bold",
        color:"#0E0E0E",
    },
    itemSubTitle:{
        fontSize:12,
        fontWeight:"600",
        color:"#0E0E0E",
        marginVertical:4,
    },
    itemDescription:{
        fontSize:12,
        fontWeight:"600",
        color:"#0E0E0E80",
    },
    filterContainer:{
        backgroundColor:"#fff",
        flex:1,
        marginHorizontal:20,
        marginBottom:40,
        borderRadius:12,
    },
    filterScroll:{
        flex:1,
        backgroundColor:"#fff",
        borderTopLeftRadius:12,
        borderTopRightRadius:12,
    },
    filterBtn:{
        backgroundColor:primaryColor,
        borderRadius:8,
        padding:15,
        margin:15,
    },
    filterBtnText:{
        fontSize:14,
        color:"#fff",
        fontWeight:"500",
        textAlign:"center",
    },
    filterSquare:{
        width:squareSize,
        height:squareSize,
        borderWidth:1,
        borderColor:"#00000020",
        borderRadius:4,
        backgroundColor:"#fff",
        alignItems:"center",
        justifyContent:"center",
    },
    filterSquareCheck:{
        width:squareSize * 0.4,
        height:squareSize * 0.3,
        bottom:squareSize * 0.1,
        borderTopWidth:1,
        borderRightWidth:1,
        borderColor:"#fff",
        transform:[{rotate:"135 deg"}],
    },
    filterItem:{
        marginHorizontal:15,
    },
    filterItemText:{
        fontSize:14,
        color:"#0E0E0E",
        fontWeight:"500",
    },
    filterSelect:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        paddingVertical:20,
    },
    filterSeparator:{
        borderTopWidth:1,
        borderColor:"#00000010",
    },
})