import React, { useContext, useEffect, useState } from 'react';
import { FlatList, Image, Platform, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Header, KeyboardHeight, UserContext, goToScreen, primaryColor, statusBarHeigth } from '../AGTools';
import { auth, firestore, onHttpsCallable } from '../../firebase.config';
import {
    collection,
    doc,
    query,
    orderBy,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
    onSnapshot,
} from '@react-native-firebase/firestore';
import { ModalBox } from '../ModalBox';
import Animated, { FadeIn } from 'react-native-reanimated';

const arrowBack = require("../img/arrow/arrowBackBg.png")
const send_img = require("../img/btn/send.png")
const check_gray = require("../img/check_gray.png")
const check_purple = require("../img/check_purple.png")

const send_img_size = 56
const header_img_size = 40
const check_size = 20
const color_contact = "#6857E50D"

export default function Chat({
    navigation,
    route,
}) {
    const {
        user,
        shops,
    } = useContext(UserContext)

    const currentUser = auth.currentUser
    const clientId = route?.params?.clientId
    const clientName = `${user?.docData?.lastName} ${user?.docData?.firstName}`
    const shopId = route?.params?.shopId
    const shopName = route?.params?.shopName
    const shopCollection = collection(firestore, "Shops")
    const shopDocument = doc(shopCollection, shopId)
    const chatRoomCollection = collection(shopDocument, "ChatRoom")

    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [chatRoom, setChatRoom] = useState(null)

    const modalBox = ModalBox()
    const current_shop = shops.filter((shop) => {
        return shop?.docData?.userId === shopId
    })

    const onBack = () => {
        update_status_client(3)
        goToScreen(navigation, "goBack")
    }

    const send_notification = () => {
        const sendNotification = onHttpsCallable('chatNotification');

        sendNotification({
            tokens: current_shop[0]?.docData?.tokensFCM,
            title: clientName,
            body: message,
            data: {
                clientId: clientId,
                shopId: shopId,
                type: "chat",
            },
        })
    }

    const update_status_shop = (status) => {
        const chatRoomRef = doc(chatRoomCollection, `chatRoom_${clientId}`);
        updateDoc(chatRoomRef, {
            status_shop: status,
        });
    }

    const update_status_client = (status) => {
        const chatRoomRef = doc(chatRoomCollection, `chatRoom_${clientId}`);
        updateDoc(chatRoomRef, {
            status_client: status,
        });
    }

    const addMessage = () => {
        update_status_shop(1);
        const chatRef = collection(doc(chatRoomCollection, `chatRoom_${clientId}`), "Chat");

        addDoc(chatRef, {
            createAt: new Date(),
            contactId: clientId,
            id: new Date().getTime().toString(),
            message: message,
        }).then(() => {
            update_status_shop(2);
            const chatRoomRef = doc(chatRoomCollection, `chatRoom_${clientId}`);
            updateDoc(chatRoomRef, {
                last_message_client: message,
                last_message: message,
                last_message_client_date: new Date(),
            });
            send_notification();
        }).catch((err) => {
            return;
        });
    }

    const update_chat_room = async () => {
        try {
            const chatRoomRef = doc(chatRoomCollection, `chatRoom_${clientId}`);
            const chatRoomSnap = await getDoc(chatRoomRef);

            if (!chatRoomSnap.exists) {
                await setDoc(chatRoomRef, {
                    createAt: new Date(),
                    clientId: clientId,
                    shopId: shopId,
                    shopName: shopName,
                    clientName: clientName,
                    status_shop: 1,
                    status_client: 3,
                    last_message_client: message,
                    last_message: message,
                });
                addMessage();
            } else {
                addMessage();
            }
        } catch (error) {
            modalBox.openBoxInfos("Echec de la création du chat", error.message);
        }
    }

    const sendMessage = async () => {
        if (message.trim().length > 0) {
            const newMessage = {
                id: new Date().getTime().toString(),
                message,
            }

            setMessages((prevState) => [newMessage, ...prevState])

            update_chat_room()

            setMessage("")
        }
    }

    const renderCheck = () => {
        if (chatRoom?.docData?.status_shop === 3) {
            return (<View style={[styles.checksContainer]}>
                <View style={[{ flexDirection: "row" }]}>
                    <Image style={[styles.checks, styles.checksL]} source={check_purple} />
                    <Image style={[styles.checks, styles.checksR]} source={check_purple} />
                </View>
            </View>)
        } else {
            return (<View style={[styles.checksContainer]}>
                <View style={[{ flexDirection: "row" }]}>
                    {(chatRoom?.docData?.status_shop === 1 || chatRoom?.docData?.status_shop === 2) && <Image style={[styles.checks, styles.checksL, chatRoom?.docData?.status_shop === 1 && { marginRight: 0 }]} source={check_gray} />}
                    {(chatRoom?.docData?.status_shop === 2) && <Image style={[styles.checks, styles.checksR]} source={check_gray} />}
                </View>
            </View>)
        }
    }

    useEffect(() => {
        const chatRoomRef = doc(chatRoomCollection, `chatRoom_${clientId}`);
        const unsubscribe = onSnapshot(chatRoomRef, (doc) => {
            setChatRoom({ docId: doc.id, docData: doc.data() });
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const chatRef = collection(doc(chatRoomCollection, `chatRoom_${clientId}`), "Chat");
        const q = query(chatRef, orderBy("createAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot) {
                const data = querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    docData: doc.data()
                }));
                setMessages(data);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        update_status_client(3)
    }, [])

    return (<View style={[styles.viewContainer]}>

        <SafeAreaView style={{ backgroundColor: primaryColor }} />
        <View style={[{ height: statusBarHeigth, backgroundColor: primaryColor }]} />

        <Header
            title={`${shopName}`}
            titleStyle={[styles.headerTitle, { marginRight: header_img_size }]}
            containerStyle={[styles.headerContainer]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onBack}
        />

        <View style={[styles.chatContainer]}>
            <FlatList
                data={messages}
                inverted
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {

                    return (<View style={[{ marginBottom: 12 }]} key={item?.docData?.id}>
                        <Animated.Text
                            entering={FadeIn}
                            style={[
                                styles.message, item?.docData?.contactId === currentUser.uid
                                    ? styles.myMessage
                                    : styles.contactMessage,
                                Platform.OS === "ios" && { overflow: "hidden" }
                            ]}>
                            {item?.docData?.message}
                        </Animated.Text>
                        {(index === 0 && item?.docData?.contactId === currentUser.uid) && renderCheck()}
                    </View>)
                }}
            />

            <View style={[styles.footer]}>
                <TextInput
                    style={[styles.input]}
                    placeholder={"Type your message"}
                    placeholderTextColor={"#8C91A2"}
                    onChangeText={setMessage}
                    value={message}
                />
                <TouchableOpacity style={[styles.send]} activeOpacity={0.7} onPress={sendMessage}>
                    <Image style={[styles.sendIcon]} source={send_img} />
                </TouchableOpacity>
            </View>

            {Platform.OS === "ios" && <KeyboardHeight />}
        </View>

        {modalBox.renderBoxInfos("")}

    </View>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        backgroundColor: "#FFFAF3",
    },
    chatContainer: {
        flex: 1,
        backgroundColor: "#FFFAF3",
        padding: 20,
    },
    headerContainer: {
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    headerImg: {
        width: header_img_size,
        height: header_img_size,
    },
    message: {
        padding: 16,
        borderRadius: 12,
    },
    myMessage: {
        color: "#ffffff",
        backgroundColor: primaryColor,
        alignSelf: "flex-end",
        borderTopRightRadius: 0,
    },
    contactMessage: {
        color: "#8C91A2",
        backgroundColor: color_contact,
        alignSelf: "flex-start",
        borderTopLeftRadius: 0,
    },
    input: {
        flex: 1,
        height: 56,
        padding: 16,
        backgroundColor: color_contact,
        borderRadius: 12,
    },
    send: {
        height: send_img_size,
        width: send_img_size,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center"
    },
    sendIcon: {
        height: send_img_size,
        width: send_img_size,
    },
    checksContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 12,
    },
    checks: {
        width: check_size,
        height: check_size,
    },
    checksL: {
        marginRight: -check_size / 2,
    },
    checksR: {

    },
    footer: {
        flexDirection: "row",
        gap: 7,
    },
})