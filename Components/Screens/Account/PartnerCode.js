import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, InputText, KeyboardHeight, boxShadow, boxShadowInput, goToScreen, primaryColor, secondaryColor, statusBarHeigth, traductor } from '../../AGTools';
import LinearGradient from 'react-native-linear-gradient';
import { ModalBox } from '../../ModalBox';
import { auth, firestore } from '../../../firebase.config';
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
} from '@react-native-firebase/firestore';

const arrowBack = require("../../img/arrow/arrowBackBg.png")

const heightS = Dimensions.get("screen").height
const headerImgSize = 40

export default function PartnerCode({
    navigation,
}){
    const [code, setCode] = useState("")
    const [load, setLoad] = useState(false)
    
    const currentUser = auth.currentUser
    const modalBox = ModalBox()
    const modalBoxConfirm = ModalBox()
    const modalBoxCallback = ModalBox()
    const patnerCollection = collection(firestore, "Partners")
    const userCollection = collection(firestore, "Clients")
    const userDocument = doc(userCollection, currentUser?.uid)

    const onBack = () =>{
        if(load){
            return
        } else {
            goToScreen(navigation,"goBack")
        }
    }

    const onCheck = () =>{
        if(code !== ""){
            modalBoxConfirm.openBoxConfirm("",traductor("Êtes-vous sûr que toutes les informations sont correctes ?"))
        } else {
            modalBox.openBoxInfos(traductor("Echec"),traductor("Aucun champ n'est modifié"))
        }
    }

    const onSubmit = async() => {
        setLoad(true)
        try {
            // Recherche du partenaire avec le code
            const partnersQuery = query(patnerCollection, where("code", "==", code));
            const partnersSnapshot = await getDocs(partnersQuery);
            
            if (partnersSnapshot.empty) {
                modalBox.openBoxInfos(
                    traductor("Echec"),
                    traductor("Le code ne correspond à aucun de nos partenaires") + "\n" + 
                    traductor("Vérifiez que le code est correct")
                );
                setLoad(false);
                return;
            }

            const partnerData = {
                docId: partnersSnapshot.docs[0].id,
                docData: partnersSnapshot.docs[0].data()
            };

            // Ajout du client dans la collection RegisteredClients du partenaire
            const partnerDoc = doc(patnerCollection, partnerData.docData.userId);
            const registeredClientsCollection = collection(partnerDoc, "RegisteredClients");
            
            await addDoc(registeredClientsCollection, {
                createAt: new Date(),
                partnerCode: partnerData.docData.code,
                partnerId: partnerData.docData.userId,
                clientId: currentUser.uid,
            });

            // Mise à jour du document utilisateur
            await updateDoc(userDocument, {
                partnerCode: partnerData.docData.code,
            });

            setLoad(false);
            modalBoxCallback.openBoxInfos(traductor("Succès"), traductor("Informations modifiées"));

        } catch (err) {
            setLoad(false);
            modalBox.openBoxInfos(traductor("Echec"), err.message);
        }
    }

    return(<View style={[styles.viewContainer]}>
        <SafeAreaView />
        <LinearGradient style={[styles.headerBg,{height:heightS * 0.3}]} colors={[secondaryColor, primaryColor]} start={{x: 1.0, y: 0.0}} end={{x: 1.0, y: 1.5}} />

        <ScrollView style={[]} bounces={false}>

            <View style={[styles.container]}>

                <Header
                    title={traductor("Partenaire")}
                    titleStyle={[styles.headerTitle]}
                    containerStyle={[{marginTop:statusBarHeigth,backgroundColor:"#ffffff00"}]}
                    imgLeft={arrowBack}
                    imgLeftStyle={[styles.headerImg]}
                    leftAction={onBack}
                />
                
                <View style={[styles.formContainer,boxShadow]}>
                    <View style={[styles.formInputContainer]}>

                        <Text style={[styles.label]}>{traductor("Entrez le code partenaire")}</Text>
                        <View style={[styles.passwordContainer,boxShadowInput]}>
                            <InputText
                                autoCapitalize={"none"}
                                defaultValue={code}
                                inputAction={setCode}
                                inputStyle={[styles.inputStyle,boxShadowInput]}
                            />
                        </View>

                        <TouchableOpacity style={[styles.btn]} onPress={onCheck}>
                            {load ? <ActivityIndicator size={"small"} color={"#fff"} /> 
                            : <Text style={[styles.btnText]}>{traductor("Enregistrer")}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        <KeyboardHeight />
        </ScrollView>

        {modalBox.renderBoxInfos("")}
        {modalBoxCallback.renderBoxInfos("",onBack)}
        {modalBoxConfirm.renderBoxConfirm("","",onSubmit)}

    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
        justifyContent:"space-between",
    },
    headerBg:{
        borderBottomLeftRadius:37,
        borderBottomRightRadius:37,
        position:"absolute",
        left:0,
        right:0,
    },
    headerTitle:{
        fontSize:20,
        fontWeight:"bold",
        marginRight:headerImgSize,
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    formContainer:{
        alignItems:"center",
        backgroundColor:"#fff",
        borderRadius:16,
        padding:20,
        marginBottom:48,
        marginHorizontal:20,
    },
    formInputContainer:{
        width:"100%",
    },
    label:{
        color:"#B8BBC6",
        fontWeight:"500",
        fontSize:14,
        marginTop:20,
    },
    inputStyle:{
        borderRadius:15,
        borderWidth:0,
        paddingLeft:20,
        fontSize:13,
        color:"#303030",
        backgroundColor:"#f7f7f7",
        marginTop:10,
    },
    errorStyle:{
        position:"absolute",
        bottom:-14,
    },
    btn:{
        width:"100%",
        borderRadius:8,
        height:50,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:primaryColor,
        marginTop:30,
    },
    btnText:{
        color:"#fff",
        fontSize:15,
        fontWeight:"400",
    },
})