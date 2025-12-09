import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Modal, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NoUserContext, UserContext, bottomTarSpace, campaignTypes, distanceBetweenPoints, goToScreen, primaryColor, setAppLang, traductor } from '../AGTools';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import MarketingCampaignResume from './MarketingCampaignResume';
import { AuthContext } from '../Login';
import NFCRead from '../NFCRead';
import { ModalBox } from '../ModalBox';
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    startAfter,
    limit,
} from '@react-native-firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const appIcon = require("../img/logo/defaultImg.png")
const locationDistImg = require("../img/locationDist.png")
const ratingImg = require("../img/reviews.png")
const ratingSelectedImg = require("../img/ratingSelected.png")
const offre00 = require("../img/offre00.png")
const offre00_en = require("../img/offre00_en.png")
const offre01 = require("../img/offre01.png")
const offre02 = require("../img/offre02.png")
const offre03 = require("../img/offre03.png")
const offre03_en = require("../img/offre03_en.png")
const offre04 = require("../img/offre04.png")
const offre05 = require("../img/offre05.png")
const offre05_en = require("../img/offre05_en.png")
const offre06 = require("../img/offre06.png")
const offre06_en = require("../img/offre06_en.png")
const offre07 = require("../img/offre07.png")
const offre07_en = require("../img/offre07_en.png")

const widthW = Dimensions.get("window").width
const campaignSpecialImgSize = widthW * 0.5
const campaignImgSize = 60
const btnSize = 40

