import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, Pressable, View, Image } from 'react-native';
import { getCurrentDate, primaryColor, traductor } from './AGTools';
import SwipeableButton from './SwipeableButton';
import { auth, firestore } from '../firebase.config';
import {
    collection,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
} from '@react-native-firebase/firestore';

const btnInfosImg = require("./img/btn/close.png")
const rewardImg = require("./img/reward.png")
const noCompletImg = require("./img/infosNoComplet.png")
const giftImg = require("./img/birthday.png")
const comeBackImg = require("./img/comeBack.png")

const rewardImgSize = 60
const closeImgSize = 40

export default function UseRewards({
    shop,
    reward,
    visible,
    onVisible,
    onRefresh,
    goToProfil,
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState(0)
    const [registeredShopsData, setRegisteredShopsData] = useState(null)

    const currentUser = auth.currentUser
    const clientCollection = collection(firestore, "Clients")
    const clientDocument = doc(clientCollection, currentUser.uid)
    const rewardsHistoryCollection = collection(clientDocument, "RewardsHistory")
    const registeredShopsCollection = collection(clientDocument, "RegisteredShops")
    const giftsCollection = collection(clientDocument, "Gifts")

    const onPressClose = () => {
        setMessage("")
        setError(0)
        if (isValid && onRefresh) {
            onRefresh()
            setIsValid(false)
            onVisible(false)
        } else {
            setIsValid(false)
            onVisible(false)
        }
    }

    const onPressGoToProfil = () => {
        goToProfil()
        setMessage("")
        setError(0)
        setIsValid(false)
        onVisible(false)
    }

    const addRewardsHistory = (prev, total) => {
        addDoc(rewardsHistoryCollection, {
            creatAt: new Date(),
            reward: reward?.docData,
            shopId: reward?.docData?.shopId,
            shopName: shop[0]?.docData?.shopName,
            clientId: currentUser.uid,
            previousClientPoint: prev,
            totalPoints: total,
        })
    }

    const addGiftsHistory = () => {
        addDoc(rewardsHistoryCollection, {
            creatAt: new Date(),
            reward: reward?.docData,
            shopId: reward?.docData?.shopId,
            shopName: shop[0]?.docData?.shopName,
            clientId: currentUser.uid,
            giftType: reward?.docData?.giftType,
        })
    }

    const updatePoints = () => {
        setIsLoading(true)
        let prevPoints = Number(registeredShopsData?.docData?.points)
        let rewardPoints = Number(reward?.docData?.points)
        let total = prevPoints - rewardPoints

        if (registeredShopsData?.docData?.birthday
            && registeredShopsData?.docData?.firstName
            && registeredShopsData?.docData?.lastName
            && registeredShopsData?.docData?.gender
            && registeredShopsData?.docData?.phone
            && registeredShopsData?.docData?.postalCode
            && registeredShopsData?.docData?.address
        ) {
            if (prevPoints >= rewardPoints) {
                if (registeredShopsData?.docId) {
                    addRewardsHistory(prevPoints, total)
                    if (total <= 0) {
                        total = 0
                        updateDoc(doc(registeredShopsCollection, registeredShopsData.docId), {
                            points: total,
                        }).then(() => {
                            setIsLoading(false)
                            setIsValid(true)
                        }).catch(() => {
                            setIsLoading(false)
                            setError(0)
                            setMessage(traductor("Une erreur est survenue lors de la mise à jour des points"))
                        })
                    } else {
                        updateDoc(doc(registeredShopsCollection, registeredShopsData.docId), {
                            points: total,
                        }).then(() => {
                            setIsLoading(false)
                            setIsValid(true)
                        }).catch(() => {
                            setIsLoading(false)
                            setError(0)
                            setMessage(traductor("Une erreur est survenue lors de la mise à jour des points"))
                        })
                    }
                } else {
                    setIsLoading(false)
                }
            } else {
                setIsLoading(false)
                setError(0)
                setMessage(traductor("Cadeau non disponible"))
            }
        } else {
            setIsLoading(false)
            setError(1)
            setMessage(traductor("Veuillez compléter vos informations personnelles pour pouvoir bénéficier de vos avantages"))
        }
    }

    const updateGifts = () => {
        setIsLoading(true)
        if (registeredShopsData?.docData?.birthday
            && registeredShopsData?.docData?.firstName
            && registeredShopsData?.docData?.lastName
            && registeredShopsData?.docData?.gender
            && registeredShopsData?.docData?.phone
            && registeredShopsData?.docData?.postalCode
            && registeredShopsData?.docData?.address
        ) {
            addGiftsHistory()
            updateDoc(doc(giftsCollection, reward?.docData?.collectionId), {
                isUsed: true,
            }).then(() => {
                setIsLoading(false)
                setIsValid(true)
            })
        } else {
            setIsLoading(false)
            setError(1)
            setMessage(traductor("Veuillez compléter vos informations personnelles pour pouvoir bénéficier de vos avantages"))
        }
    }

    useEffect(() => {
        if (reward?.docData?.shopId) {
            const q = query(
                registeredShopsCollection,
                where("shopId", "==", reward.docData.shopId),
                orderBy("createAt", "asc")
            );
            
            const unSub = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    let data;
                    querySnapshot.forEach((doc) => {
                        data = { docId: doc.id, docData: doc.data() }
                    });
                    setRegisteredShopsData(data);
                }
            });
            
            return () => unSub();
        }
    }, [reward])

    return (<Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        statusBarTranslucent
        onRequestClose={() => onVisible(!visible)}
    >
        <View style={[styles.centeredView, { paddingHorizontal: 20 }]}>
            <View style={[styles.modalView]}>
                {(!isLoading && !isValid) && <Pressable style={({ pressed }) => [styles.btnClose, { opacity: pressed ? 0.5 : 1 }]} onPress={onPressClose}>
                    <Image style={[styles.btnCloseImg]} source={btnInfosImg} />
                </Pressable>}

                <Image style={[styles.rewardImg]} source={
                    message !== "" ? noCompletImg
                        : reward?.docData?.giftType === "birthday" ? giftImg
                            : reward?.docData?.giftType === "lastVisit" ? comeBackImg
                                : rewardImg
                } />

                {!isValid && message === "" ? <>
                    <Text style={[styles.title]}>{traductor("Confirmer l'éligibilité du coupon")}</Text>
                    <Text style={[styles.text, { marginVertical: 10 }]}>{traductor("Une fois \"Confirmer\", vous ne pourrez plus annuler.")}</Text>
                    {reward?.docData?.giftType ? <View style={[{ height: 20 }]} /> : <>
                        <Text style={[styles.text]}>{traductor("Vous avez")} {registeredShopsData?.docData?.points} {traductor("points")}</Text>
                        <Text style={[styles.text, { marginBottom: 20 }]}>{traductor("Utiliser")} {reward?.docData?.points} {traductor("points")}</Text>
                    </>}
                </>
                    : message === "" ? <>
                        <Text style={[styles.title, { fontSize: 24 }]}>{shop[0]?.docData?.shopName}</Text>
                        <Text style={[styles.text, { marginVertical: 10, fontSize: 24, color: primaryColor, marginVertical: 20 }]}>{reward?.docData?.description}</Text>
                    </>
                        : <></>}

                {isValid ? <View style={[{ marginBottom: 10 }]}>
                    <Text style={[styles.validText]}>{traductor("Utilisé le")}</Text>
                    <View style={[styles.validTextContainer]}>
                        <Text style={[styles.validText, styles.validTextBold]}>{getCurrentDate(new Date()).day}/{getCurrentDate(new Date()).month}/{getCurrentDate(new Date()).year}</Text>
                        <Text style={[styles.validText, { marginHorizontal: 4 }]}>{traductor("à")}</Text>
                        <Text style={[styles.validText, styles.validTextBold]}>{getCurrentDate(new Date()).hours}:{getCurrentDate(new Date()).minutes}</Text>
                    </View>
                </View>
                    : message !== "" ? <Text style={[styles.title, { textTransform: "none" }]}>{message}</Text>
                        : <SwipeableButton onSwipe={reward?.docData?.giftType ? updateGifts : updatePoints} isLoading={isLoading} />}

                {(!isLoading && isValid) && <Pressable style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.5 : 1 }]} onPress={onPressClose}>
                    <Text style={[styles.btnText]}>{isValid ? traductor("Fermer") : traductor("Annuler")}</Text>
                </Pressable>}

                {(error === 1 && goToProfil) &&
                    <Pressable style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.5 : 1 }]} onPress={onPressGoToProfil}>
                        <Text style={[styles.btnText]}>{traductor("Modifier mon profil")}</Text>
                    </Pressable>
                }
            </View>
        </View>
    </Modal>)
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000AA",
    },
    modalView: {
        width: "100%",
        margin: 20,
        marginHorizontal: 20,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        color: "#000000EE",
        fontWeight: "bold",
        textTransform: "capitalize",
        textAlign: "center",
    },
    text: {
        fontSize: 12,
        color: "#00000080",
        fontWeight: "500",
        textAlign: "center",
    },
    btn: {
        width: "100%",
        borderTopWidth: 1,
        alignItems: "center",
        borderColor: "#E1E1E1",
        justifyContent: "center",
        backgroundColor: primaryColor,
        borderRadius: 8,
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    btnClose: {
        backgroundColor: "#6857E530",
        width: closeImgSize,
        height: closeImgSize,
        borderRadius: 8,
        position: "absolute",
        top: 10,
        right: 10,
    },
    btnCloseImg: {
        width: closeImgSize,
        height: closeImgSize,
    },
    btnText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "400",
        paddingVertical: 14,
    },
    validTextContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    validText: {
        fontSize: 14,
        color: "#000000",
        fontWeight: "400",
        textAlign: "center",
    },
    validTextBold: {
        fontSize: 24,
        color: "#000000",
        fontWeight: "bold",
    },
    rewardImg: {
        marginBottom: 10,
        width: rewardImgSize,
        height: rewardImgSize,
    },
})