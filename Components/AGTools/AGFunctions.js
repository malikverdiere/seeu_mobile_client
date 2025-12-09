import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const delay = ms => new Promise(res => setTimeout(res, ms))

export const getCurrentDate = (date) =>{
    let newDate = date ? date : new Date()
    let day = newDate.getDate()
    let month = newDate.getMonth() + 1
    let year = newDate.getFullYear()
    let hours = newDate.getHours()
    let minutes = newDate.getMinutes()
    let seconds = newDate.getSeconds()
    year = `${year}`
    month = month < 10 ? `0${month}` : `${month}`
    day = day < 10 ? `0${day}` : `${day}`
    hours = hours < 10 ? `0${hours}` : `${hours}`
    minutes = minutes < 10 ? `0${minutes}` : `${minutes}`
    seconds = seconds < 10 ? `0${seconds}` : `${seconds}`
    return {year,month,day,hours,minutes,seconds}
}

export const goToScreen = (navigation, screenName, state) =>{
    if(navigation){
        if(screenName !== "goBack"){
            if(state){
                navigation.navigate(screenName, state)
            } else {
                navigation.navigate(screenName)
            }
        } else {
            navigation.goBack()
        }
    } else {
        Alert.alert("Echec", "La navigation n'est pas active")
    }
}

export const getDataDoc = async(snapshot) =>{
    let data
    const querySnapshot = await snapshot
    data = {docId:querySnapshot.id, docData:querySnapshot.data()}
    return {data}
}

export const getDataDocs = async(snapshot) =>{
    let data = []
    const querySnapshot = await snapshot
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length-1]
    querySnapshot.forEach((doc)=>{
        data.push({docId: doc.id, docData: doc.data()})
    })
    return {data, lastVisible}
}

export const InfiniteList = (query = null, queryAfter = Object, setStartAfter) =>{
    const [listData, setListData] = useState([])
    const [listUpdate, setListUpdate] = useState(true)
    const [listIsLast, setListIsLast] = useState(false)

    const setAfter = (e) =>{
        e === undefined ? setStartAfter(Object) : setStartAfter(e)
    }

    const getData = async()=>{
        const data = await getDataDocs(query)
        setListData(data.data)
        setAfter(data.lastVisible)
        setListUpdate(false)
    }

    const getMoreData= async()=>{
        if(!listIsLast){
            const data = await getDataDocs(queryAfter)
            setListData([...listData, ...data.data])
            data.lastVisible !== undefined && setAfter(data.lastVisible)
            data.data?.length === 0 ? setListIsLast(true) : setListIsLast(false)
        }
    }

    const onRefreshData = () =>{
        setListUpdate(true)
        setListData([])
        setListIsLast(false)
        setAfter(Object)
    }

    useEffect(() => {
        getData()
    }, [listUpdate])

    return {listData,listIsLast,listUpdate,onRefreshData,getMoreData}
}

export const distanceBetweenPoints = (lat1, lon1, lat2, lon2)=>{
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    } else {
        const R = 6371e3;
        const p1 = lat1 * Math.PI/180;
        const p2 = lat2 * Math.PI/180;
        const deltaP = p2 - p1;
        const deltaLon = lon2 - lon1;
        const deltaLambda = (deltaLon * Math.PI) / 180;
        const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) +
                  Math.cos(p1) * Math.cos(p2) *
                  Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
        return d;
    }
}

export const arraysAreEqualUsingJSON = (arr1, arr2) =>{
    const json1 = JSON.stringify(arr1);
    const json2 = JSON.stringify(arr2);
    
    return json1 === json2;
}

export const average = (arr)=>{
    let sum = 0

    arr.forEach((item, idx)=>{
        sum += item
    })

    return sum / arr.length
}

const list = []
const listUnique = Array.from(new Set(list))