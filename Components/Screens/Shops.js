import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, UserContext, boxShadowInput, goToScreen, primaryColor, shopTypes, statusBarHeigth, traductor } from '../AGTools';
import { RefreshControl } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import { ModalBox } from '../ModalBox';
import NFCRead from '../NFCRead';

const defaultShopLogo = require("../img/logo/defaultImg.png")
const filterImg = require("../img/btn/filter.png")
const arrowBackBgImg = require("../img/arrow/arrowBackBg.png")

const widthW = Dimensions.get("window").width
const heightS = Dimensions.get("screen").height
const headerImgSize = 40
const squareSize = 20
const numberColoumn = 2
const itemSize = widthW

export default function Shops({
    navigation,
}){
    const {
        user,
        currentShops,
        setShopsUpdate,
    } = useContext(UserContext)

    const [shopType, setShopType] = useState({id: "0-default",text: ""})
    const [filterVisible, setFilterVisible] = useState(false)

    const typeDocData = []
    currentShops.map((shop)=>{
        shopTypes.map((type)=>{
            if(type?.id === shop?.docData?.shopType?.id || type?.docData?.id === "0-default"){
                typeDocData.push(type)
            }
        })
    })
    typeDocData.sort((a, b)=>{
        if(a.id < b.id) { return -1 }
        if(a.id > b.id) { return 1 }
        return 0;
    })
    let typesExist = typeDocData.filter((x, i) => typeDocData.indexOf(x) === i)

    const shopsFilter = currentShops.filter((shop)=>{
        if(shopType?.id === "0-default" || shopType === null){
            return shop
        } else {
            return shop?.docData?.shopType?.id === shopType?.id
        }
    })

    const isFocused = useIsFocused()
    const modalBox = ModalBox()

    const onRefresh = () =>{
        setShopsUpdate(true)
    }

    const onBack = () =>{
        goToScreen(navigation,"goBack")
    }

    const onPressShop = (shopId)=>{
        if(user){
            goToScreen(navigation,"Shop",{shopId:shopId})
        } else {
            modalBox.openBoxConfirm("",traductor("Vous devez avoir un compte pour accéder à ce contenu"))
        }
    }

    const onConfirm = ()=>{
        goToScreen(navigation,"Compte")
    }

    const onChangeFilterVisible = (e)=>{
        if(e === 0){
            setFilterVisible(false)
        }
        if(e === 1){
            setFilterVisible(true)
        }
    }

    const onPressItemFilter = (type) =>{
        if(type?.id === shopType?.id){
            setShopType({id: "0-default",text: ""})
        } else {
            setShopType(type)
        }
    }

    useEffect(()=>{
        isFocused && StatusBar.setBarStyle("light-content", true)
    },[isFocused])

    return(<View style={[styles.viewContainer]}>
        
        <SafeAreaView />
        <View style={[styles.headerBg,{height:heightS * 0.3}]} />

        <Header
            title={traductor("Mes boutiques")}
            titleStyle={[styles.headerTitle]}
            containerStyle={[{marginTop:statusBarHeigth}]}
            titleContainerStyle={[{alignItems:"center"}]}
            imgRight={filterImg}
            imgRightStyle={[styles.headerImg]}
            rightAction={()=>onChangeFilterVisible(1)}
            imgLeft={arrowBackBgImg}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onBack}
        />

        <FlatList
            data={shopsFilter}
            contentContainerStyle={[{gap:20,paddingHorizontal:20}]}
            keyExtractor={(section, index)=>index.toString()}
            renderItem={({item,index}) => {
                const shopImg = item?.docData?.logo_Shop_Img && (item?.docData?.shopValid === true) ? item?.docData?.logo_Shop_Img : Image.resolveAssetSource(defaultShopLogo).uri

                return(<TouchableOpacity style={[styles.item,boxShadowInput]} onPress={()=>onPressShop(item?.docData?.userId)}>
                    <Image style={[styles.itemImg]} source={{uri:shopImg}}/>
                    <Text style={[styles.itemTitle]} numberOfLines={2}>{item?.docData?.shopName}</Text>
                </TouchableOpacity>)
            }}
            refreshControl={<RefreshControl refreshing={currentShops.length <= 0 ? true : false} onRefresh={onRefresh} />}
            ListFooterComponent={<View style={[{marginBottom:20}]} />}
            key={numberColoumn}
            numColumns={numberColoumn}
            columnWrapperStyle={[{gap:20}]}
        />

        {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}

        <Modal animationType={"slide"} visible={filterVisible} statusBarTranslucent>
            <View style={[styles.headerBg,{height:heightS * 0.3}]} />
            <Header
                title={traductor("Filtre")}
                containerStyle={[{marginTop:30}]}
                titleStyle={[styles.headerTitle,{left:-headerImgSize * 0.5}]}
                titleContainerStyle={[{overflow:"hidden"}]}
                imgLeft={arrowBackBgImg}
                imgLeftStyle={[styles.headerImg]}
                leftAction={()=>onChangeFilterVisible(0)}
            />
            <View style={[styles.filterContainer,boxShadowInput]}>
                <ScrollView style={[styles.filterScroll]}>
                    {typesExist.map((type, index)=>{
                        return(<TouchableOpacity style={[styles.filterItem]} key={index} onPress={()=>onPressItemFilter(type)}>
                            <View style={[styles.filterSelect]}>
                                <Text style={[styles.filterItemText]}>{index === 0 ? traductor("Aucun filtre") : type?.text}</Text>
                                <View style={[styles.filterSquare,{backgroundColor:type?.id === shopType?.id ? primaryColor : "#fff"}]}>
                                    <View style={[styles.filterSquareCheck]}/>
                                </View>
                            </View>
                            <View style={[styles.filterSeparator]}/>
                        </TouchableOpacity>)
                    })}
                </ScrollView>

                <TouchableOpacity style={[styles.filterBtn]} onPress={()=>onChangeFilterVisible(0)}>
                    <Text style={[styles.filterBtnText]}>{traductor("Appliquer")}</Text>
                </TouchableOpacity>
            </View>
        </Modal>

        {modalBox.renderBoxInfos("")}
        {modalBox.renderBoxConfirm(traductor("Ok"),traductor("Me connecter"),onConfirm)}
    </View>)
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    headerBg:{
        backgroundColor:primaryColor,
        borderBottomLeftRadius:37,
        borderBottomRightRadius:37,
        position:"absolute",
        left:0,
        right:0,
    },
    headerTitle:{
        fontSize:26,
        fontWeight:"600",
    },
    headerImg:{
        width:headerImgSize,
        height:headerImgSize,
    },
    rowTitle:{
        fontSize:17,
        color:"#0F0E0E",
        fontWeight:"600",
        marginTop:20,
        marginVertical:10,
        marginLeft:20,
    },
    item:{
        flex:1,
        padding:10,
        borderRadius:8,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"#fff",
        height:(itemSize - 40) * 0.5,
        maxWidth:(itemSize - 60) * 0.5,
    },
    itemImg:{
        width:(widthW - 40) * 0.3,
        height:(widthW - 40) * 0.3,
    },
    itemTitle:{
        marginTop:4,
        fontSize:14,
        color:"#1D1D1B",
        fontWeight:"500",
    },
    filterContainer:{
        backgroundColor:"#fff",
        flex:1,
        marginHorizontal:20,
        marginBottom:40,
        borderRadius:12,
    },
    filterScroll:{
        flex:1,
        backgroundColor:"#fff",
        borderTopLeftRadius:12,
        borderTopRightRadius:12,
    },
    filterBtn:{
        backgroundColor:primaryColor,
        borderRadius:8,
        padding:15,
        margin:15,
    },
    filterBtnText:{
        fontSize:14,
        color:"#fff",
        fontWeight:"500",
        textAlign:"center",
    },
    filterSquare:{
        width:squareSize,
        height:squareSize,
        borderWidth:1,
        borderColor:"#00000020",
        borderRadius:4,
        backgroundColor:"#fff",
        alignItems:"center",
        justifyContent:"center",
    },
    filterSquareCheck:{
        width:squareSize * 0.4,
        height:squareSize * 0.3,
        bottom:squareSize * 0.1,
        borderTopWidth:1,
        borderRightWidth:1,
        borderColor:"#fff",
        transform:[{rotate:"135 deg"}],
    },
    filterItem:{
        marginHorizontal:15,
    },
    filterItemText:{
        fontSize:14,
        color:"#0E0E0E",
        fontWeight:"500",
    },
    filterSelect:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        paddingVertical:20,
    },
    filterSeparator:{
        borderTopWidth:1,
        borderColor:"#00000010",
    },
})