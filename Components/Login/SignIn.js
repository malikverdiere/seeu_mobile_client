import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform, SafeAreaView, ImageBackground } from 'react-native';
import { LoadingContext, KeyboardHeight, InputText, goToScreen, primaryColor, statusBarHeigth, traductor } from '../AGTools';
import { ModalBox } from '../ModalBox';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { version } from '../../package.json';
import { auth, firestore } from '../../firebase.config';
import { GoogleAuthProvider, AppleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { collection, doc, setDoc } from '@react-native-firebase/firestore';

import { webClientId_ASIA } from '@env';

const imgSecureHide = require("../AGTools/img/secureHide.png")
const imgSecureVisible = require("../AGTools/img/secureVisible.png")
const logo = require("../img/logo/logoPurple.png")
const appleImg = require("../img/social/apple.png")
const googleImg = require("../img/social/google.png")
const bgImg = require("../img/bg/bgGradiant.png")

export default function SignIn({
    navigation,
}){
    const {
        setLoading,
    } = useContext(LoadingContext)

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "846057365263-2hfi38vu782um9lotb1ubr7imi5rhrdn.apps.googleusercontent.com",
            // iosClientId: webClientId_ASIA, // Décommentez cette ligne si vous êtes sur iOS
        });
    }, []);
    
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    
    const modalBox = ModalBox()

    const onBack = ()=>{
        goToScreen(navigation,"goBack")
    }
    
    const onPassLost = () =>{
        goToScreen(navigation,"PassLost")
    }

    const onSignUp = () =>{
        goToScreen(navigation,"SignUp")
    }

    const onGoogleButtonPress = async() =>{
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Get the users ID token
        const { idToken } = await GoogleSignin.signIn();

        if (!idToken) {
            throw new Error('No ID token received from Google Sign In');
        }
    
        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);
    
        // Sign-in the user with the credential
        return signInWithCredential(auth, googleCredential);
    }

    const onAppleButtonPress = async() => {
        const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });
        
        // Ensure Apple returned a user identityToken
        if (!appleAuthRequestResponse.identityToken) {
            throw new Error('Apple Sign-In failed - no identify token returned');
        }
        
        // Create a Firebase credential from the response
        const { identityToken, nonce } = appleAuthRequestResponse;
        const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
        
        // Sign the user in with the credential
        return signInWithCredential(auth, appleCredential);
    }

    const onSubmit = () => {
        setLoading(true)
        if(email && password){
            signInWithEmailAndPassword(auth, email, password).then(() => {
                setLoading(false)
            }).catch((err) => {
                setLoading(false)
                if (err.code === 'auth/email-already-in-use') {
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Cette adresse email est déjà utilisée!"))
                } else if (err.code === 'auth/invalid-email') {
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Cette adresse e-mail n'est pas valide!"))
                } else if (err.code === 'auth/user-not-found') {
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Il n'y a pas d'enregistrement d'utilisateur correspondant à cet identifiant. L'utilisateur a peut-être été supprimé."))
                } else if (err.code === 'auth/wrong-password' || err.code === 'auth/unknown') {
                    modalBox.openBoxInfos(traductor("Echec"), traductor("L'utilisateur ou le mot de passe n'est pas valide"))
                } else if(err.code === "auth/too-many-requests"){
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Nous avons bloqué toutes les demandes de cet appareil en raison d'une activité inhabituelle. Réessayez plus tard. [L'accès à ce compte a été temporairement désactivé en raison de nombreuses tentatives de connexion infructueuses. Vous pouvez le restaurer immédiatement en réinitialisant votre mot de passe ou vous pouvez réessayer plus tard."))
                } else if(err.code === "auth/user-disabled"){
                    modalBox.openBoxInfos(traductor("Echec"), traductor("Le compte utilisateur a été désactivé par un administrateur."))
                } else {
                    modalBox.openBoxInfos(traductor("Echec"), err.message)
                }
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
                <Text style={[styles.version]}>{"V"} {version}</Text>
            </View>

            <Image source={logo} style={[styles.logo]} />

            <View style={[styles.formContainer]}>

                <Text style={[styles.title]}>{traductor("Bienvenue")} !</Text>
                
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
                
                <InputText
                    label={traductor("Mot de passe")}
                    labelStyle={[styles.inputLabel,{marginTop:10}]}
                    placeholder={traductor("Mot de passe")}
                    defaultValue={password}
                    inputAction={setPassword}
                    imgSecureHide={imgSecureHide}
                    imgSecureVisible={imgSecureVisible}
                    inputStyle={[styles.inputStyle,styles.passwordStyle]}
                    imgRightContainerStyle={[styles.inputStyle,styles.passwordIcon]}
                    errorStyle={[styles.errorStyle]}
                    isSecure
                    starRequired={false}
                />

                <View style={[{flexDirection:"row",justifyContent:"flex-end"}]}>
                    <TouchableOpacity onPress={onPassLost}>
                        <Text style={[styles.passLostText]}>{traductor("Mot de passe oublié ?")}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.btn]} onPress={onSubmit}>
                    <Text style={[styles.btnText]}>{traductor("Se connecter")}</Text>
                </TouchableOpacity>

                <View style={[styles.separatorContainer]}>
                    <View style={[styles.separator]} />
                    <Text style={[styles.socialTitle]}>{traductor("Ou")}</Text>
                    <View style={[styles.separator]} />
                </View>

                <View style={[styles.socialForm]}>
                    {Platform.OS === "ios" && <TouchableOpacity style={[styles.socialBtn]} onPress={() =>
                        setTimeout(() => {
                            onAppleButtonPress().then((res) => {
                                if(res.additionalUserInfo.isNewUser){
                                    const email = res.additionalUserInfo.profile.email;
                                    setDoc(doc(collection(firestore, "Clients"), auth.currentUser.uid), {
                                        userId: auth.currentUser.uid,
                                        creatAt: new Date(),
                                        email: email,
                                    }).then(() => {
                                        setLoading(false)
                                    }).catch((err) => {
                                        setLoading(false)
                                        modalBox.openBoxInfos(traductor("Echec"), err.message)
                                    })
                                }
                            })
                        }, 1000)
                    }>
                        <Image source={appleImg} style={[styles.socialImg]} />
                    </TouchableOpacity>}
                    <TouchableOpacity 
                        style={[styles.socialBtn]} 
                        onPress={() => {
                            setTimeout(() => {
                                onGoogleButtonPress().then((res) => {
                                    if(res.additionalUserInfo.isNewUser){
                                        const email = res.additionalUserInfo.profile.email;
                                        setDoc(doc(collection(firestore, "Clients"), auth.currentUser.uid), {
                                            userId: auth.currentUser.uid,
                                            creatAt: new Date(),
                                            email: email,
                                            device: Platform.select({
                                                ios: 'ios',
                                                android: 'android',
                                                default: 'autre',
                                            }),
                                        }).then(() => {
                                            setLoading(false)
                                        }).catch((err) => {
                                            setLoading(false)
                                            modalBox.openBoxInfos(traductor("Echec"), err.message)
                                        })
                                    }
                                })
                            }, 1000)
                        }}
                    >
                        <Image source={googleImg} style={[styles.socialImg]} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.btnSignIn]} onPress={onSignUp}>
                    <Text style={[styles.text]}>{traductor("Vous n'avez pas de compte")} ?
                        <Text style={[styles.text,{color:primaryColor}]}>{" "}{traductor("S'inscrire")}</Text>
                    </Text>
                </TouchableOpacity>

                <KeyboardHeight />
                <SafeAreaView />
            </View>

        </View>
        
        {modalBox.renderBoxInfos("")}
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
        fontSize:32,
        marginVertical:30,
    },
    version:{
        fontSize:12,
        color:"#000",
        fontWeight:"300",
        textAlign:"right",
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
    passwordStyle:{
        borderRightWidth:0,
        borderTopRightRadius:0,
        borderBottomRightRadius:0,
    },
    passwordIcon:{
        borderLeftWidth:0,
        borderTopLeftRadius:0,
        borderBottomLeftRadius:0,
    },
    passLostText:{
        color:primaryColor,
        fontSize:10,
        fontWeight:"500",
        textAlign:"right",
        paddingBottom:20,
        paddingTop:10,
        paddingRight:0,
    },
    btn:{
        borderRadius:15,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#000",
        paddingVertical:20,
    },
    btnText:{
        color:"#fff",
        fontSize:16,
        fontWeight:"600",
    },
    separatorContainer:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        marginVertical:20,
    },
    separator:{
        flex:1,
        height:1,
        backgroundColor:"#fff",
    },
    socialTitle:{
        fontSize:14,
        color:"#000",
        fontWeight:"600",
        marginHorizontal:5,
    },
    socialForm:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
    },
    socialBtn:{
        width:50,
        height:50,
        borderRadius:15,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#F2F2F2",
        marginHorizontal:20,
    },
    socialImg:{
        width:30,
        height:30,
    },
    imgRight:{
        borderRadius:15,
        borderWidth:0,
        backgroundColor:"#f7f7f7",
        borderTopLeftRadius:0,
        borderBottomLeftRadius:0,
    },
    errorStyle:{
        position:"absolute",
        bottom:-14,
    },
    btnSignIn:{
        alignItems:"center",
        paddingBottom:14,
        marginTop:30,
    },
})