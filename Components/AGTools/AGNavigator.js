import React, { useContext } from "react";
import { Image, TouchableOpacity, StyleSheet, Animated, Easing, View, Dimensions, Platform } from 'react-native';
import { NoUserContext, UserContext } from "./AGContext";
import { getFocusedRouteNameFromRoute, useFocusEffect } from "@react-navigation/native";
import { TransitionSpecs, createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabAccount, TabHome, TabRewards, TabShops } from "../img/svg";
import { primaryColor, secondaryColor } from "./AGGlobalVariables";
import { traductor } from "./Traductor";
import { AuthContext } from "../Login";
import { goToScreen } from "./AGFunctions";

import SignIn from "../Login/SignIn";
import SignUp from "../Login/SignUp";
import PassLost from "../Login/PassLost";
import Home from "../Screens/Home";
import Rewards from "../Screens/Rewards";
import Shops from "../Screens/Shops";
import Shop from "../Screens/Shop";
import CampaignsList from "../Screens/CampaignsList";
import OffersList from "../Screens/OffersList";
import Notifications from "../Screens/Notifications";
import Campaign from "../Screens/Campaign";
import ShopReview from "../Screens/ShopReview";
import ClientQrCode from "../ClientQrCode";
import TicketsQrCode from "../TicketsQrCode";
import GeolocationView from "../Screens/GeolocationView";
import Account from "../Screens/Account/Account";
import PartnerCode from "../Screens/Account/PartnerCode";
import SetPassword from "../Screens/Account/SetPassword";
import SetPersonnalInfos from "../Screens/Account/SetPersonnalInfos";
import History from "../Screens/Account/History";
import HomeHead from "./Header/HomeHead";
import Chat from "../Chat/Chat";
import ChatRoom from "../Chat/ChatRoom";
import NotifsChatRooms from "../Screens/NotifsChatRooms";
import LogHome from "../Login/LogHome";
import BeautyHome from "../Screens/BeautyHome";

const underline = require("../img/underline.png")
const tabActionImg = require("../img/btn/tabAction.png")
const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const actionBtnRoundSize = 24
const tabBtnSize = 40
const tabBarHeigth = 54
const tabIconsSize = tabBtnSize

const tabNone = [
    "Shop",
    "Shops",
    "SetPassword",
    "SetPersonnalInfos",
    "WebViewGoogle",
    "WebViewInstagram",
    "History",
    "CampaignsList",
    "Notifications",
    "Campaign",
    "ClientQrCode",
    "GeolocationView",
    "TicketsQrCode",
    "ShopReview",
    "PartnerCode",
    "ChatRoom",
    "Chat",
    "NotifsChatRooms",
    "LogHome",
    "BeautyHome",
]

// changeTransition
// screenOptions={{
//     gestureEnabled:true,
//     gestureDirection:"horizontal",
//     transitionSpec:{
//         open:config,
//         close:closeConfig,
//     },
//     cardStyleInterpolator:CardStyleInterpolators.forScaleFromCenterAndroid,
// }}
const config = {
    animation:"spring",
    config:{
        stiffness:1000,
        damping:50,
        mass:3,
        overshootClamping:false,
        restDispacementThreshold:0.01,
        restSpeedThreshold:0.01,
    }
}
const closeConfig = {
    animation:"timing",
    config:{
        duration:200,
        easing:Easing.linear,
    }
}
const customTransition = {
    gestureEnabled:true,
    gestureDirection:"horizontal",
    transitionSpec:{
        open:TransitionSpecs.TransitionIOSSpec,
        close:TransitionSpecs.TransitionIOSSpec,
    },
    cardStyleInterpolator:({current,next,layouts})=>{
        return{
            cardStyle:{
                transform:[
                    {translateX:current.progress.interpolate({
                        inputRange:[0,1],
                        outputRange:[layouts.screen.width,0],
                    })},
                    {rotate:current.progress.interpolate({
                        inputRange:[0,1],
                        outputRange:["180deg","0deg"],
                    })},
                    {scale:next ? next.progress.interpolate({
                        inputRange:[0,1],
                        outputRange:[1,0.7],
                    }) : 1},
                ]
            }
        }
    },
}

