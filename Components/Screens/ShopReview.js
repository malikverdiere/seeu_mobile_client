import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, InputText, average, goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
} from '@react-native-firebase/firestore';

const arrowBack = require("../img/arrow/arrowBackBg.png")
const ratingEmptyImg = require("../img/ratingEmpty.png")
const ratingSelectedImg = require("../img/ratingSelected.png")

const headerImgSize = 40
const ratingImgSize = 40

export default function ShopReview({
    navigation,
    route,
}){
    const [rating, setRating] = useState(route.params?.registeredShopsData?.docData?.ratingNote || 0)
    const [commentary, setCommentary] = useState(route.params?.registeredShopsData?.docData?.ratingCommentary || "")
    const [loading, setLoading] = useState(false)

    const modalBox = ModalBox()
    const modalBoxValid = ModalBox()
    const modalBoxConfirm = ModalBox()
    const shopName = route.params?.shopName
    const registeredShopsData = route.params?.registeredShopsData
    const currentUser = auth.currentUser
    
    const clientCollection = collection(firestore, "Clients")
    const clientDocument = doc(clientCollection, currentUser.uid)
    const shopCollection = collection(firestore, "Shops")
    const shopDocument = doc(shopCollection, registeredShopsData?.docData?.shopId)
    const registeredShopsCollection = collection(clientDocument, "RegisteredShops")
    const registeredShopsDocument = doc(registeredShopsCollection, registeredShopsData?.docId)
    const shopReviewsCollection = collection(shopDocument, "ShopReviews")

    const onBack = () =>{
        if(loading){
            return
        } else {
            goToScreen(navigation,"goBack")
        }
    }

    const handleStar = (e) =>{
        setRating(e)
    }

    const onCheck = () =>{
        if(rating > 0 && commentary !== ""){
            modalBoxConfirm.openBoxConfirm("",traductor("Êtes-vous sûr que toutes les informations sont correctes ?"))
        } else {
            modalBox.openBoxInfos(traductor("Echec"),traductor("Une note et un commentaire sont nécessaires"))
        }
    }

    const updateShopRating = async () => {
        const shopReviewsSnapshot = await getDocs(shopReviewsCollection);
        const notes = shopReviewsSnapshot.docs.map(doc => Number(doc.data().ratingNote));
        const avg = average(notes);

        try {
            await updateDoc(shopDocument, {
                shopRating: Number(avg),
                shopRatingNumber: shopReviewsSnapshot.docs.length,
            });
            setLoading(false);
            modalBoxValid.openBoxInfos(traductor("Succès"), traductor("Votre commentaire a été pris en compte"));
        } catch (err) {
            setLoading(false);
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err);
        }
    }

    const addRating = async () => {
        try {
            await addDoc(shopReviewsCollection, {
                ratingNote: Number(rating),
                ratingCommentary: commentary,
                clientId: currentUser.uid,
                shopId: registeredShopsData?.docData?.shopId,
            });
            await updateShopRating();
        } catch (err) {
            setLoading(false);
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err);
        }
    }

    const updateRating = async (clientRatingId) => {
        try {
            const ratingDoc = doc(shopReviewsCollection, clientRatingId);
            await updateDoc(ratingDoc, {
                ratingNote: Number(rating),
                ratingCommentary: commentary,
            });
            await updateShopRating();
        } catch (err) {
            setLoading(false);
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err);
        }
    }

    const onSubmit = async () => {
        const clientRatingQuery = query(shopReviewsCollection, where("clientId", "==", currentUser.uid));
        const clientRatingSnapshot = await getDocs(clientRatingQuery);
        
        setLoading(true);
        try {
            await updateDoc(registeredShopsDocument, {
                ratingNote: Number(rating),
                ratingCommentary: commentary,
            });

            if (clientRatingSnapshot.empty) {
                await addRating();
            } else {
                await updateRating(clientRatingSnapshot.docs[0].id);
            }
        } catch (err) {
            setLoading(false);
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue") + " \n" + err);
        }
    }

    return(<View style={[{flex:1}]}>

        <ScrollView>
            <View style={[styles.viewContainer]}>
                <SafeAreaView backgroundColor={primaryColor} />
                <View style={[styles.headerBg]} />

                <Header
                    title={traductor("Laissez un avis")}
                    titleStyle={[styles.headerTitle]}
                    containerStyle={[{marginTop:statusBarHeigth}]}
                    titleContainerStyle={[{marginRight:headerImgSize}]}
                    imgLeft={arrowBack}
                    imgLeftStyle={[styles.headerImg]}
                    leftAction={onBack}
                />

                <View style={[{marginHorizontal:20}]}>

                    {shopName && <Text style={[styles.description]}>{traductor("Laissez un avis pour")} {shopName || ""}</Text>}

                    <Text style={[styles.ratingLabel]}>{"Note"} :</Text>
                    <View style={[styles.ratingContainer]}>

                        <TouchableOpacity onPress={()=>handleStar(1)}>
                            <Image style={[styles.ratingImg,{marginLeft:0}]} source={rating > 0 ? ratingSelectedImg : ratingEmptyImg} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>handleStar(2)}>
                            <Image style={[styles.ratingImg]} source={rating > 1 ? ratingSelectedImg : ratingEmptyImg} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>handleStar(3)}>
                            <Image style={[styles.ratingImg]} source={rating > 2 ? ratingSelectedImg : ratingEmptyImg} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>handleStar(4)}>
                            <Image style={[styles.ratingImg]} source={rating > 3 ? ratingSelectedImg : ratingEmptyImg} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>handleStar(5)}>
                            <Image style={[styles.ratingImg,{marginRight:0}]} source={rating > 4 ? ratingSelectedImg : ratingEmptyImg} />
                        </TouchableOpacity>

                    </View>

                    <Text style={[styles.ratingLabel,{marginTop:30}]}>{traductor("Commentaire")} :</Text>
                    <InputText
                        defaultValue={commentary}
                        inputAction={setCommentary}
                        inputStyle={[styles.inputStyle]}
                        isArea
                    />

                    <TouchableOpacity style={[styles.btn]} onPress={onCheck}>
                        {loading ? <ActivityIndicator color={"#fff"} size={"small"} /> : <Text style={[styles.btnText]}>{traductor("Envoyer")}</Text>}
                    </TouchableOpacity>

                </View>

            </View>

        </ScrollView>

        {modalBox.renderBoxInfos("")}
        {modalBoxValid.renderBoxInfos("",onBack)}
        {modalBoxConfirm.renderBoxConfirm("","",onSubmit)}
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
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    headerTitle:{
        fontSize:26,
        fontWeight:"600",
    },
    description:{
        fontSize:18,
        fontWeight:"bold",
        marginVertical:40,
    },
    ratingContainer:{
        flexDirection:"row",
    },
    ratingLabel:{
        marginBottom:10,
    },
    ratingImg:{
        width:ratingImgSize,
        height:ratingImgSize,
        marginHorizontal:8,
    },
    inputStyle:{
        borderRadius:15,
        borderWidth:0,
        paddingLeft:10,
        fontSize:13,
        color:"#303030",
        backgroundColor:"#6857e51a",
        marginTop:10,
    },
    btn:{
        backgroundColor:primaryColor,
        alignItems:"center",
        justifyContent:"center",
        borderRadius:8,
        padding:10,
        marginTop:30,
    },
    btnText:{
        color:"#fff",
        fontSize:15,
        fontWeight:"400",
    },
})