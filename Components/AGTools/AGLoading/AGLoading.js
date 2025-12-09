import React, { } from 'react';
import { StyleSheet, View, Text, Modal, ActivityIndicator } from 'react-native';
import { primaryColor, secondaryColor } from '../AGGlobalVariables';
import { traductor } from '../Traductor';

export default function AGLoading({
    isLoading=false,
    progress="Chargement",
    color=secondaryColor,
    size="large",
    transparent=true,
    animationType="none",
    overlayStyle={},
    containerStyle={},
    textStyle={},
}){
    return (<>
        <Modal transparent={transparent} animationType={animationType} visible={isLoading} statusBarTranslucent>
            <View style={[styles.overlay,overlayStyle]} >
                <View style={[styles.container,containerStyle]} >
                    <ActivityIndicator size={size} color={color} animating={isLoading} />
                    <Text style={[styles.text,textStyle]}>{traductor(progress)}</Text>
                </View>
            </View>
        </Modal>
    </>)
}

const styles = StyleSheet.create({
    overlay:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#00000080",
    },
    container:{
        padding:13,
        borderRadius:13,
        backgroundColor:primaryColor,
    },
    text:{
        color:"#fff",
        textAlign:"center",
    },
})