import React, { useState } from 'react';
import { StyleSheet, View, Modal, Text, Pressable } from 'react-native';
import { primaryColor, traductor } from './AGTools';

export function ModalBox(){
    const [title, setTitle] = useState("")
    const [text, setText] = useState("")
    const [boxInfosVisible, setBoxInfosVisible] = useState(false)
    const [boxConfirmVisible, setBoxConfirmVisible] = useState(false)
    const [boxDeleteVisible, setBoxDeleteVisible] = useState(false)
    const [boxPhotoPickerVisible, setBoxPhotoPickerVisible] = useState(false)

    const openBoxInfos = (title,text) =>{
        setTitle(title)
        setText(text)
        setBoxInfosVisible(true)
    }
    const closeBoxInfos = (callBack) =>{
        setBoxInfosVisible(false)
        setTitle("")
        setText("")
        callBack && callBack()
    }
    const renderBoxInfos = (btnText,callBack) =>{
        return(<>
            <Modal transparent={true} animationType={"fade"} visible={boxInfosVisible} statusBarTranslucent>
                <View style={[styles.overlay]}>
                    <View style={[styles.box]}>
                        <View style={[styles.content]}>
                            {title !== "" && <Text style={[styles.title]}>{title}</Text>}
                            <Text style={[styles.text,{marginTop:title !== "" ? 10 : 0}]}>{text}</Text>
                        </View>
                        <View style={[]}>
                            <Pressable style={({pressed})=>[styles.btn,{opacity:pressed ? 0.5 : 1}]} onPress={()=>closeBoxInfos(callBack)}>
                                <Text style={[styles.btnText]}>{btnText !== "" ? btnText : traductor("OK")}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>)
    }

    const openBoxConfirm = (title,text) =>{
        setTitle(title)
        setText(text)
        setBoxConfirmVisible(true)
    }
    const closeBoxConfirm = () =>{
        setBoxConfirmVisible(false)
        setTitle("")
        setText("")
    }
    const onCancelBoxConfirm = () =>{
        closeBoxConfirm()
    }
    const onConfirmBoxConfirm = (callBack) =>{
        closeBoxConfirm()
        callBack && callBack()
    }
    const renderBoxConfirm = (btnTextCancel,btnText,callBack) =>{
        return(<>
            <Modal transparent={true} animationType={"fade"} visible={boxConfirmVisible} statusBarTranslucent>
                <View style={[styles.overlay]}>
                    <View style={[styles.box]}>
                        <View style={[styles.content]}>
                            {title !== "" && <Text style={[styles.title]}>{title}</Text>}
                            <Text style={[styles.text,{marginTop:title !== "" ? 10 : 0}]}>{text}</Text>
                        </View>
                        <View style={[styles.btnContainer]}>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnCancel,{flex:1,opacity:pressed ? 0.5 : 1}]} onPress={onCancelBoxConfirm}>
                                <Text style={[styles.btnText]}>{btnTextCancel !== "" ? btnTextCancel : traductor("Annuler")}</Text>
                            </Pressable>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{flex:1,opacity:pressed ? 0.5 : 1}]} onPress={()=>onConfirmBoxConfirm(callBack)}>
                                <Text style={[styles.btnText,{color:primaryColor}]}>{btnText !== "" ? btnText : traductor("Valider")}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>)
    }

    const openBoxDelete = (title,text) =>{
        setTitle(title)
        setText(text)
        setBoxDeleteVisible(true)
    }
    const closeBoxDelete = () =>{
        setBoxDeleteVisible(false)
        setTitle("")
        setText("")
    }
    const onCancelBoxDelete = () =>{
        closeBoxDelete()
    }
    const onConfirmBoxDelete = (callBack) =>{
        closeBoxDelete()
        callBack && callBack()
    }
    const renderBoxDelete = (btnTextCancel,btnText,callBack) =>{
        return(<>
            <Modal transparent={true} animationType={"fade"} visible={boxDeleteVisible} statusBarTranslucent>
                <View style={[styles.overlay]}>
                    <View style={[styles.box]}>
                        <View style={[styles.content]}>
                            {title !== "" && <Text style={[styles.title]}>{title}</Text>}
                            <Text style={[styles.text,{marginTop:title !== "" ? 10 : 0}]}>{text}</Text>
                        </View>
                        <View style={[]}>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={()=>onConfirmBoxDelete(callBack)}>
                                <Text style={[styles.btnText,{color:"#D40D0D"}]}>{btnText !== "" ? btnText : traductor("Supprimer")}</Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={[styles.box,styles.boxDelete]}>
                        <View style={[]}>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={onCancelBoxDelete}>
                                <Text style={[styles.btnText]}>{btnTextCancel !== "" ? btnTextCancel : traductor("Annuler")}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>)
    }

    const openBoxPhotoPicker = (title,text) =>{
        setTitle(title)
        setText(text)
        setBoxPhotoPickerVisible(true)
    }
    const closeBoxPhotoPicker = () =>{
        setBoxPhotoPickerVisible(false)
        setTitle("")
        setText("")
    }
    const onCancelBoxPhotoPicker = () =>{
        closeBoxPhotoPicker()
    }
    const onAction = (callBack) =>{
        closeBoxPhotoPicker()
        callBack && callBack()
    }
    const renderBoxPhotoPicker = (onTakePhoto,onChooseLibrary,onDeletePhoto) =>{
        return(<>
            <Modal transparent={true} animationType={"fade"} visible={boxPhotoPickerVisible} statusBarTranslucent>
                <View style={[styles.overlay]}>
                    <View style={[styles.box]}>
                        <View style={[styles.content]}>
                            {title !== "" && <Text style={[styles.title]}>{title}</Text>}
                            <Text style={[styles.text,{marginTop:title !== "" ? 10 : 0}]}>{text}</Text>
                        </View>
                        <View style={[]}>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={()=>onAction(onTakePhoto)}>
                                <Text style={[styles.btnText,{color:primaryColor}]}>{traductor("Prendre une photo")}</Text>
                            </Pressable>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={()=>onAction(onChooseLibrary)}>
                                <Text style={[styles.btnText,{color:primaryColor}]}>{traductor("Choisir dans ma galerie")}</Text>
                            </Pressable>
                            {onDeletePhoto && <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={()=>onAction(onDeletePhoto)}>
                                <Text style={[styles.btnText,{color:"#D40D0D"}]}>{traductor("Supprimer")}</Text>
                            </Pressable>}
                        </View>
                    </View>
                    <View style={[styles.box,styles.boxDelete]}>
                        <View style={[]}>
                            <Pressable style={({pressed})=>[styles.btn,styles.btnConfirm,{opacity:pressed ? 0.5 : 1}]} onPress={onCancelBoxPhotoPicker}>
                                <Text style={[styles.btnText]}>{traductor("Annuler")}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>)
    }

    return{
        boxInfosVisible,
        setBoxInfosVisible,
        openBoxInfos,
        renderBoxInfos,
        boxConfirmVisible,
        setBoxConfirmVisible,
        openBoxConfirm,
        renderBoxConfirm,
        boxDeleteVisible,
        setBoxDeleteVisible,
        openBoxDelete,
        renderBoxDelete,
        boxPhotoPickerVisible,
        setBoxPhotoPickerVisible,
        openBoxPhotoPicker,
        renderBoxPhotoPicker,
    }
}

const styles = StyleSheet.create({
    overlay:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#00000020",
    },
    box:{
        width:"70%",
        borderRadius:25,
        overflow:"hidden",
        backgroundColor:"#ffffff",
        justifyContent:"space-between",
    },
    boxDelete:{
        borderRadius:16,
        marginTop:10,
    },
    content:{
        padding:20,
    },
    title:{
        fontSize:16,
        color:"#222324",
        fontWeight:"600",
        textAlign:"center",
    },
    text:{
        fontSize:14,
        color:"#222324",
        fontWeight:"400",
        textAlign:"center",
    },
    btnContainer:{
        flexDirection:"row",
    },
    btn:{
        borderTopWidth:1,
        alignItems:"center",
        borderColor:"#E1E1E1",
        justifyContent:"center",
        backgroundColor:"#ffffff",
    },
    btnText:{
        fontSize:16,
        color:"#3498EF",
        fontWeight:"400",
        paddingVertical:14,
    },
    btnCancel:{
        borderRightWidth:0.5,
    },
    btnConfirm:{
        borderLeftWidth:0.5,
    },
})