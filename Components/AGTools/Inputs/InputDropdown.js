import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, FlatList, Modal } from 'react-native';
import { traductor } from '../Traductor';

const imgRightDefault = require("../../img/arrow/arrowDropdown.png")

export default function InputDropdown({
    data=[{id:"aucune-donnee",text:"Aucune donnée"}],
    label="",
    defaultValue="",
    placeholder="",
    animType="fade",
    height=50,
    labelContainerStyle={},
    labelStyle={},
    labelStarStyle={},
    inputContainerStyle={},
    inputStyle={},
    overlayStyle={},
    listContainerStyle={},
    itemListContainerStyle={},
    itemListStyle={},
    starRequired=false,
    imgRight=false,
    imgRightStyle=false,
    isRequired=false,
    isTransparent=true,
    statusBarTranslucent=true,
    action,
    translation=true,
}){
    const [visible, setVisible] = useState(false)
    const [selected, setSelected] = useState(undefined)

    const onPress = () =>{
        setVisible(!visible)
    }

    const onItemPress = (item, index) => {
        setSelected(item.text)
        action && action(item)
        setVisible(false)
    }

    const renderItem = ({item, index}) => (
        <Pressable style={({pressed})=>[styles.itemListContainerStyle,{opacity:pressed ? 0.5 : 1},itemListContainerStyle]} onPress={()=>onItemPress(item, index)}>
            {translation === true && <Text style={[styles.itemListStyle,itemListStyle]}>{traductor(item.text)}</Text>}
            {translation === false && <Text style={[styles.itemListStyle,itemListStyle]}>{item.text}</Text>}
        </Pressable>
    )

    const renderModal = () => {
        if (visible) {
            return (<>
                <Modal visible={visible} transparent={isTransparent} statusBarTranslucent={statusBarTranslucent} animationType={animType} supportedOrientations={[
                    'portrait', 
                    'portrait-upside-down', 
                    'landscape', 
                    'landscape-left', 
                    'landscape-right'
                ]}>
                    <Pressable style={[styles.overlay,overlayStyle]} onPress={onPress}>
                        <View style={[styles.listContainer,listContainerStyle]}>
                            <FlatList
                                data={data}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        </View>
                    </Pressable>
                </Modal>
            </>)
        }
    }

    return(<>
        <View>
            {label !== "" && <>
                <View style={[styles.labelContainer,labelContainerStyle]}>
                    {translation === true && <Text style={[styles.label,labelStyle]}>{traductor(label)}</Text>}
                    {translation === false && <Text style={[styles.label,labelStyle]}>{label}</Text>}
                    {starRequired && <Text style={[styles.label,labelStyle,labelStarStyle]}>{label !== "" && isRequired ? " *" : ""}</Text>}
                </View>
            </>}
            <View style={[styles.inputContainerStyle,inputContainerStyle]}>
                <Pressable style={({pressed})=>[styles.input,{height,opacity:pressed ? 0.5 : 1},inputStyle]} onPress={onPress}>
                    {renderModal()}
                    {translation === true && <Text style={[{color:!selected && !defaultValue ? "#0000004d" : "#000000"}]}>{selected ? traductor(selected) : (defaultValue ? traductor(defaultValue) : traductor(placeholder))}</Text>}
                    {translation === false && <Text style={[{color:!selected && !defaultValue ? "#0000004d" : "#000000"}]}>{selected ? selected : (defaultValue ? defaultValue : placeholder)}</Text>}
                    <Image style={[styles.img,{transform:[{rotate:visible ? "180deg" : "0deg"}]},imgRightStyle]} source={imgRight ? imgRight : imgRightDefault} resizeMode={"contain"} />
                </Pressable>
            </View>
        </View>
    </>)
}

const styles = StyleSheet.create({
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
    input:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        backgroundColor:"#fff",
        borderColor:"#000",
        paddingHorizontal:6,
        borderWidth:1,
        flex:1,
    },
    img:{
        maxWidth:12,
        maxHeight:10,
        marginRight:10,
    },
    overlay:{
        width:"100%",
        height:"100%",
        backgroundColor:"#00000030",
        alignItems:"center",
        justifyContent:"center",
        paddingHorizontal:"10%",
    },
    listContainer:{
        backgroundColor:"#fff",
        width:"100%",
        maxHeight:250,
        shadowColor:"#000",
        borderRadius:8,
        shadowOffset: {
            width:0,
            height:2,
        },
        shadowOpacity:0.1,
        shadowRadius:2,
        elevation:5,
    },
    itemListContainerStyle:{
        padding:14,
        borderBottomWidth:1,
        borderColor:"#00000010",
    },
    itemListStyle:{
        textAlign:"center",
        color:"#000",
    },
})