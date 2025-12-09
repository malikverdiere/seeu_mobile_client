import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ImageBackground, Image } from 'react-native';
import { LoadingContext, KeyboardHeight, InputText, goToScreen, primaryColor, statusBarHeigth, traductor, setAppLang } from '../AGTools';
import { ModalBox } from '../ModalBox';
import { onHttpsCallable } from '../../firebase.config';

const logo = require("../img/logo/logoPurple.png")
const bgImg = require("../img/bg/bgGradiant.png")

export default function PassLost({
    navigation,
}){
    const {
        setLoading,
    } = useContext(LoadingContext)

    const [email, setEmail] = useState("")

    const modalBox = ModalBox()
    const modalBoxCallback = ModalBox()

    const onBack= () =>{
        goToScreen(navigation,"goBack")
    }

    const onSubmit = () =>{
        setLoading(true)
        if(email){
            const sendForgotPasswordEmail = onHttpsCallable('send_forgot_password_email');
            sendForgotPasswordEmail({
                email: email,
                name: "",
                language: setAppLang(),
            }).then((res)=>{
                setLoading(false)
                modalBoxCallback.openBoxInfos(traductor("Email envoyé"), traductor("Vérifiez votre boîte email ainsi que vos spams"))
            }).catch((err)=>{
                setLoading(false)
                modalBox.openBoxInfos(traductor("Echec"), err.message)
            })
        } else {
            setLoading(false)
            modalBox.openBoxInfos(traductor("Echec"), traductor("Vérifiez si tous les champs requis sont bien remplis"))
        }
    }

    return(<ImageBackground source={bgImg} resizeMode={"cover"} style={[styles.viewContainer]}>

        <SafeAreaView />
        <View style={[{height:statusBarHeigth}]} />

        <View style={[styles.container]}>

            <View style={[styles.backBtnContainer]}>
                <TouchableOpacity style={[styles.backBtn]} onPress={onBack}>
                    <Text style={[styles.backBtnText]}>{traductor("Retour")}</Text>
                </TouchableOpacity>
            </View>

            <Image resizeMode={"contain"} source={logo} style={[styles.logo]} />

            <View style={[styles.formContainer]}>

                <Text style={[styles.title]}>{traductor("Entrer votre adresse mail pour recevoir un mail de modification de mot de passe")}</Text>
                
                <InputText
                    label={traductor("Email")}
                    labelStyle={[styles.inputLabel]}
                    placeholder={traductor("Entrer email")}
                    defaultValue={email}
                    inputAction={setEmail}
                    inputStyle={[styles.inputStyle]}
                    isEmail
                    starRequired={false}
                />

                <TouchableOpacity style={[styles.btn]} onPress={onSubmit}>
                    <Text style={[styles.btnText]}>{traductor("Envoyer")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btnSignIn]} onPress={onBack}>
                    <Text style={[styles.text]}>{traductor("Mot de passe retrouvé")} ?
                        <Text style={[styles.text,{color:primaryColor}]}>{" "}{traductor("Se connecter")}</Text>
                    </Text>
                </TouchableOpacity>

                <KeyboardHeight />
                <SafeAreaView />
            </View>

        </View>
        
        {modalBox.renderBoxInfos("")}
        {modalBoxCallback.renderBoxInfos("",()=>onBack())}
    </ImageBackground>)
}
const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
    },
    container:{
        flex:1,
        justifyContent:"space-between",
    },
    formContainer:{
        backgroundColor:"#fff",
        borderTopLeftRadius:30,
        borderTopRightRadius:30,
        paddingHorizontal:40,
    },
    backBtnContainer:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        marginHorizontal:20,
    },
    backBtn:{
        padding:20,
    },
    backBtnText:{
        color:primaryColor,
        fontWeight:"600",
    },
    logo:{
        alignSelf:"center",
        width:111,
        height:56,
    },
    title:{
        color:"#000",
        fontWeight:"600",
        fontSize:16,
        marginVertical:30,
    },
    inputLabel:{
        color:"#000",
        fontWeight:"600",
        fontSize:14,
        marginBottom:6,
    },
    inputStyle:{
        paddingHorizontal:20,
        borderWidth:2,
        borderRadius:15,
    },
    btn:{
        borderRadius:15,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#000",
        paddingVertical:20,
        marginTop:30,
    },
    btnText:{
        color:"#fff",
        fontSize:16,
        fontWeight:"600",
    },
    btnSignIn:{
        alignItems:"center",
        paddingBottom:14,
        marginTop:30,
    },
})