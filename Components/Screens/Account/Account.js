import React, { useContext, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Linking, StatusBar, SafeAreaView, ScrollView } from 'react-native';
import { UserContext, bottomTarSpace, boxShadowInput, goToScreen, primaryColor, secondaryColor, statusBarHeigth, traductor } from '../../AGTools';
import { useIsFocused } from '@react-navigation/native';
import { ModalBox } from '../../ModalBox';
import { SignOut } from '../../Login';
import { version } from '../../../package.json';
import StorageImg from '../../StorageImg';
import NFCRead from '../../NFCRead';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const defaultImg = require("../../img/logo/defaultImg.png")
const setterImg = require("../../img/btn/setter.png")
const passwordImg = require("../../img/Change_my_password.png")
const optionHistoryImg = require("../../img/optionHistory.png")
const optionSettingImg = require("../../img/optionSetting.png")
const optionTermsImg = require("../../img/optionTerms.png")
const optionPrivacyImg = require("../../img/optionPrivacy.png")
const deleteImg = require("../../img/deleteAcompte.png")
const logoutImg = require("../../img/logout.png")
const partnerImg = require("../../img/partner.png")

const heightS = Dimensions.get("screen").height
const setterImgSize = 40
const profilImgSize = 74
const optionsImgSize = 18