export default function OffersList({
    navigation,
}) {
    const authContext = useContext(AuthContext)
    const {
        user,
        noUserlocation,
        setShopsUpdate,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const [campaignPreview, setCampaignPreview] = useState(false)
    const [campaign, setCampaign] = useState(null)
    const [campaignCount, setCampaignCount] = useState(null)

    const db = getFirestore();
    const isFocused = useIsFocused()
    const modalBox = ModalBox()
    const campaignsCollection = collection(db, "CampaignsShops")
    const insets = useSafeAreaInsets()

    const fetchCampaignCount = async () => {
        if (user?.docData?.geolocation || noUserlocation?.country) {
            try {
                const q = query(
                    campaignsCollection,
                    where("isFinish", "==", false),
                    where("campaign_Shop_Valid", "==", true),
                    where("country_short", "==", user?.docData?.geolocation?.country_short || noUserlocation?.country_short)
                );
                const snapshot = await getDocs(q);
                setCampaignCount(snapshot.size);
            } catch (error) {
                console.error("Erreur lors du comptage des campagnes:", error);
                setCampaignCount(0);
            }
        }
    }

    const listCategories = [
        { id: "lunch", text: "Lunch Deal", icon: Image.resolveAssetSource(offre01).uri },
        { id: "ladies_night", text: "Ladies Night", icon: Image.resolveAssetSource(offre02).uri },
        { id: "student", text: "Étudiant", icon: Image.resolveAssetSource(offre04).uri },
        { id: "eat", text: "Manger", icon: Image.resolveAssetSource(offre03).uri },
        { id: "party", text: "Sortir", icon: Image.resolveAssetSource(offre07).uri },
        { id: "buyFree", text: "1 ACHETÉ = 1 OFFERT", icon: Image.resolveAssetSource(offre06).uri },
        { id: "reduction", text: "Réductions", icon: Image.resolveAssetSource(offre05).uri },
        { id: "free", text: "1 produit offert", icon: Image.resolveAssetSource(offre00).uri },
    ]
    const listCategories_en = [
        { id: "lunch", text: "Lunch Deal", icon: Image.resolveAssetSource(offre01).uri },
        { id: "ladies_night", text: "Ladies Night", icon: Image.resolveAssetSource(offre02).uri },
        { id: "student", text: "Étudiant", icon: Image.resolveAssetSource(offre04).uri },
        { id: "eat", text: "Manger", icon: Image.resolveAssetSource(offre03_en).uri },
        { id: "party", text: "Sortir", icon: Image.resolveAssetSource(offre07_en).uri },
        { id: "buyFree", text: "1 ACHETÉ = 1 OFFERT", icon: Image.resolveAssetSource(offre06_en).uri },
        { id: "reduction", text: "Réductions", icon: Image.resolveAssetSource(offre05_en).uri },
        { id: "free", text: "1 produit offert", icon: Image.resolveAssetSource(offre00_en).uri },
    ]

    const onRefresh = useCallback(() => {
        setShopsUpdate(true)
        const resetAction = CommonActions.reset({
            index: 0,
            routes: [{ name: "Coupon" }]
        })
        navigation.dispatch(resetAction)
    }, [])

    const onCloseItem = () => {
        setCampaignPreview(false)
    }

    const onPressCampaignItem = (item) => {
        setCampaign(item?.docData)
        setCampaignPreview(true)
    }

    const onPressShop = () => {
        goToScreen(navigation, "Shop", { shopId: campaign?.shopId })
        setTimeout(() => {
            onCloseItem()
        }, 1000)
    }

    const onPressLocation = () => {
        if (campaign?.address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${campaign?.address}`,
                android: `geo:0,0?q=${campaign?.address}`,
            })
            Linking.openURL(url)
        }
    }

    const onPressGeolocation = () => {
        goToScreen(navigation, "GeolocationView", { from: "Coupon" })
    }

    const onConfirm = () => {
        goToScreen(navigation, "LogHome")
        setTimeout(() => {
            onCloseItem()
        }, 1000)
    }

    const onPressAll = (e) => {
        switch (e) {
            case "classic":
                goToScreen(navigation, "CampaignsList", { title: "Classique", query: ["classic"] })
                break;
            case "lunch":
                goToScreen(navigation, "CampaignsList", { title: "Lunch Deal", query: ["lunch"] })
                break;
            case "ladies_night":
                goToScreen(navigation, "CampaignsList", { title: "Ladies Night", query: ["ladies_night"] })
                break;
            case "student":
                goToScreen(navigation, "CampaignsList", { title: "Étudiant", query: ["student"] })
                break;
            case "eat":
                goToScreen(navigation, "CampaignsList", { title: "Manger", query: ["boulangers", "restaurants", "restauration-rapide", "lunch", "coffee_shop"] })
                break;
            case "party":
                goToScreen(navigation, "CampaignsList", { title: "Sortir", query: ["restaurants", "bar"] })
                break;
            case "buyFree":
                goToScreen(navigation, "CampaignsList", { title: "1 ACHETÉ = 1 OFFERT", query: ["buyFree"] })
                break;
            case "reduction":
                goToScreen(navigation, "CampaignsList", { title: "Réductions", query: ["reduction"] })
                break;
            case "free":
                goToScreen(navigation, "CampaignsList", { title: "1 produit offert", query: ["free"] })
                break;
            default: goToScreen(navigation, "CampaignsList", { title: "Les offres", query: ["all"] })
                break;
        }
    }

    useEffect(() => {
        isFocused && StatusBar.setBarStyle("dark-content", true)
    }, [isFocused])

    useEffect(() => {
        fetchCampaignCount()
    }, [])

    return (<View style={[styles.viewContainer]}>

        <SafeAreaView style={[{ marginBottom: 10 }]} />

        <View style={[{ height: 20 }]} />

        <View style={[{ marginLeft: 5, marginVertical: 20 }]}>
            <Text style={[styles.headerTitle]}>{traductor("Coupon")}</Text>

            {<TouchableOpacity style={[styles.localisationBtn]} onPress={onPressGeolocation}>
                <Image resizeMode={"contain"} style={[styles.imgSize]} source={locationDistImg} />
                {user ? <Text numberOfLines={1}>{user?.docData?.geolocation?.city || traductor("Localisation")}</Text> :
                    <Text numberOfLines={1}>{noUserlocation?.city || traductor("Localisation")}</Text>}
            </TouchableOpacity>}
        </View>



        <ScrollView
            refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
            contentContainerStyle={[{ paddingBottom: bottomTarSpace + insets.bottom }]}
        >
            <ScrollView contentContainerStyle={[{ marginBottom: 10 }]} bounces={false} showsHorizontalScrollIndicator={false} horizontal>
                {setAppLang() === "fr"
                    ? listCategories.map((categorie, index) => {
                        return (<TouchableOpacity style={[{ marginRight: 20, marginLeft: index === 0 ? 20 : 0 }]} key={index} onPress={() => onPressAll(categorie.id)}>
                            <Image style={[{ width: 150, height: 188, borderRadius: 8 }]} source={{ uri: categorie.icon }} />
                        </TouchableOpacity>)
                    })
                    : listCategories_en.map((categorie, index) => {
                        return (<TouchableOpacity style={[{ marginRight: 20, marginLeft: index === 0 ? 20 : 0 }]} key={index} onPress={() => onPressAll(categorie.id)}>
                            <Image style={[{ width: 150, height: 188, borderRadius: 8 }]} source={{ uri: categorie.icon }} />
                        </TouchableOpacity>)
                    })
                }
            </ScrollView>

            {campaignCount === 0 && <View style={[{ flex: 1, justifyContent: "center" }]}>
                <View style={[styles.offerError]}>
                    <Text style={[{ color: "#fff" }]}>{traductor("Aucune offre dans votre pays")}</Text>
                    <Text style={[{ color: "#fff" }]}>{traductor("Parlez de nous à vos boutiques préférées")}</Text>
                </View>
            </View>}

            {campaignTypes.map((type, index) => {
                return <View key={index}>
                    <RenderListCampaigns
                        type={type}
                        imgSize={styles.campaignSpecialImg}
                        maxSize={campaignSpecialImgSize}
                        onPressCampaignItem={onPressCampaignItem}
                        onPressAll={onPressAll}
                    />
                </View>
            })}
        </ScrollView>

        {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}

        <Modal
            style={[{ backgroundColor: "#222222" }]}
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

        {modalBox.renderBoxInfos("")}
    </View>)
}


export const RenderListCampaigns = (props) => {
    const authContext = useContext(AuthContext)
    const {
        user,
        noUserlocation,
        shops,
        registeredShops,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const db = getFirestore();
    const [lastVisible, setLastVisible] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const limitData = 8;
    const campaignsCollection = collection(db, "CampaignsShops");
    const filter_query = [props.type.id];

    const fetchCampaigns = async (isLoadingMore = false) => {
        try {
            let q = query(
                campaignsCollection,
                where("isFinish", "==", false),
                where("campaign_Shop_Valid", "==", true),
                where("campaign_type", "array-contains-any", filter_query),
                orderBy("dateStart", "desc")
            );

            if (user?.docData?.geolocation?.country_short || noUserlocation?.country_short) {
                q = query(
                    q,
                    where("country_short", "==", user?.docData?.geolocation?.country_short || noUserlocation?.country_short)
                );
            }

            if (lastVisible && isLoadingMore) {
                q = query(q, startAfter(lastVisible), limit(limitData));
            } else {
                q = query(q, limit(limitData));
            }

            const snapshot = await getDocs(q);
            const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
            
            const newCampaigns = snapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }));

            if (isLoadingMore) {
                setCampaigns(prev => [...prev, ...newCampaigns]);
            } else {
                setCampaigns(newCampaigns);
            }

            setLastVisible(lastVisibleDoc);
            setHasMore(snapshot.docs.length === limitData);
        } catch (error) {
            console.error("Erreur lors de la récupération des campagnes:", error);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        await fetchCampaigns(true);
    };

    useEffect(() => {
        fetchCampaigns();
    }, [user?.docData?.geolocation?.country_short, noUserlocation?.country_short]);

    const defaultIcon = Image.resolveAssetSource(appIcon).uri;

    const getCurrentShop = (shopId) => {
        return shops.filter((shop) => {
            return shop.docId === shopId
        })
    }

    const returnCampaignDistance = (campaign) => {
        let campaignLocation = campaign?.docData?.coordinate
        let campaignLat = campaignLocation?.latitude
        let campaignLng = campaignLocation?.longitude
        let userLocation = authContext.user ? user?.docData?.geolocation : noUserlocation
        let userLat = userLocation?.latitude
        let userLng = userLocation?.longitude
        let kilometer = 1000

        let distance = distanceBetweenPoints(campaignLat, campaignLng, userLat, userLng) / kilometer

        return Math.round(distance)
    }

    const renderTitleCampaigns = (title, onPress, btnText) => {
        return <View style={[styles.sectionTitleContainer]}>
            <Text style={[styles.sectionTitle]}>{traductor(title)}</Text>
            <TouchableOpacity style={[styles.sectionTitleBtn]} onPress={() => props.onPressAll(onPress)}>
                <Text style={[styles.sectionTitleBtnText]}>{traductor(btnText)}</Text>
                <View style={[styles.sectionTitleBtnArrow]} />
            </TouchableOpacity>
        </View>
    }

    if (loading) {
        return <ActivityIndicator style={{ marginBottom: 30 }} size="large" color={primaryColor} animating={true} />;
    }

    if (campaigns.length === 0 && !loading) {
        return null;
    }

    return <View style={[]}>
        {renderTitleCampaigns(props.type.text, props.type.id, "Tout")}
        <FlatList
            data={campaigns}
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
                let distance = returnCampaignDistance(item);
                let shop = getCurrentShop(item?.docData?.shopId)[0];
                let shopName = shop?.docData?.shopName;
                let shopRating = shop?.docData?.shopRating;
                let shopRatingNumber = shop?.docData?.shopRatingNumber;
                let hasRating = registeredShops.filter((registered) => {
                    return registered?.docData?.shopId === item?.docData?.shopId;
                });
                let newItem = item.docData;

                newItem.shopRating = shopRating;
                newItem.shopRatingNumber = shopRatingNumber;
                newItem.hasRating = hasRating[0]?.docData?.ratingNote;

                let newDocdata = { docData: newItem };

                return (<TouchableOpacity 
                    style={[styles.itemContainer, { 
                        maxWidth: props.maxSize, 
                        marginLeft: index === 0 ? 20 : 0, 
                        marginRight: 20, 
                        justifyContent: "space-between" 
                    }]} 
                    onPress={() => props.onPressCampaignItem(newDocdata, index)}
                >
                    <View>
                        <Image 
                            style={[props.imgSize]} 
                            source={{ uri: item?.docData?.campaign_Shop_Banner ? item?.docData?.campaign_Shop_Banner : defaultIcon }} 
                        />
                        <Text style={[styles.itemText, styles.title]} numberOfLines={2}>{item?.docData?.title}</Text>
                    </View>
                    <View>
                        <Text style={[styles.itemText, styles.subTitle]} numberOfLines={1}>{shopName}</Text>
                        <View style={[styles.campaignRatingContainer]}>
                            <View>
                                {(distance || distance === 0) && <View style={[styles.campaignRating]}>
                                    <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={locationDistImg} />
                                    <Text style={[styles.itemText, styles.subTitle, { marginTop: 0 }]}>{distance} {"Km"}</Text>
                                </View>}
                            </View>
                            <View>
                                <View style={[styles.campaignRating]}>
                                    <Image 
                                        resizeMode={"contain"} 
                                        style={[styles.campaignRatingImg]} 
                                        source={hasRating[0]?.docData?.ratingNote ? ratingSelectedImg : ratingImg} 
                                    />
                                    {shopRating && <Text style={[styles.itemText, styles.subTitle, { marginTop: 0 }]}>{shopRating}</Text>}
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>);
            }}
            ListFooterComponent={() => {
                if (isLoadingMore) {
                    return <ActivityIndicator style={{ marginHorizontal: 20 }} size="small" color={primaryColor} />;
                }
                return null;
            }}
        />
    </View>;
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    section: {
        marginVertical: 5,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "bold",
        marginLeft: 10,
        marginBottom: 5,
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 15,
        marginHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: "#0F0E0E",
        fontWeight: "600",
    },
    sectionTitleBtn: {
        flexDirection: "row",
        alignItems: "center",
    },
    sectionTitleBtnText: {
        fontSize: 16,
        color: "#0F0E0E80",
        fontWeight: "500",
        marginRight: 6,
    },
    sectionTitleBtnArrow: {
        width: 8,
        height: 8,
        marginTop: 2,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderColor: "#0F0E0E80",
        transform: [{ rotate: "45deg" }],
    },
    itemContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    itemImg: {
        width: campaignImgSize,
        height: campaignImgSize,
    },
    itemText: {
        fontSize: 14,
        color: "#0F0E0E",
        fontWeight: "400",
        marginTop: 5,
        textAlign: "center",
    },
    title: {
        fontWeight: "bold",
        textAlign: "left",
    },
    subTitle: {
        color: "#0F0E0E70",
        fontSize: 12,
        textAlign: "left",
    },
    campaignRatingContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    campaignRating: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 21,
    },
    campaignRatingImg: {
        width: 10,
        height: 10,
        marginRight: 4,
    },
    campaignSpecialImg: {
        width: campaignSpecialImgSize,
        height: campaignSpecialImgSize,
    },
    imgSize: {
        width: btnSize * 0.4,
        height: btnSize * 0.4,
        marginRight: 6,
    },
    localisationBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
    },
    offerError: {
        alignItems: "center",
        paddingVertical: 20,
        backgroundColor: primaryColor,
        borderRadius: 15,
        marginHorizontal: 20,
        marginVertical: 30,
    },
})