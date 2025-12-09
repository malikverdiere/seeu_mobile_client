import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Image, TouchableOpacity, FlatList, Modal, SafeAreaView, StatusBar, Pressable, Switch, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { AGLoading, boxShadowInput, distanceBetweenPoints, goToScreen, Header, primaryColor, secondaryColor, statusBarHeigth, traductor, UserContext } from '../AGTools';
import { useIsFocused } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    collectionGroup,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
} from '@react-native-firebase/firestore';
import DonutIndicator from '../DonutIndicator';
import UseRewards from '../UseRewards';
import MarketingCampaignResume from './MarketingCampaignResume';

const defaultImg = require("../img/logo/defaultImg.png")
const arrowBack = require("../img/arrow/arrowBackBg.png")
const vipImg = require("../img/vip.png")
const visiteImg = require("../img/visite.png")
const rewardsImg = require("../img/rewards.png")
const googleReviewImg = require("../img/googleReview.png")
const instaReviewImg = require("../img/instaReview.png")
const giftImg = require("../img/birthday.png")
const partner_giftImg = require("../img/partner_gift.png")
const comeBackImg = require("../img/comeBack.png")
const btnInfosImg = require("../img/btn/moreInfos.png")
const phoneImg = require("../img/btn/icons_Telephone.png")
const pinImg = require("../img/btn/icons_Location.png")
const notificationImg = require("../img/btn/icons_Noti.png")
const checkedImg = require("../img/checked.png")
const seeuReviewImg = require("../img/seeuReview.png")
const locationDistImg = require("../img/locationDist.png")
const ratingImg = require("../img/reviews.png")
const ratingSelectedImg = require("../img/ratingSelected.png")
const chatIcon = require("../img/chat_icon.png")

const widthS = Dimensions.get("screen").width
const widthW = Dimensions.get("window").width
const headerImgSize = 40
const iconsSize = 40
const campaignItemSize = widthS * 0.5
const giftIconSize = 60
const itemSize = widthW
const chat_icon_size = 70
const chat_indicator_size = chat_icon_size * 0.20

