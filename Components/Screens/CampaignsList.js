import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, NoUserContext, UserContext, distanceBetweenPoints, goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';
import { useIsFocused } from '@react-navigation/native';
import MarketingCampaignResume from './MarketingCampaignResume';
import { AuthContext } from '../Login';
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
} from '@react-native-firebase/firestore';

const defaultImg = require("../img/logo/defaultImg.png")
const arrowBack = require("../img/arrow/arrowBackBg.png")
const locationDistImg = require("../img/locationDist.png")
const ratingImg = require("../img/reviews.png")
const ratingSelectedImg = require("../img/ratingSelected.png")

const widthW = Dimensions.get("window").width
const headerImgSize = 40
const numberColoumn = 2
const itemSize = widthW

export default function CampaignsList({
    navigation,
    route,
}){
    const authContext = useContext(AuthContext)
    const {
        user,
        noUserlocation,
        shops,
        registeredShops,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const [campaignPreview, setCampaignPreview] = useState(false)
    const [campaign, setCampaign] = useState(null)
    const [campaigns, setCampaigns] = useState([])
    const [lastDoc, setLastDoc] = useState(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const db = getFirestore();
    const isFocused = useIsFocused()
    const limitData = 12
    const campaignsCollection = collection(db, "CampaignsShops")
    const filter_query = route?.params?.query

    const getInitialQuery = () => {
        let baseQuery = query(
            campaignsCollection,
            where("isFinish", "==", false),
            where("campaign_Shop_Valid", "==", true),
            where("campaign_type", "array-contains-any", filter_query),
            orderBy("dateStart", "desc"),
            limit(limitData)
        );

        if (user?.docData?.geolocation?.country_short || noUserlocation?.country_short) {
            baseQuery = query(
                baseQuery,
                where("country_short", "==", user?.docData?.geolocation?.country_short || noUserlocation?.country_short)
            );
        }

        return baseQuery;
    };

    const getPaginatedQuery = (lastDoc) => {
        let paginatedQuery = query(
            campaignsCollection,
            where("isFinish", "==", false),
            where("campaign_Shop_Valid", "==", true),
            where("campaign_type", "array-contains-any", filter_query),
            orderBy("dateStart", "desc"),
            startAfter(lastDoc),
            limit(limitData)
        );

        if (user?.docData?.geolocation?.country_short || noUserlocation?.country_short) {
            paginatedQuery = query(
                paginatedQuery,
                where("country_short", "==", user?.docData?.geolocation?.country_short || noUserlocation?.country_short)
            );
        }

        return paginatedQuery;
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(getInitialQuery());
            return {
                data: querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                })),
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        } catch (error) {
            console.error("Error fetching initial data:", error);
            return { data: [], lastDoc: null };
        } finally {
            setLoading(false);
        }
    };

    const fetchMoreData = async (lastDoc) => {
        if (!lastDoc) return { data: [], lastDoc: null };
        
        try {
            const querySnapshot = await getDocs(getPaginatedQuery(lastDoc));
            return {
                data: querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                })),
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        } catch (error) {
            console.error("Error fetching more data:", error);
            return { data: [], lastDoc: null };
        }
    };

    const getCurrentShop = (campaignId)=>{
        return shops.filter((shop)=>{
            return shop.docId === campaignId
        })
    }

    const returnCampaignDistance = (campaign)=>{
        let campaignLocation = campaign?.docData?.coordinate
        let campaignLat = campaignLocation?.latitude
        let campaignLng = campaignLocation?.longitude
        let userLocation = authContext.user ? user?.docData?.geolocation : noUserlocation
        let userLat = userLocation?.latitude
        let userLng = userLocation?.longitude
        let kilometer = 1000
        
        let distance = distanceBetweenPoints(campaignLat,campaignLng,userLat,userLng)/kilometer

        return Math.round(distance)
    }

    const onBack = () =>{
        goToScreen(navigation,"goBack")
    }

    const onPressItem = (item,index)=>{
        setCampaign(item?.docData)
        setCampaignPreview(true)
    }

    const onCloseItem = ()=>{
        setCampaignPreview(false)
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

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const { data, lastDoc: newLastDoc } = await fetchInitialData();
            setCampaigns(data);
            setLastDoc(newLastDoc);
            setHasMore(data.length === limitData);
        } catch (error) {
            console.error("Error loading initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreData = async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const { data, lastDoc: newLastDoc } = await fetchMoreData(lastDoc);
            if (data.length > 0) {
                setCampaigns(prev => [...prev, ...data]);
                setLastDoc(newLastDoc);
                setHasMore(data.length === limitData);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadInitialData();
        setRefreshing(false);
    };

    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])

    useEffect(() => {
        loadInitialData();
    }, [filter_query]);

    return(<View style={[styles.viewContainer]}>

        <SafeAreaView style={{backgroundColor:primaryColor}}/>
        <View style={[styles.headerBg]} />

        <Header
            title={traductor(route?.params?.title)}
            containerStyle={[styles.header]}
            titleStyle={[styles.headerTitle,{marginRight:headerImgSize}]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onBack}
        />

        {loading && campaigns.length === 0 ? (
            <View style={[{flex:1,justifyContent:"center"}]}>
                <ActivityIndicator style={{marginBottom:30}} size="large" color={primaryColor} animating={true} />
            </View>
        ) : (
            <FlatList
                data={campaigns}
                onEndReached={loadMoreData}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                contentContainerStyle={[{gap:20,paddingHorizontal:20,paddingTop:20}]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => {
                    let distance = returnCampaignDistance(item)
                    let shop = getCurrentShop(item?.docData?.shopId)[0]
                    let shopName = shop?.docData?.shopName
                    let shopRating = shop?.docData?.shopRating
                    let shopRatingNumber = shop?.docData?.shopRatingNumber
                    let hasRating = registeredShops.filter((registered)=>{
                        return registered?.docData?.shopId === item?.docData?.shopId
                    })
                    let newItem = item.docData

                    newItem.shopRating = shopRating
                    newItem.shopRatingNumber = shopRatingNumber
                    newItem.hasRating = hasRating[0]?.docData?.ratingNote

                    let newDocdata = {docData:newItem}

                    return(<TouchableOpacity style={[styles.item,{justifyContent:"space-between"}]} onPress={()=>onPressItem(newDocdata,index)}>
                        <View>
                            <Image style={[styles.itemImg]} source={{uri:item?.docData?.campaign_Shop_Banner ? item?.docData?.campaign_Shop_Banner : Image.resolveAssetSource(defaultImg).uri}} resizeMode={"cover"} />
                            <Text style={[styles.itemTitle]} numberOfLines={2}>{item?.docData?.title}</Text>
                        </View>
                        <View>
                            <Text style={[styles.itemTerm,{marginBottom:2}]} numberOfLines={1}>{shopName}</Text>
                            <View style={[styles.campaignRatingContainer]}>
                                <View>
                                    {(distance || distance === 0) && <View style={[styles.campaignRating]}>
                                        <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={locationDistImg} />
                                        <Text style={[styles.itemText,styles.subTitle,{marginTop:0}]}>{distance} {"Km"}</Text>
                                    </View>}
                                </View>
                                <View>
                                    <View style={[styles.campaignRating]}>
                                        <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={hasRating[0]?.docData?.ratingNote ? ratingSelectedImg : ratingImg} />
                                        {shopRating && <Text style={[styles.itemText,styles.subTitle,{marginTop:0}]}>{shopRating}</Text>}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>)
                }}
                ListEmptyComponent={!loading && (
                    <View style={[{flex:1,justifyContent:"center"}]}>
                        <View style={[styles.offerError]}>
                            <Text style={[{color:"#fff"}]}>{traductor("Aucune offre dans votre pays")}</Text>
                            <Text style={[{color:"#fff"}]}>{traductor("Parlez de nous à vos boutiques préférées")}</Text>
                        </View>
                    </View>
                )}
                onEndReachedThreshold={0.5}
                scrollEventThrottle={150}
                ListFooterComponentStyle={{justifyContent:"center"}}
                ListFooterComponent={() => (
                    loading && campaigns.length > 0 && hasMore ? (
                        <ActivityIndicator style={{marginBottom:30}} size="large" color={primaryColor} animating={true} />
                    ) : null
                )}
                key={numberColoumn}
                numColumns={numberColoumn}
                columnWrapperStyle={[{gap:20}]}
            />
        )}

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
                campaignId={campaign?.campaignShopId}
                campaignProps={campaign}
                onBack={onCloseItem}
                onShopAction={onPressShop}
                onLocationAction={onPressLocation}
                onConfirm={onConfirm}
            />
        </Modal>

    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    headerBg:{
        paddingTop:statusBarHeigth,
        backgroundColor:primaryColor,
        position:"absolute",
        left:0,
        right:0,
    },
    header:{
        marginTop:statusBarHeigth,
        borderBottomLeftRadius:20,
        borderBottomRightRadius:20,
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    headerTitle:{
        fontSize:20,
        fontWeight:"600",
    },
    item:{
        flex:1,
        backgroundColor:"#fff",
        maxWidth:(itemSize - 40) * 0.5,
    },
    itemContent:{
        flex:1,
        width:(itemSize - 40) * 0.5,
    },
    itemImg:{
        width:(itemSize - 40) * 0.5,
        height:(itemSize - 40) * 0.5,
        borderRadius:8,
    },
    itemTitle:{
        marginTop:10,
        fontSize:14,
        color:"#1D1D1B",
        fontWeight:"600",
    },
    itemTerm:{
        marginTop:4,
        fontSize:12,
        color:"#B8BBC6",
        fontWeight:"500",
    },
    filterOverlayV:{
        flex:1,
        backgroundColor:"#00000020",
    },
    filterOverlayH:{
        flex:0.2,
        backgroundColor:"#00000020",
    },
    itemFilter:{
        alignItems:"center",
        justifyContent:"center",
    },
    itemFilterText:{
        fontSize:16,
        color:primaryColor,
        fontWeight:"400",
        paddingVertical:14,
    },
    itemFilterValue:{
        fontSize:16,
        color:"#000",
        width:"100%",
        fontWeight:"700",
        textAlign:"center",
        paddingVertical:14,
        borderBottomWidth:2,
        borderColor:"#00000020",
    },
    separator:{
        borderTopWidth:1,
        marginHorizontal:20,
        borderColor:"#00000010",
    },
    box:{
        flex:1,
        overflow:"hidden",
        backgroundColor:"#00000020",
    },
    offerError:{
        alignItems:"center",
        paddingVertical:20,
        backgroundColor:primaryColor,
        borderRadius:15,
        marginHorizontal:20,
        marginVertical:30,
    },
    campaignRatingContainer:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
    },
    campaignRating:{
        flexDirection:"row",
        alignItems:"center",
        minHeight:21,
    },
    campaignRatingImg:{
        width:10,
        height:10,
        marginRight:4,
    },
})