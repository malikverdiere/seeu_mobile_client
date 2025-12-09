import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext, goToScreen, traductor } from './AGTools';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import { auth, firestore, onHttpsCallable } from '../firebase.config';
import {
    collection,
    collectionGroup,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
} from '@react-native-firebase/firestore';

const nfcScanImg = require("./img/nfcScan.jpeg")

export default function NFCRead({
    navigation,
    modalBoxInfos,
}) {
    const {
        user,
        modalNFCVisible,
        setModalNFCVisible,
    } = useContext(UserContext)

    const [hasNfc, setHasNFC] = useState(null)

    const currentUser = auth.currentUser
    const shopCollection = collection(firestore, "Shops")
    const rewardCollection = collection(firestore, "Rewards")
    const registeredShopsCollection = collectionGroup(firestore, "RegisteredShops")
    const gift_notif_message = { title: "vous offre un cadeau", message: "La boutique partenaire vous offre :" }

    const onCancel = () => {
        NfcManager.cancelTechnologyRequest()
        setModalNFCVisible(false)
    }

    const delayToClose = () => {
        setTimeout(() => {
            onCancel()
        }, 60000)
    }

    const addHistory = async (shopId) => {
        const historyCollection = collection(firestore, "Shops", shopId, "ScansHystory")
        await addDoc(historyCollection, {
            createAt: new Date(),
            shopId: shopId,
            clientId: currentUser.uid,
        })
    }

    const addNewPoints = async (shopId, addPoints, client) => {
        const q = query(registeredShopsCollection, where("shopId", "==", shopId))
        const querySnapshot = await getDocs(q)
        const data = []
        
        querySnapshot.forEach((doc) => {
            if (doc.exists) {
                data.push({ docId: doc.id, docData: doc.data() })
            }
        })

        const newShopRef = collection(firestore, "Clients", currentUser.uid, "RegisteredShops")
        try {
            await addDoc(newShopRef, {
                createAt: new Date(),
                lastVisit: new Date(),
                shopId: shopId,
                clientId: currentUser.uid,
                points: Number(addPoints),
                nbVisit: 1,
                user_img: client?.user_img || "",
                user_img_Valid: client?.user_img_Valid || false,
                firstName: client?.firstName || "",
                lastName: client?.lastName || "",
                gender: client?.gender || 0,
                phone: client?.phone || "",
                postalCode: client?.postalCode || "",
                address: client?.address || "",
                email: client?.email || currentUser.email,
                birthday: client?.birthday || new Date("1950-01-28"),
                clientNum: data.length + 1,
                notificationsActive: true,
            })

            await addHistory(shopId)
            goToScreen(navigation, "Shop", { shopId: shopId })
            onCancel()
        } catch (error) {
            modalBoxInfos(traductor("Echec"), error.message)
        }
    }

    const addPoints = async (shopId, registerId, currentPoints, addPoints, nbVisit, client) => {
        let total = Number(currentPoints) + Number(addPoints)
        const q = query(
            rewardCollection,
            where("shopId", "==", shopId),
            orderBy("points", "asc")
        )
        const querySnapshot = await getDocs(q)
        const data = []
        
        querySnapshot.forEach((doc) => {
            if (doc.exists) {
                data.push({ docId: doc.id, docData: doc.data() })
            }
        })

        const registerRef = doc(firestore, "Clients", currentUser.uid, "RegisteredShops", registerId)
        try {
            await updateDoc(registerRef, {
                lastVisit: new Date(),
                points: total >= Number(data[data.length - 1]?.docData?.points)
                    ? Number(data[data.length - 1]?.docData?.points)
                    : total,
                nbVisit: Number(nbVisit) + 1,
                user_img: client?.user_img || "",
                user_img_Valid: client?.user_img_Valid || false,
                firstName: client?.firstName || "",
                lastName: client?.lastName || "",
                gender: client?.gender || 0,
                phone: client?.phone || "",
                postalCode: client?.postalCode || "",
                address: client?.address || "",
                email: client?.email || currentUser.email,
                birthday: client?.birthday || new Date("1950-01-28"),
                lastVisitNotificationReceived: false,
            })
            
            await addHistory(shopId)
            goToScreen(navigation, "Shop", { shopId: shopId })
            onCancel()
        } catch (err) {
            modalBoxInfos(traductor("Echec"), err.message)
        }
    }

    const send_notification = (tokens, shopName, reward, id_shop_1, id_shop_2) => {
        const sendNotification = onHttpsCallable('send_notification_client_gift_partner');

        sendNotification({
            tokens: tokens,
            title: `${shopName} ${traductor(gift_notif_message.title)}`,
            body: `${traductor(gift_notif_message.message)} ${reward?.text}`,
            data: {
                type: "gift_partner",
                id_shop_1: id_shop_1,
                id_shop_2: id_shop_2,
                partnerId: `partners_${id_shop_1}_${id_shop_2}`,
                fromScan: "byNFC",
            },
        })
    }

    const partner_reward = async (shopData) => {
        const q = query(
            collection(firestore, "PartnersRewards"),
            where("partners", "array-contains", shopData?.userId)
        )
        const querySnapshot = await getDocs(q)
        const partnersList = []
        const client_id = user?.docData?.userId
        const client_token = user?.docData?.tokensFCM

        querySnapshot.forEach((doc) => {
            if (doc.exists) {
                partnersList.push({ docId: doc.id, docData: doc.data() })
            }
        })

        for (const element of partnersList) {
            const elt = element?.docData
            const id_shop_1 = elt?.id_shop_1
            const id_shop_2 = elt?.id_shop_2
            const collectionId = `gift_partners_${id_shop_1}_${id_shop_2}`

            const giftRef = doc(firestore, "Clients", client_id, "Gifts", collectionId)
            const giftSnap = await getDoc(giftRef)

            if (!giftSnap.exists) {
                if (id_shop_1 !== user?.docData?.userId) {
                    if (elt?.[`active_${id_shop_1}`] && elt?.[`reward_selected_${id_shop_1}`] && elt?.status === "Mon partenaire") {
                        const shopRef = doc(firestore, "Shops", id_shop_1)
                        const shopSnap = await getDoc(shopRef)

                        const registeredQ = query(
                            collection(firestore, "Clients", client_id, "RegisteredShops"),
                            where("shopId", "==", id_shop_1),
                            orderBy("createAt", "asc")
                        )
                        const registeredSnap = await getDocs(registeredQ)

                        let shopName = shopSnap.data().shopName

                        let gift = {
                            createAt: new Date(),
                            points: 0,
                            value: elt?.[`reward_selected_${id_shop_1}`]?.text,
                            description: elt?.[`reward_selected_${id_shop_1}`]?.description,
                            type: 3,
                            shopId: id_shop_1,
                            clientId: client_id,
                            giftType: "partner",
                            isUsed: false,
                            data: {},
                            collectionId: collectionId,
                        }

                        if (registeredSnap.empty) {
                            await setDoc(giftRef, gift).then(() => {
                                send_notification([client_token], shopName, elt?.[`reward_selected_${id_shop_1}`], id_shop_1, id_shop_2)
                            })
                        }
                    }
                }
                if (id_shop_2 !== user?.docData?.userId) {
                    if (elt?.[`active_${id_shop_2}`] && elt?.[`reward_selected_${id_shop_2}`] && elt?.status === "Mon partenaire") {
                        const shopRef = doc(firestore, "Shops", id_shop_2)
                        const shopSnap = await getDoc(shopRef)
                        
                        const registeredQ = query(
                            collection(firestore, "Clients", client_id, "RegisteredShops"),
                            where("shopId", "==", id_shop_2),
                            orderBy("createAt", "asc")
                        )
                        const registeredSnap = await getDocs(registeredQ)
                        
                        let shopName = shopSnap.data().shopName

                        let gift = {
                            createAt: new Date(),
                            points: 0,
                            value: elt?.[`reward_selected_${id_shop_2}`]?.text,
                            description: elt?.[`reward_selected_${id_shop_2}`]?.description,
                            type: 3,
                            shopId: id_shop_2,
                            clientId: client_id,
                            giftType: "partner",
                            isUsed: false,
                            data: {},
                            collectionId: collectionId,
                        }

                        if (registeredSnap.empty) {
                            await setDoc(giftRef, gift).then(() => {
                                send_notification([client_token], shopName, elt?.[`reward_selected_${id_shop_2}`], id_shop_1, id_shop_2)
                            })
                        }
                    }
                }
            }
        }
    }

    const actionAfterScan = (shopId, tag) => {
        const shopRef = doc(shopCollection, shopId)
        getDoc(shopRef).then((docSnap) => {
            const shop = docSnap.data()

            if (shop?.nfcIds && shop?.nfcIds.length > 0) {
                if (tag.id && shop?.nfcIds.includes(tag.id)) {
                    const q = query(
                        collection(firestore, "Clients", currentUser.uid, "RegisteredShops"),
                        where("shopId", "==", shop?.userId),
                        orderBy("createAt", "asc")
                    )
                    getDocs(q).then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            if (shop?.clientRule_NewClients_IsActive) {
                                let points = shop?.clientRule_NewClients_Points
                                if (currentUser.uid) {
                                    addNewPoints(shop?.userId, points, user?.docData)
                                }
                            } else {
                                let points = shop?.clientRule_StandardClients_Points
                                if (currentUser.uid) {
                                    addNewPoints(shop?.userId, points, user?.docData)
                                }
                            }
                        }
                        if (!querySnapshot.empty) {
                            const docData = querySnapshot.docs[0].data()
                            const docId = querySnapshot.docs[0].id
                            let nbVisit = docData?.nbVisit
                            let nbPoints = docData?.points
                            let demiHours = 1800
                            let timerScan = (docData?.lastVisit?.seconds + demiHours) * 1000
                            let currentTimeScan = new Date().getTime()

                            if (currentTimeScan >= timerScan) {
                                if (nbVisit >= shop?.clientRule_Vip_Visit) {
                                    if (shop?.clientRule_Vip_IsActive) {
                                        let points = shop?.clientRule_Vip_Points
                                        if (currentUser.uid) {
                                            addPoints(shop?.userId, docId, nbPoints, points, nbVisit, user?.docData)
                                        }
                                    } else {
                                        let points = shop?.clientRule_StandardClients_Points
                                        if (currentUser.uid) {
                                            addPoints(shop?.userId, docId, nbPoints, points, nbVisit, user?.docData)
                                        }
                                    }
                                } else {
                                    let points = shop?.clientRule_StandardClients_Points
                                    if (currentUser.uid) {
                                        addPoints(shop?.userId, docId, nbPoints, points, nbVisit, user?.docData)
                                    }
                                }
                            } else {
                                modalBoxInfos(traductor("Scan limité"), `${traductor("Vous pourrez scanner à nouveau après")} ${new Date(timerScan).getHours()}:${new Date(timerScan).getMinutes()}:${new Date(timerScan).getSeconds()}`)
                            }
                        }
                    }).catch((err) => {
                        modalBoxInfos(traductor("Echec"), err.message)
                    })

                    partner_reward(shop)
                } else {
                    modalBoxInfos(traductor("Tag invalide pour cette boutique"))
                }
            } else {
                modalBoxInfos(traductor("Aucun tag ID trouvé"))
            }
        }).catch((err) => {
            modalBoxInfos(traductor("Echec"), err.message)
        })
    }

    const onTagDiscovered = (tag) => {
        let parsed = null

        if (tag.ndefMessage && tag.ndefMessage.length > 0) {
            const ndefRecords = tag.ndefMessage

            function decodeNdefRecord(record) {
                if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
                    return ['text', Ndef.text.decodePayload(record.payload)]
                } else if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
                    return ['uri', Ndef.uri.decodePayload(record.payload)]
                }

                return ['unknown', '---']
            }

            parsed = ndefRecords.map(decodeNdefRecord)
        }

        actionAfterScan(parsed[0][1], tag)
    }

    const readNdef = async () => {
        try {
            if (hasNfc) {
                await NfcManager.start()
                // register for the NFC tag with NDEF in it
                await NfcManager.requestTechnology(NfcTech.Ndef)
                // the resolved tag object will contain `ndefMessage` property
                const tag = await NfcManager.getTag()
                onTagDiscovered(tag)
            }
        } catch (ex) {
            NfcManager.cancelTechnologyRequest()
            if (ex.toString() === "Error") {
                return
            }
            modalBoxInfos('Oops!', ex.toString())
        } finally {
            // stop the nfc scanning
            NfcManager.cancelTechnologyRequest()
            setModalNFCVisible(false)
        }
    }

    useEffect(() => {
        const checkIsSupported = async () => {
            const deviceIsSupported = await NfcManager.isSupported()

            setHasNFC(deviceIsSupported)
        }
        checkIsSupported()
    }, [])

    useEffect(() => {
        modalNFCVisible && readNdef()
        modalNFCVisible && delayToClose()
    }, [modalNFCVisible])

    return (<Modal
        animationType="fade"
        transparent={true}
        visible={modalNFCVisible}
        statusBarTranslucent={true}
        onRequestClose={onCancel}
    >
        {Platform.OS === "android" && <View style={[styles.content]}>
            <TouchableOpacity style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onCancel} />

            <View style={[styles.prompt]}>
                <Text style={[styles.title]}>{traductor("Prêt à scanner")}</Text>
                <Image source={nfcScanImg} style={[styles.nfcImg]} />
                <Text style={[styles.text]}>{traductor("Please tap NFC tags")}</Text>

                <TouchableOpacity style={[styles.btn]} onPress={onCancel}>
                    <Text style={[styles.btnText]}>{traductor("Annuler")}</Text>
                </TouchableOpacity>
            </View>

        </View>}
    </Modal>)

}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: "pink",
    },
    content: {
        flex: 1,
    },
    backdrop: {
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    prompt: {
        position: "absolute",
        bottom: 4,
        left: 4,
        width: Dimensions.get("window").width - 2 * 4,
        backgroundColor: "#fff",
        borderRadius: 30,
        paddingVertical: 30,
        paddingHorizontal: 40,
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        color: "#00000080",
        fontSize: 24,
        marginBottom: 30,
    },
    text: {
        color: "#000000bb",
        fontSize: 16,
        marginBottom: 30,
    },
    btn: {
        borderRadius: 8,
        padding: 0,
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.2)",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    btnText: {
        color: "#000000BB",
        fontSize: 18,
        fontWeight: "500",
    },
    nfcImg: {
        width: 100,
        height: 100,
        marginBottom: 30,
    }
})