export default function Shop({
    navigation,
    route,
}) {
    const {
        user,
        currentShops,
        registeredShops,
        chatRooms,
    } = useContext(UserContext)

    const [shopData, setShopData] = useState(null)
    const [registeredShopsData, setRegisteredShopsData] = useState(null)
    const [rewards, setRewards] = useState([])
    const [campaignsShop, setCampaignsShop] = useState([])
    const [shopSelected, setShopSelected] = useState([])
    const [rewardSelected, setRewardSelected] = useState(null)
    const [rewardSelectedVisible, setRewardSelectedVisible] = useState(false)
    const [showGoogleReview, setShowGoogleReview] = useState(false)
    const [showInstaReview, setShowInstaReview] = useState(false)
    const [campaignPreview, setCampaignPreview] = useState(false)
    const [campaign, setCampaign] = useState(null)
    const [gifts, setGifts] = useState([])
    const [shopInfo, setShopInfo] = useState(false)
    const [notificationsActive, setNotificationsActive] = useState(user?.docData?.notificationsActive)
    const [loaderNotif, setLoaderNotif] = useState(false)
    const [isCheck, setIsCheck] = useState(false)
    const [loading, setLoading] = useState(false)

    const shopId = route?.params?.shopId
    const partnerId = route?.params?.partnerId
    const regexHttp = new RegExp("http*")
    const currentUser = auth.currentUser
    const shopCollection = collection(firestore, "Shops")
    const clientCollection = collection(firestore, "Clients")
    const clientDocument = doc(clientCollection, currentUser.uid)
    const rewardCollection = collection(firestore, "Rewards")
    const registeredShopsCollection = collection(clientDocument, "RegisteredShops")
    const campaignsCollection = collection(firestore, "CampaignsShops")
    const giftsCollection = collection(clientDocument, "Gifts")
    const modalBox = ModalBox()
    const isFocused = useIsFocused()
    const allRewards = gifts.concat(rewards)
    const current_chat_room = chatRooms.filter((chatRoom) => {
        return chatRoom?.docData?.shopId === shopData?.docData?.userId
    })

    const onBack = () => {
        goToScreen(navigation, "goBack")
    }

    const onSeeuReview = () => {
        goToScreen(navigation, "ShopReview", { shopName: shopData?.docData?.shopName, registeredShopsData: registeredShopsData })
    }

    const onGoogleReview = () => {
        setShowInstaReview(false)
        setShowGoogleReview(true)
    }

    const onInstaFollow = () => {
        setShowGoogleReview(false)
        setShowInstaReview(true)
        updateInstaIsActive()
    }

    const onUpdateGoogleReview = () => {
        let total = registeredShopsData?.docData?.points + shopData?.docData?.autoRule_googleReview_Points
        const registeredShopDoc = doc(registeredShopsCollection, registeredShopsData?.docId);
        updateDoc(registeredShopDoc, {
            googleReview: true,
            points: total,
        }).then(() => {
            modalBox.openBoxInfos(traductor("Félicitation"), traductor("Vous avez gagné") + " " + shopData?.docData?.autoRule_googleReview_Points + " " + traductor("points"))
        }).catch((err) => {
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err)
        })
    }

    const onUpdateInstaFollow = () => {
        let total = registeredShopsData?.docData?.points + shopData?.docData?.autoRule_followInsta_Points
        const registeredShopDoc = doc(registeredShopsCollection, registeredShopsData?.docId);
        updateDoc(registeredShopDoc, {
            instagramFollow: true,
            points: total,
        }).then(() => {
            modalBox.openBoxInfos(traductor("Félicitation"), traductor("Vous avez gagné") + " " + shopData?.docData?.autoRule_followInsta_Points + " " + traductor("points"))
        }).catch((err) => {
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err)
        })
    }

    const onPressItem = (item, index) => {
        setCampaign(item?.docData)
        setCampaignPreview(true)
    }
    const onCloseItem = () => {
        setCampaignPreview(false)
    }

    const onPressGoToProfil = () => {
        goToScreen(navigation, "SetPersonnalInfos")
    }


    const onPressLocation = () => {
        if (shopData?.docData?.address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${shopData?.docData?.address}`,
                android: `geo:0,0?q=${shopData?.docData?.address}`,
            })
            Linking.openURL(url)
        }
    }
    const onPressPhone = () => {
        Linking.openURL(`tel:${shopData?.docData?.phone_number}`)
        setTimeout(() => {
            onCloseItem()
            onPressShopInfo(0)
        }, 1000)
    }

    const onConfirm = () => {
        goToScreen(navigation, "LogHome")
        setTimeout(() => {
            onCloseItem()
        }, 1000)
    }

    const onPressShopInfo = (e) => {
        if (e === 0) {
            setShopInfo(false)
            setIsCheck(false)
        }
        if (e === 1) {
            setIsCheck(false)
            setShopInfo(true)
        }
    }

    const onPressNotification = () => {
        setNotificationsActive(!notificationsActive)
        setIsCheck(false)
        onSubmit()
    }

    const updateInstaIsActive = () => {
        const registeredShopDoc = doc(registeredShopsCollection, registeredShopsData?.docId);
        updateDoc(registeredShopDoc, {
            instagramIsActive: true,
        })
    }

    const currentShop = (shopId) => {
        if (shopId) {
            return currentShops.filter((shop) => {
                return shop?.docData?.userId === shopId
            })
        }
    }
    const shop = currentShop(shopId)

    const returnCampaignDistance = (campaign) => {
        let campaignLocation = campaign?.docData?.coordinate
        let campaignLat = campaignLocation?.latitude
        let campaignLng = campaignLocation?.longitude
        let userLocation = user?.docData?.geolocation
        let userLat = userLocation?.latitude
        let userLng = userLocation?.longitude
        let kilometer = 1000

        let distance = distanceBetweenPoints(campaignLat, campaignLng, userLat, userLng) / kilometer

        return Math.round(distance)
    }

    const fetchRewards = async () => {
        const rewardsQuery = query(rewardCollection, where("shopId", "==", shopId), orderBy("points", "asc"));
        const rewardsSnapshot = await getDocs(rewardsQuery);
        const rewardsData = rewardsSnapshot.docs.map(doc => ({
            docId: doc.id,
            docData: doc.data()
        }));
        setRewards(rewardsData);
    }

    const onChat = () => {
        goToScreen(navigation, "Chat", { clientId: currentUser.uid, shopId: shopId, shopName: shopData?.docData?.shopName })
    }

    const onPressPartnerJoin = async () => {
        setLoading(true)
        const client = user?.docData

        const registeredQuery = query(collectionGroup(firestore, "RegisteredShops"), where("shopId", "==", shopId));
        const registeredSnapshot = await getDocs(registeredQuery);

        try {
            await addDoc(registeredShopsCollection, {
                createAt: new Date(),
                lastVisit: new Date(),
                shopId: shopId,
                clientId: currentUser.uid,
                points: 0,
                nbVisit: 0,
                user_img: client?.user_img || "",
                user_img_Valid: client?.user_img_Valid || false,
                firstName: client?.firstName || "",
                lastName: client?.lastName || "",
                gender: Number(client?.gender) || 0,
                birthday: client?.birthday || new Date("1950-01-28"),
                phone: client?.phone || "",
                email: client?.email,
                postalCode: client?.postalCode || "",
                address: client?.address || "",
                clientNum: registeredSnapshot.docs.length + 1,
                notificationsActive: true,
                byPartnerId: partnerId,
            });
            setLoading(false)
            goToScreen(navigation, "goBack")
        } catch (err) {
            setLoading(false)
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err)
        }
    }

    const onSubmit = () => {
        setLoaderNotif(true)
        const registeredShopDoc = doc(registeredShopsCollection, registeredShopsData?.docId);
        updateDoc(registeredShopDoc, {
            notificationsActive: !notificationsActive,
        }).then(() => {
            setLoaderNotif(false)
            setIsCheck(true)
        }).catch((err) => {
            setLoaderNotif(false)
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err)
        })
    }

    useEffect(() => {
        updateDoc(clientDocument, {
            scanActive: false,
            currentScanShop: "",
        })
    }, [])

    useEffect(() => {
        if (shopId) {
            const unSub = onSnapshot(doc(shopCollection, shopId), (doc) => {
                setShopData({ docId: doc.id, docData: doc.data() })
            })
            return () => { unSub() }
        }
    }, [])

    useEffect(() => {
        if (shopId) {
            const campaignsQuery = query(
                campaignsCollection,
                where("shopId", "==", shopId),
                where("isFinish", "==", false),
                orderBy("dateStart", "asc")
            );

            const unSub = onSnapshot(campaignsQuery, (docs) => {
                const data = docs.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                }));
                setCampaignsShop(data);
            })
            return () => { unSub() }
        }
    }, [])

    useEffect(() => {
        if (shopId) {
            const registeredQuery = query(
                registeredShopsCollection,
                where("shopId", "==", shopId),
                orderBy("createAt", "asc")
            );

            const unSub = onSnapshot(registeredQuery, (docs) => {
                const data = docs.docs[0] ? {
                    docId: docs.docs[0].id,
                    docData: docs.docs[0].data()
                } : null;
                setRegisteredShopsData(data);
                setNotificationsActive(data?.docData?.notificationsActive);
            })
            return () => { unSub() }
        }
    }, [])

    useEffect(() => {
        if (shopId) {
            const giftsQuery = query(
                giftsCollection,
                where("isUsed", "==", false),
                where("shopId", "==", shopId)
            );

            const unSub = onSnapshot(giftsQuery, (docs) => {
                const data = docs.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                }));
                setGifts(data);
            })
            return () => { unSub() }
        }
    }, [])

    useEffect(() => {
        (showInstaReview === false && registeredShopsData?.docData?.instagramIsActive === true && registeredShopsData?.docData?.instagramFollow !== true) && onUpdateInstaFollow()
    }, [showInstaReview])

    useEffect(() => {
        shopId && fetchRewards()
    }, [shopId])

    useEffect(() => {
        isFocused && StatusBar.setBarStyle("light-content", true)
    }, [isFocused])

    return (<View style={[styles.viewContainer]}>

        <SafeAreaView />

        <Header
            title={shopData?.docData?.shopName}
            containerStyle={[{ marginTop: statusBarHeigth }]}
            titleStyle={[styles.headerTitle]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            imgRight={btnInfosImg}
            imgRightStyle={[styles.headerImg]}
            leftAction={onBack}
            rightAction={() => onPressShopInfo(1)}
        />

        {(shop.length === 0 && partnerId) && <PartnerJoin onAction={onPressPartnerJoin} />}

        <View style={[styles.totalIndicatorSection]}>
            {shopData?.docData?.shopRating && <View style={[{ flexDirection: "row", alignItems: "center", marginHorizontal: 20 }]}>
                <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={ratingSelectedImg} />
                <Text style={[styles.itemText, styles.subTitle, { marginTop: 0 }]}>{shopData?.docData?.shopRating}</Text>
            </View>}

            <DonutIndicator
                defaultValue={registeredShopsData?.docData?.points || 0}
                numColor={"#000000CC"}
                numStyle={[{ fontSize: 26 }]}
                textColor={"#000000CC"}
                cursor={false}
                max={rewards[rewards.length - 1]?.docData?.points}
                gradient1={secondaryColor}
                gradient2={primaryColor}
                gradientEnd1={secondaryColor}
                gradientEnd2={primaryColor}
                radius={60}
                strokeWidth={8}
                animePoint
            />
        </View>

        <ScrollView style={[styles.scrollView]} bounces={false}>

            <View style={[styles.section, styles.sectionStats]}>
                <View style={[styles.statsLeft]}>
                    <View style={[styles.statsContent]}>
                        <Image style={[styles.statsImg]} source={visiteImg} />
                        <Text style={[styles.statsNbText]}>{registeredShopsData?.docData?.nbVisit || 0}</Text>
                    </View>
                    <View style={[styles.statsContent]}>
                        <Text style={[styles.statsText]}>{traductor("Total de visites")}</Text>
                    </View>
                </View>

                <View style={[styles.statsRigth]}>
                    <View style={[styles.statsContent]}>
                        <Image style={[styles.statsImg]} source={vipImg} />
                        <Text style={[styles.statsNbText]}>{
                            !registeredShopsData?.docData?.nbVisit
                                ? traductor("Aucun")
                                : registeredShopsData?.docData?.nbVisit >= shopData?.docData?.clientRule_Vip_Visit
                                    ? traductor("VIP")
                                    : registeredShopsData?.docData?.nbVisit === 0 || registeredShopsData?.docData?.nbVisit === 1
                                        ? traductor("Nouveau")
                                        : traductor("Standard")
                        }</Text>
                    </View>
                    <View style={[styles.statsContent]}>
                        <Text style={[styles.statsText]}>{traductor("Statut du client")}</Text>
                    </View>
                </View>
            </View>

            {allRewards.length > 0 && <View style={[styles.section]}>
                <View style={[styles.sectionTitleContainer]}>
                    <Text style={[styles.sectionTitle]}>{traductor("Avantages")}</Text>
                </View>

                <View style={[]}>
                    <FlatList
                        data={allRewards}
                        horizontal
                        bounces={false}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => {

                            const onRewardSelect = () => {
                                if ((item?.docData?.giftType === "lastVisit" || item?.docData?.giftType === "birthday") || (registeredShopsData?.docData?.points >= item?.docData?.points)) {
                                    setShopSelected(shop)
                                    setRewardSelected(item)
                                    setRewardSelectedVisible(true)
                                }
                            }

                            return (<TouchableOpacity style={[styles.rewardItem, boxShadowInput, { marginLeft: index === 0 ? 20 : 0 }]} onPress={onRewardSelect} disabled={registeredShopsData?.docData?.points >= item?.docData?.points ? false : true}>
                                <View style={[styles.rewardItemDonutContainer]}>
                                    {item?.docData?.giftType ?
                                        <Image style={[styles.giftIcon]} source={item?.docData?.giftType === "lastVisit"
                                            ? comeBackImg
                                            : item?.docData?.giftType === "birthday"
                                                ? giftImg
                                                : partner_giftImg
                                        } /> :
                                        <DonutIndicator
                                            defaultValue={registeredShopsData?.docData?.points || 0}
                                            numColor={"#000000CC"}
                                            numStyle={[{ fontSize: 18 }]}
                                            textColor={"#000000CC"}
                                            cursor={false}
                                            max={item?.docData?.points}
                                            gradient1={secondaryColor}
                                            gradient2={primaryColor}
                                            gradientEnd1={secondaryColor}
                                            gradientEnd2={primaryColor}
                                            radius={40}
                                            strokeWidth={8}
                                        />
                                    }
                                </View>

                                <View style={[]}>
                                    <View style={[styles.statsContent]}>
                                        <Image style={[styles.statsImg]} source={rewardsImg} />
                                        <Text style={[styles.statsNbText]} numberOfLines={2}>
                                            {item?.docData.value}{item?.docData?.type === 3 ? "" : item?.docData?.type === 2 ? traductor("% offerts") : ` ${shopData?.docData?.currency?.text || "USD"} ${traductor("offerts")}`}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[]}>
                                    <Text style={[styles.statsText, { textAlign: "center" }]} numberOfLines={3}>{item?.docData?.description}</Text>
                                </View>
                            </TouchableOpacity>)
                        }}
                    />
                </View>
            </View>}

            {campaignsShop.length > 0 && <View style={[styles.section]}>
                <View style={[styles.sectionTitleContainer]}>
                    <Text style={[styles.sectionTitle]}>{traductor("Les offres")}</Text>
                </View>

                <View style={[{ marginTop: 10 }]}>
                    <FlatList
                        data={campaignsShop}
                        horizontal
                        bounces={false}
                        contentContainerStyle={[{ gap: 20, paddingHorizontal: 20 }]}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            const banner = item?.docData?.campaign_Shop_Banner && item?.docData?.campaign_Shop_Valid === true ? item?.docData?.campaign_Shop_Banner : Image.resolveAssetSource(defaultImg).uri
                            let distance = returnCampaignDistance(item)
                            let shopName = shopData?.docData?.shopName
                            let shopRating = shopData?.docData?.shopRating
                            let shopRatingNumber = shopData?.docData?.shopRatingNumber
                            let hasRating = registeredShops.filter((registered) => {
                                return registered?.docData?.shopId === item?.docData?.shopId
                            })
                            let newItem = item.docData

                            newItem.shopRating = shopRating
                            newItem.shopRatingNumber = shopRatingNumber
                            newItem.hasRating = hasRating[0]?.docData?.ratingNote

                            let newDocdata = { docData: newItem }

                            return (<TouchableOpacity style={[styles.item]} onPress={() => onPressItem(newDocdata, index)}>
                                <View>
                                    <Image style={[styles.itemImg]} source={{ uri: banner }} resizeMode={"cover"} />
                                    <Text style={[styles.itemTitle]} numberOfLines={2}>{item?.docData?.title}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.itemTerm, { marginBottom: 2 }]} numberOfLines={1}>{shopName}</Text>
                                    <View style={[styles.campaignRatingContainer]}>
                                        <View>
                                            {(distance || distance === 0) && <View style={[styles.campaignRating]}>
                                                <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={locationDistImg} />
                                                <Text style={[styles.itemText, styles.subTitle, { marginTop: 0 }]}>{distance} {"Km"}</Text>
                                            </View>}
                                        </View>
                                        <View>
                                            <View style={[styles.campaignRating]}>
                                                <Image resizeMode={"contain"} style={[styles.campaignRatingImg]} source={hasRating[0]?.docData?.ratingNote ? ratingSelectedImg : ratingImg} />
                                                {shopRating && <Text style={[styles.itemText, styles.subTitle, { marginTop: 0 }]}>{shopRating}</Text>}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>)
                        }}
                    />
                </View>
            </View>}

            {registeredShopsData && <View style={[styles.sectionTitleContainer, { marginBottom: 10 }]}>
                <Text style={[styles.sectionTitle]}>{traductor("Bonus")}</Text>
            </View>}
            {registeredShopsData &&
                <TouchableOpacity style={[styles.bonusItem, boxShadowInput]} onPress={onSeeuReview}>
                    <View style={[styles.bonusIconContainer]}>
                        <Image style={[styles.bonusIcon]} source={{ uri: Image.resolveAssetSource(seeuReviewImg).uri }} />
                    </View>
                    <View style={[styles.bonusTextContainer]}>
                        <Text style={[styles.bonusTitle]}>{traductor("Votre avis nous intéresse")}</Text>
                        <Text style={[styles.bonusDescription]}>
                            {traductor("Donnez un avis sur la boutique\nafin de l’aider à s’améliorer")}
                        </Text>
                    </View>
                    <View style={[styles.bonusArrowContainer]}>
                        <View style={[styles.bonusArrow]} />
                    </View>
                </TouchableOpacity>
            }

            {((registeredShopsData?.docData?.googleReview !== true && regexHttp.test(shopData?.docData?.google) && shopData?.docData?.autoRule_googleReview_IsActive === true) || (registeredShopsData?.docData?.instagramFollow !== true && regexHttp.test(shopData?.docData?.instagram) && shopData?.docData?.autoRule_followInsta_IsActive === true)) &&
                <View style={[styles.section, { marginTop: 0 }]}>

                    <View>
                        {(registeredShopsData?.docData?.googleReview !== true && regexHttp.test(shopData?.docData?.google) && shopData?.docData?.autoRule_googleReview_IsActive === true && registeredShopsData) &&
                            <TouchableOpacity style={[styles.bonusItem, boxShadowInput]} onPress={onGoogleReview}>
                                <View style={[styles.bonusIconContainer]}>
                                    <Image style={[styles.bonusIcon]} source={{ uri: Image.resolveAssetSource(googleReviewImg).uri }} />
                                </View>
                                <View style={[styles.bonusTextContainer]}>
                                    <Text style={[styles.bonusTitle]}>{traductor("Donnez nous votre avis sur Google")}</Text>
                                    <Text style={[styles.bonusDescription]}>{traductor("Venez nous donnez votre avis sur Google et gagnez") + " " + shopData?.docData?.autoRule_googleReview_Points + " " + traductor("points")} !</Text>
                                </View>
                                <View style={[styles.bonusArrowContainer]}>
                                    <View style={[styles.bonusArrow]} />
                                </View>
                            </TouchableOpacity>
                        }
                        {(registeredShopsData?.docData?.instagramFollow !== true && regexHttp.test(shopData?.docData?.instagram) && shopData?.docData?.autoRule_followInsta_IsActive === true && registeredShopsData) &&
                            <TouchableOpacity style={[styles.bonusItem, boxShadowInput]} onPress={onInstaFollow}>
                                <View style={[styles.bonusIconContainer]}>
                                    <Image style={[styles.bonusIcon]} source={{ uri: Image.resolveAssetSource(instaReviewImg).uri }} />
                                </View>
                                <View style={[styles.bonusTextContainer]}>
                                    <Text style={[styles.bonusTitle]}>{traductor("Follow nous et gagne des points")}</Text>
                                    <Text style={[styles.bonusDescription]}>{traductor("Venez nous suivre sur Instagram et gagnez") + " " + shopData?.docData?.autoRule_followInsta_Points + " " + traductor("points")} !</Text>
                                </View>
                                <View style={[styles.bonusArrowContainer]}>
                                    <View style={[styles.bonusArrow]} />
                                </View>
                            </TouchableOpacity>
                        }
                    </View>
                </View>}

            {shop.length > 0 && <View style={[{ paddingBottom: chat_icon_size + 20 }]} />}
        </ScrollView>

        <Modal
            animationType="fade"
            transparent={false}
            visible={showGoogleReview}
            statusBarTranslucent={false}
            onRequestClose={() => setShowGoogleReview(false)}
        >
            <SafeAreaView style={{ backgroundColor: primaryColor }} />
            <View style={[styles.backWebviewBtnContainer]}>
                <TouchableOpacity style={[styles.backWebviewBtn]} onPress={() => setShowGoogleReview(false)}>
                    <Image style={[styles.backWebviewBtnImg]} source={arrowBack} />
                    <Text style={[styles.backWebviewBtnText]}>{traductor("SeeU")}</Text>
                </TouchableOpacity>
            </View>

            <WebView
                source={{ uri: shopData?.docData?.google }}
                style={[styles.fullScreen]}
                onNavigationStateChange={(navState) => {
                    if (navState.url.includes("LocalPoiReviews")) {
                        onUpdateGoogleReview()
                        setShowGoogleReview(false)
                    }
                }}
            />
        </Modal>

        <Modal
            animationType="fade"
            transparent={false}
            visible={showInstaReview}
            statusBarTranslucent={false}
            onRequestClose={() => setShowInstaReview(false)}
        >
            <SafeAreaView style={{ backgroundColor: primaryColor }} />
            <View style={[styles.backWebviewBtnContainer]}>
                <TouchableOpacity style={[styles.backWebviewBtn]} onPress={() => setShowInstaReview(false)}>
                    <Image style={[styles.backWebviewBtnImg]} source={arrowBack} />
                    <Text style={[styles.backWebviewBtnText]}>{traductor("SeeU")}</Text>
                </TouchableOpacity>
            </View>

            <WebView
                source={{ uri: shopData?.docData?.instagram }}
                style={[styles.fullScreen]}
            />
        </Modal>

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
                onShopAction={onCloseItem}
                onLocationAction={onPressLocation}
                onConfirm={onConfirm}
            />
        </Modal>

        <Modal
            animationType="slide"
            transparent
            visible={shopInfo}
            statusBarTranslucent={true}
            onRequestClose={() => onPressShopInfo(0)}
        >
            <Pressable style={[styles.shopInfoOverlay]} onPress={() => onPressShopInfo(0)} />
            <View style={[styles.shopInfoContainer, styles.shopInfoBoxShadow]}>

                {shopData?.docData?.phone_number && <TouchableOpacity style={[styles.sectionTitle, { justifyContent: "flex-start", marginVertical: 30 }]} onPress={onPressPhone}>
                    <View>
                        <Image style={[styles.titleImg, { marginRight: 16 }]} source={phoneImg} />
                    </View>
                    <View>
                        <Text style={[styles.dateText, { marginBottom: 4 }]}>{traductor("Téléphone")}</Text>
                        <Text style={[styles.termText, { fontSize: 12 }]}>{shopData?.docData?.phone_number}</Text>
                    </View>
                </TouchableOpacity>}

                <TouchableOpacity style={[styles.sectionTitle, { justifyContent: "flex-start", marginVertical: 30 }]} onPress={onPressLocation}>
                    <View>
                        <Image style={[styles.titleImg, { marginRight: 16 }]} source={pinImg} />
                    </View>
                    <View style={[{ flex: 1 }]}>
                        <Text style={[styles.dateText, { marginBottom: 4 }]}>{traductor("Adresse")}</Text>
                        <Text style={[styles.termText, { fontSize: 12 }]} numberOfLines={2}>{shopData?.docData?.address} {shopData?.docData?.postalCode} {shopData?.docData?.city}</Text>
                    </View>
                </TouchableOpacity>

                {shop.length > 0 && <TouchableOpacity style={[styles.sectionTitle, { justifyContent: "flex-start", marginVertical: 30 }]} onPress={onPressNotification}>
                    <View>
                        <Image style={[styles.titleImg, { marginRight: 16 }]} source={notificationImg} />
                    </View>
                    <View style={[{ flex: 1 }]}>
                        <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                            <Text style={[styles.dateText, { marginBottom: 4 }]}>{traductor("Notifications")}</Text>
                            <View style={[styles.loadContainer]}>
                                <ActivityIndicator size="small" color={secondaryColor} animating={loaderNotif} />
                                {isCheck && <Image style={[styles.checkedImg]} source={checkedImg} />}
                            </View>
                        </View>
                        <Text style={[styles.termText, { fontSize: 12 }]}>{traductor("Recevoir des notifications de cette boutique")}</Text>
                    </View>
                    <View>
                        <Switch
                            trackColor={{ false: "#E4E4E4", true: "#8DFE98" }}
                            thumbColor={notificationsActive ? "#fff" : "#fff"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={onPressNotification}
                            value={notificationsActive}
                        />
                    </View>
                </TouchableOpacity>}

            </View>
        </Modal>

        {shop.length > 0 && <TouchableOpacity style={[styles.chatContainer]} onPress={onChat}>
            <Image style={[styles.chatIcon]} source={chatIcon} />
            {(current_chat_room[0]?.docData?.status_client === 1 || current_chat_room[0]?.docData?.status_client === 2)
                && <View style={[styles.chatIndicator]} />
            }
        </TouchableOpacity>}

        <UseRewards
            navigation={navigation}
            shop={shopSelected}
            reward={rewardSelected}
            visible={rewardSelectedVisible}
            onVisible={setRewardSelectedVisible}
            goToProfil={onPressGoToProfil}
        />

        <AGLoading isLoading={loading} />

        {modalBox.renderBoxInfos("")}
    </View>)
}

const PartnerJoin = (props) => {
    const onPress = () => {
        props?.onAction && props.onAction()
    }

    return (<View style={[styles.partnerJoinContainer]}>
        <Text style={[styles.partnerJoinText]}>{traductor("Rejoignez le programme de fidélité\npour profiter de vos récompenses")}</Text>
        <TouchableOpacity style={[styles.partnerJoinBtn]} onPress={onPress}>
            <Text style={[styles.partnerJoinBtnText]}>{traductor("Rejoindre")}</Text>
        </TouchableOpacity>
    </View>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        backgroundColor: primaryColor,
    },
    headerBg: {
        backgroundColor: primaryColor,
        borderBottomLeftRadius: 37,
        borderBottomRightRadius: 37,
        position: "absolute",
        left: 0,
        right: 0,
    },
    headerImg: {
        width: headerImgSize,
        height: headerImgSize,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "600",
        marginHorizontal: 10,
    },
    totalIndicatorSection: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    scrollView: {
        backgroundColor: "#fff",
    },
    section: {
        marginVertical: 10,
    },
    sectionStats: {
        flexDirection: "row",
        alignItems: "center",
    },
    statsLeft: {
        flex: 1,
        paddingVertical: 10,
        borderRightWidth: 1,
        borderColor: "#00000010",
    },
    statsRigth: {
        flex: 1,
        paddingVertical: 10,
    },
    statsContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    statsImg: {
        width: 20,
        height: 20,
    },
    statsNbText: {
        fontSize: 16,
        marginHorizontal: 6,
        color: "#000000AA",
        fontWeight: "bold",
    },
    statsText: {
        fontSize: 14,
        marginTop: 5,
        color: "#00000050",
        fontWeight: "600",
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: "#0F0E0E",
        fontWeight: "600",
    },
    rewardItem: {
        width: widthS * 0.5,
        height: widthS * 0.5,
        padding: 10,
        marginRight: 15,
        marginVertical: 10,
        backgroundColor: "#fff",
        justifyContent: "center",
    },
    rewardItemDonutContainer: {
        alignItems: "center",
        marginBottom: 6,
    },
    campaignImg: {
        width: campaignItemSize,
        height: campaignItemSize,
    },
    itemText: {
        fontSize: 14,
        color: "#0F0E0E",
        fontWeight: "400",
        marginTop: 5,
    },
    subTitle: {
        color: "#0F0E0E70",
        marginTop: 4,
        fontSize: 12,
    },
    bonusItem: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        padding: 20,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 12,
    },
    bonusIcon: {
        width: 40,
        height: 40,
        marginRight: 20,
    },
    bonusIconContainer: {
        width: 60,
    },
    bonusTextContainer: {
        width: widthS - 110 - 40,
    },
    bonusArrowContainer: {
        width: 40,
    },
    bonusTitle: {
        fontSize: 16,
        color: "#0F0E0E",
        fontWeight: "bold",
    },
    bonusDescription: {
        fontSize: 14,
        color: "#0F0E0E60",
        fontWeight: "400",
        marginTop: 6,
    },
    bonusArrow: {
        width: 8,
        height: 8,
        marginTop: 2,
        borderTopWidth: 1,
        borderRightWidth: 1,
        marginLeft: 10,
        borderColor: "#0F0E0E60",
        transform: [{ rotate: "45deg" }],
    },
    giftIcon: {
        width: giftIconSize,
        height: giftIconSize,
        alignItems: "center",
    },
    backWebviewBtnContainer: {
        backgroundColor: primaryColor,
        alignItems: "flex-start"
    },
    backWebviewBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    backWebviewBtnImg: {
        width: headerImgSize * 0.5,
        height: headerImgSize * 0.5,
        marginRight: 8,
    },
    backWebviewBtnText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "400",
    },
    shopInfoOverlay: {
        flex: 1,
    },
    shopInfoContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: "#fff",
        padding: 20,
    },
    sectionTitle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    titleImg: {
        width: iconsSize,
        height: iconsSize,
    },
    dateText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#B8BBC6",
    },
    termText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1D1D1B",
    },
    shopInfoBoxShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 20,
    },
    checkedImg: {
        position: "absolute",
        width: 15,
        height: 11,
    },
    loadContainer: {
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    item: {
        flex: 1,
        backgroundColor: "#fff",
        maxWidth: (itemSize - 40) * 0.5,
    },
    itemImg: {
        width: (itemSize - 40) * 0.5,
        height: (itemSize - 40) * 0.5,
        borderRadius: 8,
    },
    itemTitle: {
        marginTop: 10,
        fontSize: 14,
        color: "#1D1D1B",
        fontWeight: "600",
    },
    itemTerm: {
        marginTop: 4,
        fontSize: 12,
        color: "#B8BBC6",
        fontWeight: "500",
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
    chatContainer: {
        position: "absolute",
        right: 20,
        bottom: 20,
    },
    chatIcon: {
        width: chat_icon_size,
        height: chat_icon_size,
    },
    chatIndicator: {
        width: chat_indicator_size,
        height: chat_indicator_size,
        backgroundColor: secondaryColor,
        position: "absolute",
        top: 2,
        right: 2,
        borderRadius: chat_indicator_size,
    },
    partnerJoinContainer: {
        backgroundColor: "#fff",
        borderRadius: 20,
        marginBottom: 20,
        padding: 20,
        marginHorizontal: 20,
    },
    partnerJoinText: {
        fontSize: 12,
        color: "#1f1f1f",
        fontWeight: "500",
        textAlign: "center",
    },
    partnerJoinBtn: {
        backgroundColor: primaryColor,
        borderRadius: 8,
        alignSelf: "center",
        padding: 10,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    partnerJoinBtnText: {
        fontSize: 12,
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
    },
})