function hideTabBar(navigation, route, insets) {
    const authContext = useContext(AuthContext)
    const {
        setTabBar_underline_active,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    useFocusEffect(() => {
        if(route){
            const routeName = getFocusedRouteNameFromRoute(route)
            
            if (tabNone.includes(routeName)) {
                navigation.setOptions({tabBarStyle: {display: "none"}})
                setTabBar_underline_active(false)
            } else {
                navigation.setOptions({
                    tabBarStyle: {
                        ...styles.tabBarStyle,
                        paddingBottom: insets.bottom + 6,
                        height: tabBarHeigth + insets.bottom,
                    },
                })
                setTabBar_underline_active(true)
            }
        }
    })
}

const EmptyScreen = () => {
    return (<View style={[{ flex: 1, justifyContent: "center", alignItems: "center" }]} />)
}

export function getWidth() {
    let width = Dimensions.get("window").width
    width = width - 20
    return width / 5
}

export const StackLogin = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="LogHome" screenOptions={{}}>
            <Stack.Screen name="LogHome" component={LogHome} options={{headerShown:false}} />
            <Stack.Screen name="SignIn" component={SignIn} options={{headerShown:false}} />
            <Stack.Screen name="SignUp" component={SignUp} options={{headerShown:false}} />
            <Stack.Screen name="PassLost" component={PassLost} options={{headerShown:false}} />
            <Stack.Screen name="TabLoginNavigator" component={TabLoginNavigator} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const StackHome = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{}}>
            <Stack.Screen name="Home" component={Home} options={{headerShown:false}} />
            <Stack.Screen name="BeautyHome" component={BeautyHome} options={{headerShown:false}} />
            <Stack.Screen name="CampaignsList" component={CampaignsList} options={{headerShown:false}} />
            <Stack.Screen name="Campaign" component={Campaign} options={{headerShown:false}} />
            <Stack.Screen name="TicketsQrCode" component={TicketsQrCode} options={{headerShown:false}} />
            <Stack.Screen name="Shops" component={Shops} options={{headerShown:false}} />
            <Stack.Screen name="Shop" component={Shop} options={{headerShown:false}} />
            <Stack.Screen name="ShopReview" component={ShopReview} options={{headerShown:false}} />
            <Stack.Screen name="Chat" component={Chat} options={{headerShown:false}} />
            <Stack.Screen name="ChatRoom" component={ChatRoom} options={{headerShown:false}} />
            <Stack.Screen name="NotifsChatRooms" component={NotifsChatRooms} options={{headerShown:false}} />
            <Stack.Screen name="Notifications" component={Notifications} options={{headerShown:false}} />
            <Stack.Screen name="ClientQrCode" component={ClientQrCode} options={{headerShown:false}} />
            <Stack.Screen name="SetPersonnalInfos" component={SetPersonnalInfos} options={{headerShown:false}} />
            <Stack.Screen name="GeolocationView" component={GeolocationView} options={{headerShown:false}} />
            <Stack.Screen name="HomeHead" component={HomeHead} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const StackRewards = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="Rewards" screenOptions={{}}>
            <Stack.Screen name="Rewards" component={Rewards} options={{headerShown:false}} />
            <Stack.Screen name="SetPersonnalInfos" component={SetPersonnalInfos} options={{headerShown:false}} />
            <Stack.Screen name="Shop" component={Shop} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const StackShops = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="Shops" screenOptions={{}}>
            <Stack.Screen name="Shops" component={Shops} options={{headerShown:false}} />
            <Stack.Screen name="Shop" component={Shop} options={{headerShown:false}} />
            <Stack.Screen name="ShopReview" component={ShopReview} options={{headerShown:false}} />
            <Stack.Screen name="Chat" component={Chat} options={{headerShown:false}} />
            <Stack.Screen name="ChatRoom" component={ChatRoom} options={{headerShown:false}} />
            <Stack.Screen name="SetPersonnalInfos" component={SetPersonnalInfos} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const StackOffers = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="OffersList" screenOptions={{}}>
            <Stack.Screen name="OffersList" component={OffersList} options={{headerShown:false}} />
            <Stack.Screen name="Campaign" component={Campaign} options={{headerShown:false}} />
            <Stack.Screen name="Shop" component={Shop} options={{headerShown:false}} />
            <Stack.Screen name="Chat" component={Chat} options={{headerShown:false}} />
            <Stack.Screen name="ChatRoom" component={ChatRoom} options={{headerShown:false}} />
            <Stack.Screen name="ShopReview" component={ShopReview} options={{headerShown:false}} />
            <Stack.Screen name="CampaignsList" component={CampaignsList} options={{headerShown:false}} />
            <Stack.Screen name="GeolocationView" component={GeolocationView} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const StackAccount = ({ navigation, route }) => {
    const insets = useSafeAreaInsets()
    hideTabBar(navigation, route, insets)
    return (
        <Stack.Navigator initialRouteName="Account" screenOptions={{}}>
            <Stack.Screen name="Account" component={Account} options={{headerShown:false}} />
            <Stack.Screen name="SetPassword" component={SetPassword} options={{headerShown:false}} />
            <Stack.Screen name="SetPersonnalInfos" component={SetPersonnalInfos} options={{headerShown:false}} />
            <Stack.Screen name="History" component={History} options={{headerShown:false}} />
            <Stack.Screen name="PartnerCode" component={PartnerCode} options={{headerShown:false}} />
        </Stack.Navigator>
    )
}

