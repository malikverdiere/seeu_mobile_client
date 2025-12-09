import React, { } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { primaryColor } from '../AGGlobalVariables';

export default function Header({
    title="Title",
    height=100,
    containerStyle={},
    titleContainerStyle={},
    titleStyle={},
    imgLeftContainerStyle={},
    imgRightContainerStyle={},
    imgLeftStyle={},
    imgRightStyle={},
    imgLeft=false,
    imgRight=false,
    leftAction,
    rightAction,
}){
    return(<View style={[styles.container,{height},containerStyle]}>
        <Pressable style={({pressed})=>[styles.imgContainer,{height,opacity:pressed && leftAction ? 0.5 : 1},imgLeftContainerStyle]} onPress={leftAction}>
            {imgLeft && <>
                <Image style={[styles.img,imgLeftStyle]} source={imgLeft} resizeMode={"contain"} />
            </>}
        </Pressable>
        <View style={[styles.titleContainer,titleContainerStyle]}>
            <Text style={[styles.title,titleStyle]}>{title}</Text>
        </View>
        <Pressable style={({pressed})=>[styles.imgContainer,{height,opacity:pressed && rightAction ? 0.5 : 1},imgRightContainerStyle]} onPress={rightAction}>
            {imgRight && <>
                <Image style={[styles.img,imgRightStyle]} source={imgRight} resizeMode={"contain"} />
            </>}
        </Pressable>
    </View>)
}

const styles = StyleSheet.create({
    container:{
        flexDirection:"row",
        justifyContent:"space-between",
        backgroundColor:primaryColor,
        borderBottomLeftRadius:48,
        borderBottomRightRadius:48,
        paddingHorizontal:20,
    },
    imgContainer:{
        alignItems:"center",
        justifyContent:"center",
    },
    img:{
        width:22,
        height:22,
    },
    titleContainer:{
        flex:1,
        justifyContent:"center",
    },
    title:{
        color:"#fff",
        fontSize:16,
        fontWeight:"600",
        textAlign:"center",
        textTransform:"none",
    },
})