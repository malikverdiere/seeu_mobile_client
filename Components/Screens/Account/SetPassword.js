import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import { boxShadow, boxShadowInput, goToScreen, Header, InputText, KeyboardHeight, primaryColor, secondaryColor, statusBarHeigth, traductor } from '../../AGTools';
import { ModalBox } from '../../ModalBox';
import { auth } from '../../../firebase.config';
import { EmailAuthProvider } from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const arrowBack = require("../../img/arrow/arrowBackBg.png")
const imgSecureHide = require("../../AGTools/img/secureHide.png")
const imgSecureVisible = require("../../AGTools/img/secureVisible.png")

const heightS = Dimensions.get("screen").height
const headerImgSize = 40

export default function SetPassword({
    navigation,
}){
    const [password, setPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const currentUser = auth.currentUser
    const modalBox = ModalBox()
    const modalBoxCallback = ModalBox()
    const modalBoxConfirm = ModalBox()

    const onBack = () =>{
        goToScreen(navigation,"goBack")
    }

    const onCheck = () =>{
        if(password !== "" && newPassword !== "" && confirmPassword !== ""){
            modalBoxConfirm.openBoxConfirm("",traductor("Etes-vous sûr de vouloir modifier ?"))
        } else {
            modalBox.openBoxInfos(traductor("Echec"),traductor("Vérifier si les champs requis sont bien remplis"))
        }
    }

    const reauthenticate = (currentPassword) =>{
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword)
        return currentUser.reauthenticateWithCredential(cred)
    }

    const onSubmit = () =>{
        reauthenticate(password).then(()=>{
            if(password === newPassword){
                modalBox.openBoxInfos(traductor("Echec"), traductor("Vous ne pouvez pas utiliser l'ancien mot de passe"))
            } else if(newPassword !== confirmPassword){
                modalBox.openBoxInfos(traductor("Echec"), traductor("Confirmation de mot de passe incorrect"))
            } else {
                currentUser.updatePassword(newPassword).then(()=>{
                    modalBoxCallback.openBoxInfos(traductor("Succès"), traductor("Le mot de passe a été modifié"))
                }).catch((error)=>{
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue \n") + error.message);
                })
            }
        }).catch((error)=>{
            if(error.code === "auth/wrong-password"){
                modalBox.openBoxInfos(traductor("Echec"), traductor("Le mot de passe actuel n'est pas valide"))
            }
            if(error.code === "auth/too-many-requests"){
                modalBox.openBoxInfos(traductor("Echec"), traductor("Nous avons bloqué toutes les demandes de cet appareil en raison d'une activité inhabituelle. Réessayez plus tard. [L'accès à ce compte a été temporairement désactivé en raison de nombreuses tentatives de connexion infructueuses. Vous pouvez le restaurer immédiatement en réinitialisant votre mot de passe ou vous pouvez réessayer plus tard."))
            }
        })
    }

    return(<View style={[styles.viewContainer]}>

        <SafeAreaView />
        <LinearGradient style={[styles.headerBg,{height:heightS * 0.3}]} colors={[secondaryColor, primaryColor]} start={{x: 1.0, y: 0.0}} end={{x: 1.0, y: 1.5}} />

        <ScrollView style={[]} bounces={false}>

            <View style={[styles.container]}>

                <Header
                    title={traductor("Modifier mot de passe")}
                    titleStyle={[styles.headerTitle]}
                    containerStyle={[{marginTop:statusBarHeigth,backgroundColor:"#ffffff00"}]}
                    imgLeft={arrowBack}
                    imgLeftStyle={[styles.headerImg]}
                    leftAction={onBack}
                />
                
                <View style={[styles.formContainer,boxShadow]}>
                    <View style={[styles.formInputContainer]}>

                        <Text style={[styles.label]}>{traductor("Ancien mot de passe :")}</Text>
                        <View style={[styles.passwordContainer,boxShadowInput]}>
                            <InputText
                                placeholder={traductor("mot de passe")}
                                defaultValue={password}
                                inputAction={setPassword}
                                imgSecureHide={imgSecureHide}
                                imgSecureVisible={imgSecureVisible}
                                inputStyle={[styles.passwordStyle]}
                                imgRightContainerStyle={[styles.imgRight]}
                                errorStyle={[styles.errorStyle]}
                                isSecure
                            />
                        </View>
                        <Text style={[styles.label]}>{traductor("Nouveau mot de passe :")}</Text>
                        <View style={[styles.passwordContainer,boxShadowInput]}>
                            <InputText
                                placeholder={traductor("mot de passe")}
                                defaultValue={newPassword}
                                inputAction={setNewPassword}
                                imgSecureHide={imgSecureHide}
                                imgSecureVisible={imgSecureVisible}
                                inputStyle={[styles.passwordStyle]}
                                imgRightContainerStyle={[styles.imgRight]}
                                errorStyle={[styles.errorStyle]}
                                isSecure
                            />
                        </View>
                        <Text style={[styles.label]}>{traductor("Confirmation du mot de passe :")}</Text>
                        <View style={[styles.passwordContainer,boxShadowInput]}>
                            <InputText
                                placeholder={traductor("mot de passe")}
                                defaultValue={confirmPassword}
                                inputAction={setConfirmPassword}
                                imgSecureHide={imgSecureHide}
                                imgSecureVisible={imgSecureVisible}
                                inputStyle={[styles.passwordStyle]}
                                imgRightContainerStyle={[styles.imgRight]}
                                errorStyle={[styles.errorStyle]}
                                isSecure
                            />
                        </View>

                        <TouchableOpacity style={[styles.btn]} onPress={onCheck}>
                            <Text style={[styles.btnText]}>{traductor("Enregistrer")}</Text>
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
        backgroundColor:"#FFFAF3",
    },
    container:{
        alignItems:"center",
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
        width:"90%",
        alignItems:"center",
        backgroundColor:"#fff",
        borderRadius:16,
        padding:20,
        marginBottom:48,
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
    passwordContainer:{
        borderRadius:15,
        backgroundColor:"#f7f7f7",
        marginTop:13,
    },
    passwordStyle:{
        paddingLeft:20,
        borderRadius:15,
        borderWidth:0,
        fontSize:13,
        color:"#303030",
        backgroundColor:"#f7f7f7",
        borderTopRightRadius:0,
        borderBottomRightRadius:0,
    },
    imgRight:{
        borderRadius:15,
        borderWidth:0,
        backgroundColor:"#f7f7f7",
        borderTopLeftRadius:0,
        borderBottomLeftRadius:0,
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