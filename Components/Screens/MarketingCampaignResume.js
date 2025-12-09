import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import { arraysAreEqualUsingJSON, boxShadowInput, days, getCurrentDate, goToScreen, Header, NoUserContext, primaryColor, traductor, UserContext } from '../AGTools';
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    onSnapshot,
} from '@react-native-firebase/firestore';
import SwipeableButton from '../SwipeableButton';
import Sheet from '../Sheet';
import { AuthContext } from '../Login';

const defaultImg = require("../img/logo/defaultImg.png")
const arrowBack = require("../img/arrow/arrowBackBgPurple.png")
const calendarImg = require("../img/calendar.png")
const shopImg = require("../img/shop.png")
const chatImg = require("../img/chat_coupon.png")
const pinImg = require("../img/pin.png")
const ticketImg = require("../img/ticket.png")
const ratingImg = require("../img/reviews.png")
const rewardsImg = require("../img/rewards.png")
const ratingSelectedImg = require("../img/ratingSelected.png")

const widthW = Dimensions.get("window").width
const screen = Dimensions.get('screen');
const headerImgSize = 40
const iconsSize = 40
const headerHeigth = 100

export default function MarketingCampaignResume({
    navigation,
    shopId,
    campaignId,
    campaignProps,
    onBack,
    onShopAction,
    onLocationAction,
    onConfirm,
}){
    const authContext = useContext(AuthContext)
    const {
        shops,
    } = useContext(authContext.user ? UserContext : NoUserContext)
    
    const [campaign, setCampaign] = useState([])

    const currentUser = auth.currentUser
    const campaignDoc = doc(firestore, "CampaignsShops", campaignId);
    const campaignVisitsCollection = collection(campaignDoc, "CampaignVisits");
    const modalBox = ModalBox()
    const full_week = days
    const week_end = days.slice(5,7)
    const business_day = days.slice(0,5)

    const getCurrentShop = (shopId)=>{
        return shops.filter((shop)=>{
            return shop.docId === shopId
        })
    }

    const onChatAction = () =>{
        const shop = getCurrentShop(shopId)

        if(currentUser?.uid){
            goToScreen(navigation,"Chat",{clientId:currentUser.uid,shopId:shopId,shopName:shop[0]?.docData?.shopName})
        } else {
            modalBox.openBoxConfirm("",traductor("Vous devez avoir un compte pour accéder à ce contenu"))
        }
    }
    
    const onPressShop = ()=>{
        if(currentUser?.uid){
            onShopAction()
        } else {
            modalBox.openBoxConfirm("",traductor("Vous devez avoir un compte pour accéder à ce contenu"))
        }
    }

    const onSwipe = ()=>{
        goToScreen(navigation,"TicketsQrCode",{campaignId:campaignId})
        onBack()
    }

    const renderDaysBadge = ()=>{
        let daysSelected = campaign?.daysDisponibility
        if(daysSelected){
            if(arraysAreEqualUsingJSON(daysSelected,full_week)){
                return(<View style={[styles.badge]}>
                    <Text style={[styles.badgeText]}>{traductor("Toute la semaine")}</Text>
                </View>)
            } else if(arraysAreEqualUsingJSON(daysSelected,week_end)){
                return(<View style={[styles.badge]}>
                    <Text style={[styles.badgeText]}>{traductor("Week-end")}</Text>
                </View>)
            } else if(arraysAreEqualUsingJSON(daysSelected,business_day)){
                return(<View style={[styles.badge]}>
                    <Text style={[styles.badgeText]}>{traductor("Jour ouvré")}</Text>
                </View>)
            } else {
                return daysSelected.map((day)=>{
                    return(<View style={[styles.badge]} key={day}>
                        <Text style={[styles.badgeText]}>{traductor(day)}</Text>
                    </View>)
                })
            }
        }
    }
    
    useEffect(() => {
        const unsubscribe = onSnapshot(campaignDoc, (doc) => {
            setCampaign(doc.data());
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const addVisit = async () => {
            try {
                await addDoc(campaignVisitsCollection, {
                    clientId: currentUser?.uid || "",
                    campaignId: campaignId,
                    shopId: shopId,
                });

                const unsubscribe = onSnapshot(campaignVisitsCollection, (snapshot) => {
                    updateDoc(campaignDoc, {
                        seeing: snapshot.size,
                    });
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error adding visit:", error);
            }
        };

        addVisit();
    }, []);

    return(<View style={[styles.viewContainer]}>

        {campaign?.campaign_Shop_Banner ? <Image source={{uri:campaign?.campaign_Shop_Banner}} style={[styles.campaignImg]} /> : <Image source={{uri:Image.resolveAssetSource(defaultImg).uri}} style={[styles.campaignImg]} />}

        <Sheet
            minHeight={screen.height - widthW + 20}
            maxHeight={screen.height - headerHeigth - headerImgSize}
        >
            <View style={[styles.campaignContainer]}>

                <View style={[]}>

                    <View style={[{flexDirection:"row",alignItems:"center"}]}>
                        {(campaign?.tiketLimit || campaign?.tiketLimit === 0) && <View style={[styles.badge]}>
                            <Image style={[styles.dateImg,{marginRight:4}]} source={ticketImg} />
                            <Text style={[styles.badgeText]}>{campaign?.tiketLimit} {traductor("Tickets")}</Text>
                        </View>}
                        <View style={[styles.badge]}>
                            <Text style={[styles.badgeText]}>{traductor(campaign?.campaignType?.text)}</Text>
                        </View>
                        {renderDaysBadge()}
                    </View>
                    
                    <View style={[styles.sectionTitle]}>
                        <View style={[{flex:1}]}>
                            <Text style={[styles.titleText]}>{campaign?.title}</Text>
                            <Text style={[styles.termText]}>{campaign?.terms}</Text>
                        </View>
                        <View style={[{flexDirection:"row"}]}>
                            <TouchableOpacity style={[{marginRight:10}]} onPress={onChatAction}>
                                <Image style={[styles.titleImg]} source={chatImg} />
                            </TouchableOpacity>
                            {onShopAction ? <TouchableOpacity onPress={onPressShop}>
                                <Image style={[styles.titleImg]} source={shopImg} />
                            </TouchableOpacity> : <Image style={[styles.titleImg]} source={shopImg} />}
                        </View>
                    </View>

                    <View style={[styles.separator]}/>

                        <View style={[{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}]}>
                            <View style={[styles.sectionDate]}>
                                <Image style={[styles.dateImg]} source={campaignProps?.hasRating ? ratingSelectedImg : ratingImg} />
                                {campaignProps?.shopRating && <Text style={[styles.dateText]}>{campaignProps.shopRating} {"("}{campaignProps.shopRatingNumber} {traductor("Avis")}{")"}</Text>}
                            </View>

                            <View style={[styles.sectionDate]}>
                                <Image style={[styles.dateImg]} source={calendarImg} />
                                {(campaign?.dateStart?.seconds && campaign?.dateEnd?.seconds) && <Text style={[styles.dateText]}>
                                    {traductor("Valide jusqu'au") + " " + `${getCurrentDate(new Date(campaign?.dateEnd?.seconds * 1000)).day}/${getCurrentDate(new Date(campaign?.dateEnd?.seconds * 1000)).month}/${getCurrentDate(new Date(campaign?.dateEnd?.seconds * 1000)).year}`}
                                </Text>}
                            </View>
                        </View>

                    <View style={[styles.separator]}/>

                    <View>
                        <Text style={[styles.termText,{fontSize:12}]}>{campaign?.message}</Text>
                    </View>

                    <View style={[{marginVertical:20}]} >
                        {campaign?.optionTickets && campaign.optionTickets.map((option,index)=>{
                            return(<View style={[styles.optionContainer,styles.optionRow,boxShadowInput]} key={index}>
                                <View style={[styles.optionRow]}>
                                    <Image style={[styles.optionImg]} source={rewardsImg} />
                                    <Text style={[styles.optionName]} >{option.name}</Text>
                                </View>
                                <View style={[styles.optionRow]}>
                                    <Text style={[styles.optionReduction]} >{option.reduction}</Text>
                                    <View>
                                        <Text style={[styles.optionPrice]} >{option.price}</Text>
                                        <View style={[styles.optionBar]} />
                                    </View>
                                </View>
                            </View>)
                        })}
                    </View>
                </View>

                <View>
                    <TouchableOpacity style={[styles.sectionTitle,{justifyContent:"flex-start",marginVertical:0,marginBottom:20}]} onPress={onLocationAction}>
                        <Image style={[styles.titleImg,{marginRight:16}]} source={pinImg} />
                        <View style={[{flex:1}]}>
                            <Text style={[styles.dateText,{marginBottom:4}]}>{traductor("Localisation")}</Text>
                            <Text style={[styles.termText,{fontSize:12}]}>{campaign?.address}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {(campaign?.tiketLimit || campaign?.tiketLimit > 0) && <SwipeableButton
                    text={"Utiliser maintenant"}
                    onSwipe={onSwipe}
                />}
            </View>
        </Sheet>

        {onBack && <Header
            title={""}
            containerStyle={[styles.header]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onBack}
        />}
        
        {modalBox.renderBoxConfirm(traductor("OK"),traductor("Me connecter"),onConfirm)}
    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#FFFAF3",
    },
    header:{
        backgroundColor:"#ffffff00",
        position:"absolute",
        marginTop:20,
        marginLeft:0,
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    campaignContainer:{
        marginHorizontal:20,
    },
    campaignImg:{
        width:widthW,
        height:widthW,
    },
    sectionDate:{
        flexDirection:"row",
        alignItems:"center",
    },
    dateImg:{
        width:10,
        height:10,
        marginRight:8,
    },
    dateText:{
        fontSize:12,
        fontWeight:"500",
        color:"#B8BBC6",
    },
    sectionTitle:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        marginTop:8,
    },
    titleImg:{
        width:iconsSize,
        height:iconsSize,
    },
    titleText:{
        fontSize:18,
        fontWeight:"600",
        color:"#0F0E0E",
        marginBottom:4,
    },
    termText:{
        fontSize:14,
        fontWeight:"500",
        color:"#1D1D1B",
    },
    separator:{
        marginVertical:16,
        width:"100%",
        height:1,
        backgroundColor:"#F5F5F5",
    },
    badge:{
        flexDirection:"row",
        alignItems:"center",
        marginRight:8,
        backgroundColor:"#dbfad5",
        borderRadius:8,
        paddingHorizontal:8,
        paddingVertical:4,
    },
    badgeText:{
        color:primaryColor,
        fontWeight:"bold",
    },
    optionContainer:{
        justifyContent:"space-between",
        backgroundColor:"#fff",
        marginVertical:6,
        paddingVertical:10,
        paddingHorizontal:5,
        borderRadius:10,
    },
    optionRow:{
        flexDirection:"row",
        alignItems:"center",
    },
    optionImg:{
        width:20,
        height:20,
    },
    optionName:{
        marginLeft:4,
        fontSize:16,
    },
    optionPrice:{
        color:"#E3E3E3",
        fontSize:16,
        marginHorizontal:4,
        fontWeight:"bold",
    },
    optionReduction:{
        color:primaryColor,
        fontWeight:"bold",
        fontSize:16,
        marginHorizontal:4,
    },
    optionBar:{
        height:1,
        backgroundColor:"#E3E3E3",
        position:"absolute",
        right:0,
        left:0,
        top:"50%",
    },
})