import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext, boxShadowInput, goToScreen } from '../AGTools';
import { useIsFocused } from '@react-navigation/native';
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    updateDoc,
} from '@react-native-firebase/firestore';
import MarketingCampaignResume from './MarketingCampaignResume';

const giftImg = require("../img/birthday.png")
const comeBackImg = require("../img/comeBack.png")
const googleImg = require("../img/social/google.png")
const instagramImg = require("../img/social/instagram.png")
const partner_giftImg = require("../img/partner_gift.png")

const ITEM_SIZE = 126

export default function Notifications({
    navigation,
}){
    const {
        currentShops,
        notifications,
        registeredShops,
    } = useContext(UserContext)

    const [campaignPreview, setCampaignPreview] = useState(false)
    const [campaign, setCampaign] = useState(null)
    const [rewardsByShop, setRewardsByShop] = useState([])
    const [rewardsByShopUpdate, setRewardsByShopUpdate] = useState(true)

    const currentUser = auth.currentUser
    const isFocused = useIsFocused()
    const modalBox = ModalBox()
    const scrollY = useRef(new Animated.Value(0)).current
    const notificationsCollection = collection(firestore, "Clients", currentUser.uid, "Notifications");
    const campaignsCollection = collection(firestore, "CampaignsShops");

    const campaignIdList = () =>{
        let list = []
        notifications.map(async(notif)=>{
            if(notif?.docData?.campaignId){
                list.push(notif?.docData?.campaignId)
            }
        })
        return {listIds: list}
    }
    const { listIds } = campaignIdList()

    const onPressItem = async (item) => {
        if (!item?.docData?.collectionId) return;

        const notifDoc = doc(notificationsCollection, item.docData.collectionId);
        
        try {
            if (item?.docData?.data?.type === "lastVisit" || 
                item?.docData?.data?.type === "birthday" || 
                item?.docData?.data?.type === "googleReview" || 
                item?.docData?.data?.type === "followInsta") {
                
                setCampaign(item?.docData?.data);
                setTimeout(async () => {
                    await updateDoc(notifDoc, {
                        isShow: true,
                    });
                    goToScreen(navigation, "Shop", { shopId: item?.docData?.data?.shopId });
                }, 500);
            } else if (item?.docData?.data?.campaignId) {
                setCampaign(item?.docData?.data);
                setCampaignPreview(true);
                setTimeout(async () => {
                    await updateDoc(notifDoc, {
                        isShow: true,
                    });
                }, 500);
            } else {
                setTimeout(async () => {
                    await updateDoc(notifDoc, {
                        isShow: true,
                    });
                }, 500);
            }
        } catch (error) {
            console.error("Error updating notification:", error);
        }
    };

    const onCloseItem = ()=>{
        setCampaignPreview(false)
    }

    const currentCampaign = (campaignId)=>{
        if(campaignId){
            return rewardsByShop.filter((campaign)=>{
                return campaign?.docData?.campaignShopId === campaignId
            })
        }
    }

    const currentShop = (shopId)=>{
        if(shopId){
            return currentShops.filter((shop)=>{
                return shop?.docData?.userId === shopId
            })
        }
    }

    const onPressShop = ()=>{
        goToScreen(navigation,"Shop",{shopId:campaign?.shopId})
        setTimeout(()=>{
            onCloseItem()
        },1000)
    }

    const onPressLocation = ()=>{
        if(campaign?.address){
            const url = Platform.select({
                ios: `maps:0,0?q=${campaign?.address}`,
                android: `geo:0,0?q=${campaign?.address}`,
            })
            Linking.openURL(url)
        }
    }

    const onConfirm = ()=>{
        goToScreen(navigation,"LogHome")
        setTimeout(()=>{
            onCloseItem()
        },1000)
    }

    const fetchCampaignByNotification = async () => {
        if (!listIds || listIds.length === 0) return;

        try {
            let allData = [];
            const perChunk = 10;

            // Diviser les IDs en chunks de 10
            const chunks = listIds.reduce((resultArray, item, index) => { 
                const chunkIndex = Math.floor(index/perChunk);
                if(!resultArray[chunkIndex]) {
                    resultArray[chunkIndex] = [];
                }
                resultArray[chunkIndex].push(item);
                return resultArray;
            }, []);

            // Traiter chaque chunk
            for (const chunk of chunks) {
                const q = query(
                    campaignsCollection,
                    where("campaignShopId", "in", chunk)
                );
                const querySnapshot = await getDocs(q);
                const chunkData = querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                }));
                allData = [...allData, ...chunkData];
            }

            setRewardsByShop(allData);
            setRewardsByShopUpdate(false);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            setRewardsByShopUpdate(false);
        }
    };
    
    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])

    useEffect(()=>{
        (rewardsByShopUpdate && listIds?.length > 0) && fetchCampaignByNotification()
    },[rewardsByShopUpdate,listIds])

    return(<View style={[styles.viewContainer]}>

        <SafeAreaView />

        <Animated.FlatList
            data={notifications}
            onScroll={Animated.event(
                [{nativeEvent: {contentOffset: {y: scrollY} }}],
                { useNativeDriver: true }
            )}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item,index}) => {
                const shop = currentShop(item?.docData?.data?.shopId)
                const campaign = currentCampaign(item?.docData?.data?.campaignId)
                const inputRange = [-1, 0, (ITEM_SIZE + 20) * index, (ITEM_SIZE + ITEM_SIZE * 0.2) * (index + 2)]
                const outputRange = [1,1,1,0]

                let shopRating = shop?.docData?.shopRating
                let shopRatingNumber = shop?.docData?.shopRatingNumber
                let hasRating = registeredShops.filter((registered)=>{
                    return registered?.docData?.shopId === item?.docData?.shopId
                })

                const scale = scrollY.interpolate({
                    inputRange: inputRange,
                    outputRange: outputRange,
                })

                let itemId = item?.docId
                let newItem = item?.docData
                
                newItem.shopRating = shopRating
                newItem.shopRatingNumber = shopRatingNumber
                newItem.hasRating = hasRating[0]?.docData?.ratingNote
                newItem.collectionId = newItem.collectionId || itemId

                let newDocdata = {docData:newItem}

                return(<Animated.View style={[index === 0 && {marginTop:20},Platform.OS === "ios" && boxShadowInput,{transform:[{scale}]}]}>
                    <TouchableOpacity style={[styles.item,Platform.OS === "android" && boxShadowInput]} onPress={()=>onPressItem(newDocdata,index)}>
                        <View style={[styles.itemImgContainer]}>
                            {(campaign && campaign[0]?.docData?.campaign_Shop_Banner)
                                ? <Image style={[styles.itemImg]} source={{uri:campaign[0]?.docData?.campaign_Shop_Banner}} />
                                : item?.docData?.data?.type === "lastVisit"
                                ? <Image style={[styles.itemImg]} source={{uri:Image.resolveAssetSource(comeBackImg).uri}} />
                                : item?.docData?.data?.type === "googleReview"
                                ? <Image style={[styles.itemImg]} source={{uri:Image.resolveAssetSource(googleImg).uri}} />
                                : item?.docData?.data?.type === "followInsta"
                                ? <Image style={[styles.itemImg]} source={{uri:Image.resolveAssetSource(instagramImg).uri}} />
                                : item?.docData?.data?.type === "gift_partner"
                                ? <Image style={[styles.itemImg]} source={{uri:Image.resolveAssetSource(partner_giftImg).uri}} />
                                : item?.docData?.data?.type === "birthday"
                                && <Image style={[styles.itemImg]} source={{uri:Image.resolveAssetSource(giftImg).uri}} />
                            }
                        </View>
                        <View style={[styles.itemContent]}>
                            <View style={[styles.itemTitleContainer]}>
                                {shop?.length === 1 && <Image style={[styles.itemIcon]} source={{uri:shop[0]?.docData?.logo_Shop_Img}} />}
                                <Text style={[styles.itemTitle]}>{shop?.length === 1 ? shop[0]?.docData?.shopName : item?.docData?.title}</Text>
                            </View>
                            <Text style={[styles.itemDescription]} numberOfLines={3}>{campaign && campaign[0]?.docData?.message ? campaign[0]?.docData?.message : item?.docData?.body}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>)
            }}
        />

        <Modal
            style={[{backgroundColor:"#222222"}]}
            animationType="fade"
            transparent={false}
            visible={campaignPreview}
            statusBarTranslucent={true}
            onRequestClose={onCloseItem}
        >
            <MarketingCampaignResume
                navigation={navigation}
                shopId={campaign?.shopId}
                campaignId={campaign?.campaignId}
                campaignProps={campaign}
                onBack={onCloseItem}
                onShopAction={onPressShop}
                onLocationAction={onPressLocation}
                onConfirm={onConfirm}
            />
        </Modal>

        {modalBox.renderBoxInfos("")}
    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
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
        padding:20,
        justifyContent:"space-around"
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
        fontSize:16,
        fontWeight:"bold",
        color:"#0E0E0E",
    },
    itemDescription:{
        fontSize:12,
        fontWeight:"600",
        color:"#0E0E0E80",
    },
})