export default function Account({
    navigation,
}){
    const {
        user,
    } = useContext(UserContext)

    const defaultUserImg = user?.docData?.user_img ? user?.docData?.user_img : Image.resolveAssetSource(defaultImg).uri
    const storageProfilImg = StorageImg(500,500)
    const isFocused = useIsFocused()
    const modalBox = ModalBox()
    const regexHttp = new RegExp("http*")
    const insets = useSafeAreaInsets()

    const infos = [
        {id:0,texte:"Modifier mot de passe",goTo:"SetPassword"},
        {id:1,texte:"Historique",goTo:"History"},
        {id:2,texte:"Paramètres",goTo:"openSettings"},
        // {id:3,texte:"FAQ",goTo:"openSettings"},
        {id:3,texte:"Termes et conditions",goTo:"https://getseeu.com/cgu"},
        {id:4,texte:"Politique de confidentialité",goTo:"https://getseeu.com/politique-de-confidentialite"},
        {id:5,texte:"Supprimer mon compte",goTo:"https://getseeu.com/suppression-compte"},
    ]
    const icons = [
        passwordImg,
        optionHistoryImg,
        optionSettingImg,
        // optionFAQImg,
        optionTermsImg,
        optionPrivacyImg,
        deleteImg,
    ]

    const onPressOption = (e) =>{
        if(regexHttp.test(e)){
            Linking.openURL(`${e}`)
        } else {
            if(e === "openSettings"){
                Linking.openSettings()
            } else {
                goToScreen(navigation,e)
            }
        }
    }

    const onPressSetter = () =>{
        goToScreen(navigation,"SetPersonnalInfos")
    }
    const onPressPartner = () =>{
        goToScreen(navigation,"PartnerCode")
    }

    const onSignOut = () =>{
        SignOut().onSignOut()
    }

    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])

    return(<View style={[styles.viewContainer]}>

        <ScrollView bounces={false}>
            <View>
                <SafeAreaView />
                <LinearGradient style={[styles.headerBg,{height:heightS * 0.3}]} colors={[secondaryColor, primaryColor]} start={{x: 1.0, y: 0.0}} end={{x: 1.0, y: 1.5}} />

                <View style={[styles.headerContainer]}>
                    <View style={[styles.leftContent]}>
                        <Image style={[styles.profilImg]} source={{uri:storageProfilImg?.imagePicker ? storageProfilImg.imagePicker : defaultUserImg }}/>
                        <View style={[styles.textContainer]}>
                            <Text style={[styles.title]}>{traductor("Mon compte")}</Text>
                            <Text style={[styles.text]}>{user?.docData?.firstName} {user?.docData?.lastName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[]} onPress={onPressSetter}>
                        <Image style={[styles.setterImg]} source={setterImg}/>
                    </TouchableOpacity>
                </View>

                {user?.docData?.partnerCode ? <View/> : <View style={[styles.optionsContainer,boxShadowInput,{marginBottom:0}]}>
                    <View style={[]}>
                        <TouchableOpacity style={[styles.optionsItem]} onPress={onPressPartner}>
                            <View style={[styles.optionsItemContent]}>
                                <View style={[styles.optionsItemTextContainer]}>
                                    <Image resizeMode={"contain"} style={[styles.optionsIcons]} source={partnerImg}/>
                                    <Text style={[styles.optionsText]}>{"Code partenaire"}</Text>
                                </View>
                                <View style={[styles.optionsArrow]} />
                            </View>
                            <View style={[styles.optionsSeparator]}/>
                        </TouchableOpacity>
                    </View>
                </View>}
                
                <View style={[styles.optionsContainer,boxShadowInput]}>
                    <View style={[]}>
                        {infos.map((item, index)=>{
                            return(<TouchableOpacity style={[styles.optionsItem]} key={index} onPress={()=>onPressOption(item.goTo)}>
                                <View style={[styles.optionsItemContent]}>
                                    <View style={[styles.optionsItemTextContainer]}>
                                        <Image resizeMode={"contain"} style={[styles.optionsIcons]} source={icons[index]}/>
                                        <Text style={[styles.optionsText]}>{traductor(item.texte)}</Text>
                                    </View>
                                    <View style={[styles.optionsArrow]} />
                                </View>
                                <View style={[styles.optionsSeparator]}/>
                            </TouchableOpacity>)
                        })}
                    </View>
                </View>
            </View>

            <View>
                <TouchableOpacity style={[styles.logoutContainer]} onPress={onSignOut}>
                    <Image style={[styles.optionsIcons]} source={logoutImg}/>
                    <Text style={[styles.optionsText,{color:primaryColor,fontWeight:"400"}]}>{traductor("Déconnexion")}</Text>
                </TouchableOpacity>
                <Text style={[styles.version]}>{"V"} {version}</Text>
                <View style={[{marginBottom:bottomTarSpace + insets.bottom}]} />
            </View>

        </ScrollView>

        {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}
        
        {modalBox.renderBoxInfos("")}
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
    profilImg:{
        width:profilImgSize,
        height:profilImgSize,
        borderRadius:profilImgSize * 0.5,
    },
    setterImg:{
        width:setterImgSize,
        height:setterImgSize,
    },
    headerContainer:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        marginHorizontal:20,
        marginTop:statusBarHeigth + 20,
    },
    leftContent:{
        flexDirection:"row",
        alignItems:"center",
    },
    textContainer:{
        marginLeft:22,
    },
    title:{
        fontSize:16,
        color:"#fff",
        fontWeight:"500",
    },
    text:{
        fontSize:18,
        color:"#fff",
        fontWeight:"600",
    },
    optionsContainer:{
        backgroundColor:"#fff",
        marginHorizontal:20,
        marginTop:20,
        marginBottom:40,
        borderRadius:12,
    },
    optionsItem:{
        marginHorizontal:15,
    },
    optionsItemContent:{
        paddingVertical:20,
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
    },
    optionsItemTextContainer:{
        flexDirection:"row",
        alignItems:"center",
    },
    optionsSeparator:{
        borderTopWidth:1,
        borderColor:"#00000010",
    },
    optionsIcons:{
        width:optionsImgSize,
        height:optionsImgSize,
    },
    optionsText:{
        fontSize:16,
        color:"#0E0E0E",
        fontWeight:"500",
        marginLeft:15,
    },
    optionsArrow:{
        width:8,
        height:8,
        marginTop:2,
        borderTopWidth:1,
        borderRightWidth:1,
        borderColor:"#0F0E0E80",
        transform:[{rotate: "45deg"}],
    },
    logoutContainer:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        marginBottom:30,
    },
    version:{
        fontSize:12,
        color:"#000",
        fontWeight:"300",
        textAlign:"right",
        marginRight:20,
    },
})