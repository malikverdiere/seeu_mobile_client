import React, { useState, createContext, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    collectionGroup,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    getDoc,
} from '@react-native-firebase/firestore';

export const LoadingContext = createContext()
export const LoadingProvider = (props) => {
    const [loading, setLoading] = useState(false)
    const [keyboardVisible, setKeyboardVisible] = useState(false)

    return (<>
        <LoadingContext.Provider value={{
            loading,
            setLoading,
            keyboardVisible,
            setKeyboardVisible,
        }}>
            {props.children}
        </LoadingContext.Provider>
    </>)
}

export const UserContext = createContext()
export const UserProvider = (props) => {
    const currentUser = auth.currentUser

    const [user, setUser] = useState(null)
    const [shops, setShops] = useState([])
    const [shopsUpdate, setShopsUpdate] = useState(true)
    const [currentShops, setCurrentShops] = useState([])
    const [registeredShops, setRegisteredShops] = useState([])
    const [rewardsByShop, setRewardsByShop] = useState([])
    const [rewardsByShopUpdate, setRewardsByShopUpdate] = useState(true)
    const [gifts, setGifts] = useState([])
    const [giftsUpdate, setGiftsUpdate] = useState(true)
    const [modalNFCVisible, setModalNFCVisible] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [pubs, setPubs] = useState([])
    const [pubsUpdate, setPubsUpdate] = useState(true)
    const [chatRooms, setChatRooms] = useState([])
    const [tabBar_underline_active, setTabBar_underline_active] = useState(true)

    const clientCollection = collection(firestore, "Clients")
    const shopsCollection = collection(firestore, "Shops")
    const rewardCollection = collection(firestore, "Rewards")
    const pubsCollection = collection(firestore, "Pubs")
    
    const clientDocument = currentUser ? doc(clientCollection, currentUser.uid) : null
    const giftsCollection = clientDocument ? collection(clientDocument, "Gifts") : null
    const notificationsCollection = clientDocument ? collection(clientDocument, "Notifications") : null
    const registeredShopsCollection = clientDocument ? collection(clientDocument, "RegisteredShops") : null

    const tabBar_underline = useRef(new Animated.Value(0)).current

    const shopIdList = () => {
        let list = []
        registeredShops.map(async (shop) => {
            list.push(shop?.docData?.shopId)
        })
        return { shopListIds: list }
    }
    const { shopListIds } = shopIdList()

    const fetchShops = async () => {
        const q = query(shopsCollection, where("shopValid", "==", true))
        const querySnapshot = await getDocs(q)
        const data = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            docData: doc.data()
        }))
        setShops(data)
        setShopsUpdate(false)
    }

    const fetchPubs = async () => {
        if (user?.docData?.geolocation?.country_short) {
            const q = query(
                pubsCollection, 
                where("country_short", "==", user?.docData?.geolocation?.country_short),
                orderBy("id", "asc")
            )
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }))
            setPubs(data)
            setPubsUpdate(false)
        } else {
            const q = query(pubsCollection, orderBy("id", "asc"))
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }))
            setPubs(data)
            setPubsUpdate(false)
        }
    }

    const fetchGifts = async () => {
        const q = query(giftsCollection, where("isUsed", "==", false))
        const querySnapshot = await getDocs(q)
        const data = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            docData: doc.data()
        }))
        setGifts(data)
        setGiftsUpdate(false)
    }

    const fetchRewardsByShop = async () => {
        let allData = []
        const perChunk = 10

        const newShopListIds = shopListIds.reduce((resultArray, item, index) => {
            const chunkIndex = Math.floor(index / perChunk)

            if (!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = []
            }

            resultArray[chunkIndex].push(item)

            return resultArray
        }, [])

        for (let i = 0; i < newShopListIds.length; i++) {
            const q = query(
                rewardCollection, 
                where("shopId", "in", newShopListIds[i]),
                orderBy("shopId", "asc")
            )
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }))
            allData.push(...data)
        }

        setRewardsByShop(allData)
        setRewardsByShopUpdate(false)
    }

    const fetchCurrentShops = async () => {
        let allData = []

        for (let i = 0; i < registeredShops.length; i++) {
            if (registeredShops[i]?.docData?.shopId) {
                const docRef = doc(shopsCollection, registeredShops[i]?.docData?.shopId)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists) {
                    allData.push({
                        docId: docSnap.id,
                        docData: docSnap.data()
                    })
                }
            }
        }

        setCurrentShops(allData)
    }

    useEffect(() => {
        if (currentUser?.uid) {
            const docRef = doc(clientCollection, currentUser.uid)
            const unSub = onSnapshot(docRef, (doc) => {
                setUser({ docId: doc.id, docData: doc.data() })
            })
            return () => unSub()
        }
    }, [])

    useEffect(() => {
        const q = query(registeredShopsCollection)
        const unSub = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot) {
                let data = []
                querySnapshot.forEach((doc) => {
                    if (doc.exists) {
                        data.push({ docId: doc.id, docData: doc.data() })
                    }
                })
                setRegisteredShops(data)
            }
        })
        return () => unSub()
    }, [])

    useEffect(() => {
        const q = query(
            notificationsCollection, 
            where("isShow", "==", false),
            orderBy("creatAt", "desc")
        )
        const unSub = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot) {
                let data = []
                querySnapshot.forEach((doc) => {
                    if (doc.exists) {
                        data.push({ docId: doc.id, docData: doc.data() })
                    }
                })
                setNotifications(data)
            }
        })
        return () => unSub()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            pubsUpdate && fetchPubs()
        }, 1000)
        return () => clearTimeout(timer)
    }, [pubsUpdate, user?.docData?.geolocation?.city])

    useEffect(() => {
        shopsUpdate && fetchShops()
    }, [shopsUpdate])

    useEffect(() => {
        giftsUpdate && fetchGifts()
    }, [giftsUpdate])

    useEffect(() => {
        fetchCurrentShops()
    }, [registeredShops])

    useEffect(() => {
        (rewardsByShopUpdate && shopListIds.length > 0) && fetchRewardsByShop()
    }, [rewardsByShopUpdate, shopListIds])

    useEffect(() => {
        const q = query(
            collectionGroup(firestore, "ChatRoom"),
            where("clientId", "==", currentUser.uid)
        )
        const unSub = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot) {
                let data = []
                querySnapshot.forEach((doc) => {
                    if (doc.exists) {
                        data.push({ docId: doc.id, docData: doc.data() })
                    }
                })
                setChatRooms(data)
            }
        })
        return () => unSub()
    }, [])

    return (<>
        <UserContext.Provider value={{
            user,
            setUser,
            shops,
            setShops,
            shopsUpdate,
            setShopsUpdate,
            currentShops,
            registeredShops,
            setRegisteredShops,
            rewardsByShop,
            setRewardsByShop,
            rewardsByShopUpdate,
            setRewardsByShopUpdate,
            modalNFCVisible,
            setModalNFCVisible,
            pubs,
            setPubs,
            pubsUpdate,
            setPubsUpdate,
            notifications,
            setNotifications,
            gifts,
            setGifts,
            giftsUpdate,
            setGiftsUpdate,
            chatRooms,
            setChatRooms,
            tabBar_underline,
            tabBar_underline_active,
            setTabBar_underline_active,
        }}>
            {props.children}
        </UserContext.Provider>
    </>)
}

