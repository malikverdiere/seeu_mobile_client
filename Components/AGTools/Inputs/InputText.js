import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Image, Pressable } from 'react-native';
import { traductor } from '../Traductor';

export default function InputText({
    label="",
    placeholder="",
    defaultValue="",
    height=50,
    container={},
    labelContainerStyle={},
    labelStyle={},
    labelStarStyle={},
    inputContainerStyle={},
    inputStyle={},
    errorStyle={},
    imgLeftContainerStyle={},
    imgLeftStyle={},
    imgRightContainerStyle={},
    imgRightStyle={},
    imgLeft=false,
    imgRight=false,
    imgSecureHide=false,
    imgSecureVisible=false,
    isRequired=true,
    starRequired=true,
    placeholderTextColor="#BCBCBC",
    textAlign="left",
    textAlignVertical="center",
    keyboardType="default",
    textContentType="none",
    autoCapitalize="sentences",
    autoCorrect=false,
    maxLength=99999,
    isSecure=false,
    isNum=false,
    isPhone=false,
    isEmail=false,
    isArea=false,
    inputAction,
    leftAction,
    rightAction,
    editable=true,
    onPressIn,
    enterKeyHint,
}){
    const [value, setValue] = useState(defaultValue)
    const [errorMessage, setErrorMessage] = useState("")
    const [securetextentry, setSecuretextentry] = useState(isSecure)

    const onChangeText = (e) =>{
        setValue(e)
        inputAction && inputAction(e)
    }

    const requiredField = () =>{
        if(value === ""){
            setErrorMessage("Ce champ est requis")
        } else {
            setErrorMessage("")
        }
    }

    return(<View style={[styles.container,container]}>
        {label !== "" && <>
            <View style={[styles.labelContainer,labelContainerStyle]}>
                <Text style={[styles.label,labelStyle]}>{label}</Text>
                {starRequired && <Text style={[styles.label,labelStyle,labelStarStyle]}>{label !== "" && isRequired ? " *" : ""}</Text>}
            </View>
        </>}
        <View style={[styles.inputContainerStyle,inputContainerStyle]}>
            {imgLeft && <>
                <Pressable style={({pressed})=>[styles.imgContainer,{height,opacity:pressed && leftAction ? 0.5 : 1},imgLeftContainerStyle]} onPress={leftAction}>
                    <Image style={[styles.img,imgLeftStyle]} source={imgLeft} resizeMode={"contain"} />
                </Pressable>
            </>}
            <TextInput
                placeholder={placeholder}
                value={value}
                style={[styles.input,{height:isArea ? 100 : height},inputStyle]}
                placeholderTextColor={placeholderTextColor}
                textAlign={textAlign}
                textAlignVertical={isArea ? "top" : textAlignVertical}
                keyboardType={isNum || isPhone ? "phone-pad" : (isEmail ? "email-address" : keyboardType)}
                textContentType={isPhone ? "telephoneNumber" : (isEmail ? "emailAddress" : textContentType)}
                autoCapitalize={isNum || isPhone || isEmail || isSecure ? "none" : autoCapitalize}
                autoCorrect={autoCorrect}
                multiline={isArea}
                maxLength={maxLength}
                secureTextEntry={securetextentry}
                caretHidden={false}
                editable={editable}
                onBlur={requiredField}
                onChangeText={(e) => onChangeText(e)}
                onPressIn={onPressIn}
                enterKeyHint={enterKeyHint || "done"}
            />
            {(imgRight || (isSecure && imgSecureHide && imgSecureVisible)) && <>
                <Pressable style={({pressed})=>[styles.imgContainer,{height,opacity:pressed && rightAction ? 0.5 : 1},imgRightContainerStyle]} onPress={()=>isSecure ? setSecuretextentry(!securetextentry) : rightAction()}>
                    <Image style={[styles.img,imgRightStyle]} source={(isSecure && imgSecureHide && imgSecureVisible) ? (securetextentry ? imgSecureHide : imgSecureVisible) : imgRight} resizeMode={"contain"} />
                </Pressable>
            </>}
        </View>
        <Text style={[styles.error,errorStyle]}>{isRequired ? traductor(errorMessage) : ""}</Text>
    </View>)
}

const styles = StyleSheet.create({
    container:{

    },
    labelContainer:{
        flexDirection:"row",
        backgroundColor:"#fff",
    },
    label:{
        fontSize:14,
        color:"#000",
    },
    inputContainerStyle:{
        flexDirection:"row",
    },
    imgContainer:{
        padding:10,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#fff",
        borderColor:"#000",
        borderWidth:1,
    },
    img:{
        width:22,
        height:22,
    },
    input:{
        backgroundColor:"#fff",
        borderColor:"#000",
        borderWidth:1,
        flex:1,
    },
    error:{
        color:"red",
        fontSize:10,
    },
})