export const TabNavigator = () => {
    const {
        setModalNFCVisible,
        tabBar_underline,
        tabBar_underline_active,
    } = useContext(UserContext)
    const insets = useSafeAreaInsets()
    return (<>
        <Tab.Navigator
            initialRouteName="Accueil"
            screenOptions={{
                tabBarActiveTintColor: secondaryColor,
                headerShown: false,
                tabBarInactiveTintColor: "#fff",
                tabBarStyle: {
                    ...styles.tabBarStyle,
                    paddingBottom: insets.bottom + 6,
                    height: tabBarHeigth + insets.bottom,
                },
            }}
        >
            <Tab.Screen
                name="Accueil"
                component={StackHome}
                options={{
                    tabBarLabel: traductor("Accueil"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabHome width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:0,
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
            <Tab.Screen
                name="Cadeaux"
                component={StackRewards}
                options={{
                    tabBarLabel: traductor("Cadeaux"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabRewards width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:getWidth(),
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
            <Tab.Screen
                name="ActionButton"
                component={EmptyScreen}
                options={{
                    tabBarLabel: traductor("NFC"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <TouchableOpacity style={[styles.button]} onPress={() => setModalNFCVisible(true)} >
                            <View style={[styles.btnCircleUp]}>
                                <Image source={tabActionImg} style={[styles.btnImg]} />
                            </View>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Tab.Screen
                name="Coupon"
                component={StackOffers}
                options={{
                    tabBarLabel: traductor("Coupon"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabShops width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:getWidth() * 3,
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
            <Tab.Screen
                name="Compte"
                component={StackAccount}
                options={{
                    tabBarLabel: traductor("Compte"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabAccount width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:getWidth() * 4,
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
        </Tab.Navigator>
        {tabBar_underline_active && <Animated.View style={[
            styles.underlineAnimated,
            { transform: [{ translateX: tabBar_underline }] },
            Platform.OS === "ios" && { bottom: insets.bottom + tabBarHeigth - 4 }
        ]}>
            <Image style={[styles.underline]} source={underline} />
        </Animated.View>}
    </>)
}

export const TabLoginNavigator = ({navigation}) => {
    const {
        tabBar_underline,
        tabBar_underline_active,
    } = useContext(NoUserContext)
    const insets = useSafeAreaInsets()
    return (<>
        <Tab.Navigator
            initialRouteName="Accueil"
            screenOptions={{
                tabBarActiveTintColor: secondaryColor,
                headerShown: false,
                tabBarInactiveTintColor: "#fff",
                tabBarStyle: {
                    ...styles.tabBarStyleNoUser,
                    paddingBottom: insets.bottom + 6,
                    height: tabBarHeigth + insets.bottom,
                },
            }}
        >
            <Tab.Screen
                name="Accueil"
                component={StackHome}
                options={{
                    tabBarLabel: traductor("Accueil"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabHome width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:0,
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
            <Tab.Screen
                name="ActionButton"
                component={EmptyScreen}
                options={{
                    tabBarLabel: traductor("Compte"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <TouchableOpacity style={[styles.button,{paddingHorizontal:40}]} onPress={()=>{
                            Animated.spring(tabBar_underline,{
                                toValue:getWidth() * 0,
                                useNativeDriver:true
                            }).start()
                            goToScreen(navigation,"goBack")
                        }} >
                            <View style={[styles.btnCircleUp,{bottom:0,paddingLeft:4}]}>
                                <TabAccount width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                            </View>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Tab.Screen
                name="Coupon"
                component={StackOffers}
                options={{
                    tabBarLabel: traductor("Coupon"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.itemContainer]}>
                            <TabShops width={tabIconsSize} height={tabIconsSize} colorIcon={color} />
                        </View>
                    ),
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        Animated.spring(tabBar_underline,{
                            toValue:getWidth() * 3.34,
                            useNativeDriver:true
                        }).start()
                    }
                })}
            />
        </Tab.Navigator>
        {/* {tabBar_underline_active && <Animated.View style={[styles.underlineAnimatedNoUser,{transform:[{translateX:tabBar_underline}]}]}>
            <Image style={[styles.underline]} source={underline} />
        </Animated.View>} */}

        {tabBar_underline_active && <Animated.View style={[
            styles.underlineAnimatedNoUser,
            { transform: [{ translateX: tabBar_underline }] },
            Platform.OS === "ios" && { bottom: insets.bottom + tabBarHeigth - 4 }
        ]}>
            <Image style={[styles.underline]} source={underline} />
        </Animated.View>}
    </>)
}

export const styles = StyleSheet.create({
    shawdow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -10,
        },
        shadowOpacity: 0.12,
        shadowRadius: 5,
    },
    button: {
        flex: 1,
        justifyContent: "center",
    },
    btnCircleUp: {
        width: actionBtnRoundSize * 3,
        height: actionBtnRoundSize * 2,
        borderRadius: actionBtnRoundSize * 2 / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
        bottom: 4,
    },
    tabbarItem: {
        flex:1,
        alignItems:"center",
        justifyContent:"center",
    },
    btnImg: {
        width: actionBtnRoundSize - 1,
        height: actionBtnRoundSize - 1,
    },
    bottomBarLabel:{
        fontSize: 10,
        fontWeight: "500",
        color: "#fff",
        marginTop: 2,
        marginBottom: 4,
    },
    itemContainer: {
        flex: 1,
        backgroundColor: primaryColor,
        alignItems: "center",
    },
    underline: {
        width: tabBtnSize,
        height: 4,
    },
    underlineAnimated: {
        width: getWidth(),
        height: 4,
        position: "absolute",
        bottom: tabBarHeigth - 4,
        left: 0,
        marginHorizontal:getWidth() / 2.7,
    },
    tabBarStyle:{
        backgroundColor: primaryColor,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 10,
        position: "absolute",
        display:"flex",
    },
    underlineAnimatedNoUser: {
        width: getWidth(),
        height: 4,
        position: "absolute",
        bottom: tabBarHeigth - 4,
        left: 0,
        marginHorizontal:getWidth() / 1.4,
    },
    tabBarStyleNoUser:{
        backgroundColor: primaryColor,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 10,
        position: "absolute",
        display:"flex",
    },
});