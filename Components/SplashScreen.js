import { StyleSheet, View, Image, Modal, ImageBackground, Dimensions } from 'react-native';

const splashBg = require("./img/bg/splashBg.png")
const logo = require("./img/logo/logo.png")
const splashImg = require("./img/splashImg.png")

const SCREEN_WIDTH = Dimensions.get("window").width
const SCREEN_HEIGHT = Dimensions.get("window").height

export default function SplashScreen({
    isVisible=true,
    transparent=false,
}){
    return(<>
        <Modal transparent={transparent} animationType={"fade"} visible={isVisible} statusBarTranslucent>
            <ImageBackground style={[styles.overlay]} source={splashBg} resizeMode="cover">
                <View style={[styles.container]} >
                    <View style={[styles.logoContainer]}>
                        <Image source={logo} style={[styles.logo]} />
                    </View>
                    <Image source={splashImg} style={[styles.splashImg]} />
                </View>
            </ImageBackground>
        </Modal>
    </>)
}

const styles = StyleSheet.create({
    overlay:{
        flex:1,
        justifyContent:"center",
    },
    container:{
        flex:1,
        marginTop:SCREEN_HEIGHT * 0.2,
    },
    logoContainer:{
        alignItems:"center",
        justifyContent:"center",
    },
    logo:{
        maxWidth:92,
        maxHeight:97,
    },
    splashImg:{
        width:SCREEN_WIDTH,
        height:SCREEN_WIDTH,
        position:"absolute",
        bottom:0,
    },
})