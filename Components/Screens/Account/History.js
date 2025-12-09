import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Header, primaryColor, statusBarHeigth, goToScreen, secondaryColor, boxShadowInput, traductor, getCurrentDate } from '../../AGTools';
import DonutIndicator from '../../DonutIndicator';
import { auth, firestore } from '../../../firebase.config';
import {
    collection,
    doc,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
} from '@react-native-firebase/firestore';

const arrowBack = require("../../img/arrow/arrowBackBg.png")
const giftImg = require("../../img/birthday.png")
const comeBackImg = require("../../img/comeBack.png")

const heightS = Dimensions.get("screen").height
const headerImgSize = 40
const giftIconSize = 80

export default function History({
    navigation,
}) {
    const limitData = 12
    const currentUser = auth.currentUser
    const clientCollection = collection(firestore, "Clients")
    const clientDocument = doc(clientCollection, currentUser.uid)
    const historyCollection = collection(clientDocument, "RewardsHistory")

    const [historyData, setHistoryData] = useState([])
    const [lastVisible, setLastVisible] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isListEnd, setIsListEnd] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const getHistoryData = async () => {
        if (!loading && !isListEnd) {
            setLoading(true)
            try {
                let historyQuery;
                if (lastVisible) {
                    historyQuery = query(
                        historyCollection,
                        orderBy("creatAt", "desc"),
                        startAfter(lastVisible),
                        limit(limitData)
                    );
                } else {
                    historyQuery = query(
                        historyCollection,
                        orderBy("creatAt", "desc"),
                        limit(limitData)
                    );
                }

                const snapshot = await getDocs(historyQuery);
                
                if (snapshot.empty) {
                    setIsListEnd(true);
                    setLoading(false);
                    return;
                }

                const newData = snapshot.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                }));

                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHistoryData(prevData => [...prevData, ...newData]);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching history:", error);
                setLoading(false);
            }
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        setHistoryData([]);
        setLastVisible(null);
        setIsListEnd(false);
        await getHistoryData();
        setRefreshing(false);
    }

    useEffect(() => {
        getHistoryData();
    }, []);

    return (<View style={[styles.viewContainer]}>
        <SafeAreaView />
        <View style={[styles.headerBg, { height: heightS * 0.3 }]} />

        <Header
            title={traductor("Historiques")}
            titleStyle={[styles.headerTitle]}
            containerStyle={[{ marginTop: statusBarHeigth }]}
            titleContainerStyle={[{ marginRight: headerImgSize }]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={() => goToScreen(navigation, "goBack")}
        />

        <FlatList
            data={historyData}
            keyExtractor={(item, index) => index.toString()}
            onEndReached={getHistoryData}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReachedThreshold={0.01}
            scrollEventThrottle={150}
            ListFooterComponentStyle={{ justifyContent: "center" }}
            ListFooterComponent={() => {
                if (!loading && historyData.length === 0) {
                    return null;
                }
                if (!isListEnd) {
                    return <ActivityIndicator style={{ marginBottom: 30 }} size="large" color={primaryColor} animating={loading} />;
                }
                return null;
            }}
            style={[styles.itemList, boxShadowInput]}
            ItemSeparatorComponent={<View style={[styles.itemSeparator]} />}
            renderItem={({ item, index }) => {
                const creatAt = getCurrentDate(new Date(item?.docData?.creatAt?.seconds * 1000))

                return (<View style={[styles.item]}>
                    {item?.docData?.giftType ?
                        <Image style={[styles.giftIcon]} source={item?.docData?.giftType === "lastVisit" ? comeBackImg : giftImg} /> :
                        <DonutIndicator
                            defaultValue={item?.docData?.reward?.points || 0}
                            numColor={"#000000CC"}
                            numStyle={[{ fontSize: 18 }]}
                            textColor={"#000000CC"}
                            cursor={false}
                            max={item?.docData?.reward?.points}
                            gradient1={secondaryColor}
                            gradient2={primaryColor}
                            gradientEnd1={secondaryColor}
                            gradientEnd2={primaryColor}
                            radius={40}
                            strokeWidth={8}
                            duration={0}
                            delay={0}
                        />
                    }
                    <View style={[styles.itemContent]}>
                        <Text style={[styles.itemTitle]}>{item?.docData?.shopName}</Text>
                        <Text style={[styles.itemDescription]}>{item?.docData?.reward?.description}</Text>
                        <Text style={[styles.itemDate]}>{traductor("Utilisé le :")} {creatAt.day}/{creatAt.month}/{creatAt.year} {creatAt.hours}:{creatAt.minutes}</Text>
                    </View>
                </View>)
            }}
        />
    </View>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerBg: {
        backgroundColor: primaryColor,
        borderBottomLeftRadius: 37,
        borderBottomRightRadius: 37,
        position: "absolute",
        left: 0,
        right: 0,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "600",
    },
    headerImg: {
        width: headerImgSize,
        height: headerImgSize,
    },
    itemList: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 30,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
    },
    itemContent: {
        flex: 1,
        marginLeft: 15,
    },
    itemTitle: {
        fontSize: 14,
        color: "#1D1D1B",
        fontWeight: "600",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    itemDescription: {
        fontSize: 14,
        color: "#8C91A2",
        fontWeight: "500",
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 12,
        color: "#B8BBC6",
        fontWeight: "500",
        marginBottom: 4,
    },
    itemSeparator: {
        borderTopWidth: 1,
        marginHorizontal: 20,
        borderColor: "#00000010",
    },
    giftIcon: {
        width: giftIconSize,
        height: giftIconSize,
        alignItems: "center",
    },
})