export const NoUserContext = createContext()
export const NoUserProvider = (props) => {
    const [user, setUser] = useState(null)
    const [shops, setShops] = useState([])
    const [shopsUpdate, setShopsUpdate] = useState(true)
    const [registeredShops, setRegisteredShops] = useState([])
    const [pubs, setPubs] = useState([])
    const [pubsUpdate, setPubsUpdate] = useState(true)
    const [tabBar_underline_active, setTabBar_underline_active] = useState(true)
    const [noUserlocation, setNoUserlocation] = useState({
        latitude: "",
        longitude: "",
        address: "",
        city: "",
        country: "",
        country_short: "",
        postalcode: "",
        region: "",
        department: "",
    })

    const currentUser = auth.currentUser;
    
    const clientCollection = collection(firestore, "Clients")
    const pubsCollection = collection(firestore, "Pubs")
    const shopsCollection = collection(firestore, "Shops")

    const tabBar_underline = useRef(new Animated.Value(0)).current

    const fetchShops = async () => {
        const q = query(shopsCollection, where("shopValid", "==", true))
        const querySnapshot = await getDocs(q)
        const data = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            docData: doc.data()
        }))
        setShops(data)
        setShopsUpdate(false)
    }

    const fetchPubs = async () => {
        if (noUserlocation?.country_short) {
            const q = query(
                pubsCollection,
                where("country_short", "==", noUserlocation?.country_short),
                orderBy("id", "asc")
            )
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }))
            setPubs(data)
            setPubsUpdate(false)
        } else {
            const q = query(pubsCollection, orderBy("id", "asc"))
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                docData: doc.data()
            }))
            setPubs(data)
            setPubsUpdate(false)
        }
    }

    useEffect(() => {
        if (currentUser?.uid) {
            const docRef = doc(clientCollection, currentUser.uid)
            const unSub = onSnapshot(docRef, (doc) => {
                setUser({ docId: doc.id, docData: doc.data() })
            })
            return () => unSub()
        }
    }, [])

    useEffect(() => {
        shopsUpdate && fetchShops()
    }, [shopsUpdate])

    useEffect(() => {
        pubsUpdate && fetchPubs()
    }, [pubsUpdate])

    return (<>
        <NoUserContext.Provider value={{
            user,
            setUser,
            shops,
            setShops,
            shopsUpdate,
            setShopsUpdate,
            registeredShops,
            setRegisteredShops,
            pubs,
            setPubs,
            pubsUpdate,
            setPubsUpdate,
            noUserlocation,
            setNoUserlocation,
            tabBar_underline,
            tabBar_underline_active,
            setTabBar_underline_active,
        }}>
            {props.children}
        </NoUserContext.Provider>
    </>)
}