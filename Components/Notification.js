import { useLayoutEffect } from 'react';
import { getCurrentDate } from './AGTools';
import { auth, firestore } from '../firebase.config';
import {
    collection,
    doc,
    updateDoc,
    getDocs,
    addDoc,
    setDoc,
} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

let fcmUnsubscribe = null

export default function Notification() {
    const currentUser = auth.currentUser
    const userCollection = collection(firestore, "Clients")
    const userDocument = doc(userCollection, currentUser?.uid)
    const registeredShopsCollection = collection(userDocument, "RegisteredShops")
    
    async function saveTokenToDatabase(token) {
        const querySnapshot = await getDocs(registeredShopsCollection)
        const registeredShops = []
        querySnapshot.forEach((doc) => {
            registeredShops.push({
                docId: doc.id,
                docData: doc.data()
            })
        })

        if (currentUser?.uid) {
            await updateDoc(userDocument, {
                tokensFCM: token,
            }).then(() => {
                registeredShops.data.map(async (shop) => {
                    const shopDoc = doc(registeredShopsCollection, shop.docId)
                    await updateDoc(shopDoc, {
                        tokensFCM: token,
                    })
                })
            })
        }
    }

    async function requestUserPermission() {
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled
    }

    useLayoutEffect(() => {
        async function clean() {
            if(currentUser){
                const enabled = await requestUserPermission()

                if (enabled) {
                    messaging().getToken().then(token =>{
                        saveTokenToDatabase(token)
                    })
                    messaging().onTokenRefresh(token => {
                        saveTokenToDatabase(token)
                    })
                    
                    fcmUnsubscribe = messaging().onMessage(async remoteMessage => {
                        // console.log("onMessage == ",remoteMessage);
                        addNotification(remoteMessage)
                        updateRulesNotifReceived(remoteMessage)
                        addGift(remoteMessage)
                        onNotificationSound()
                    })

                    messaging().onNotificationOpenedApp(remoteMessage =>{
                        // console.log("onNotificationOpenedApp == ",remoteMessage);
                    })
                    messaging().getInitialNotification().then(remoteMessage =>{
                        if(remoteMessage){
                            // console.log("getInitialNotification == ",remoteMessage);
                            return
                        }
                    })
                }
            }
        }
        clean();
    }, [currentUser])
}

export function backgroundMessageFCM(data) {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        addNotification(remoteMessage)
        updateRulesNotifReceived(remoteMessage)
        addGift(remoteMessage)
        onNotificationSound()
        // console.log("setBackgroundMessageHandler ",remoteMessage);
    })
}

export function subTopic(topic) {
    messaging().subscribeToTopic(topic)
    // .then(()=>{
    //     console.log("sub =",topic);
    // })
}

export function unSubTopic(topic) {
    messaging().unsubscribeFromTopic(topic)
    // .then(()=>{
    //     console.log("unSub = ",topic);
    // })
}

export function onNotificationSound() {
    try {
        SoundPlayer.playAsset(require("./sounds/ping.mp3"))
    } catch (e) {
        return
    }
}

export function addNotification(remoteMessage, isShow=false) {
    const currentUser = auth.currentUser;
    
    if(remoteMessage?.data?.type === "chat") return;

    const notificationsRef = collection(firestore, "Clients", currentUser.uid, "Notifications");
    
    const baseNotification = {
        creatAt: new Date(),
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
        data: remoteMessage?.data,
        messageId: remoteMessage?.messageId,
        isShow: isShow,
    }

    let notificationData = {...baseNotification};

    if(remoteMessage?.data?.shopImg) {
        notificationData = {
            ...notificationData,
            shopImg: remoteMessage.data.shopImg,
            shopId: remoteMessage.data.shopId,
        }
    } else if(remoteMessage?.notification?.android?.imageUrl) {
        notificationData = {
            ...notificationData,
            imageUrl: remoteMessage.notification.android.imageUrl,
            shopId: remoteMessage.data?.shopId,
        }
    } else if(remoteMessage?.data?.campaignId) {
        notificationData = {
            ...notificationData,
            shopId: remoteMessage.data.shopId,
            campaignId: remoteMessage.data.campaignId,
        }
    } else if(remoteMessage?.data?.shopId) {
        notificationData = {
            ...notificationData,
            shopId: remoteMessage.data.shopId,
        }
    }

    addDoc(notificationsRef, notificationData).then((docRef) => {
        onNotificationSound();
        updateDoc(docRef, {
            collectionId: docRef.id
        });
    });
}

export function addGift(remoteMessage) {
    const currentDate = getCurrentDate(new Date());

    if(remoteMessage?.data?.type === "birthday" && remoteMessage?.data?.registeredId && remoteMessage?.data?.clientId) {
        const giftRef = doc(firestore, "Clients", remoteMessage.data.clientId, "Gifts", 
            `birthday_${currentDate.day}_${currentDate.month}_${currentDate.year}_${remoteMessage.data.shopId}`);
        
        setDoc(giftRef, {
            createAt: new Date(),
            points: 0,
            value: remoteMessage?.notification?.title,
            description: remoteMessage?.notification?.body,
            type: 3,
            shopId: remoteMessage.data.shopId,
            day: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            giftType: "birthday",
            isUsed: false,
            data: remoteMessage.data,
            collectionId: `birthday_${currentDate.day}_${currentDate.month}_${currentDate.year}_${remoteMessage.data.shopId}`,
        });
    }

    if(remoteMessage?.data?.type === "lastVisit" && remoteMessage?.data?.registeredId && remoteMessage?.data?.clientId) {
        const giftRef = doc(firestore, "Clients", remoteMessage.data.clientId, "Gifts", 
            `lastVisit_${remoteMessage.data.shopId}`);
        
        setDoc(giftRef, {
            createAt: new Date(),
            points: 0,
            value: remoteMessage?.notification?.title,
            description: remoteMessage?.notification?.body,
            type: 3,
            shopId: remoteMessage.data.shopId,
            giftType: "lastVisit",
            isUsed: false,
            data: remoteMessage.data,
            collectionId: `lastVisit_${remoteMessage.data.shopId}`,
        });
    }
}

export function updateRulesNotifReceived(remoteMessage) {
    if(remoteMessage?.data?.type && remoteMessage?.data?.registeredId && remoteMessage?.data?.clientId) {
        const registeredShopRef = doc(firestore, "Clients", remoteMessage.data.clientId, 
            "RegisteredShops", remoteMessage.data.registeredId);
            
        const updates = {};
        
        switch(remoteMessage.data.type) {
            case "lastVisit":
                updates.lastVisitNotificationReceived = true;
                break;
            case "googleReview":
                updates.googleReviewNotificationReceived = true;
                break;
            case "followInsta":
                updates.instagramFollowNotificationReceived = true;
                break;
        }
        
        if(Object.keys(updates).length > 0) {
            updateDoc(registeredShopRef, updates);
        }
    }
}