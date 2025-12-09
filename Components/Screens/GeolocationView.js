import React, { useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, PermissionsAndroid, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AGLoading, API_KEY, Header, NoUserContext, UserContext, boxShadowInput, goToScreen, primaryColor, setAppLang, statusBarHeigth, traductor } from '../AGTools';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    doc,
    updateDoc,
} from '@react-native-firebase/firestore';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import { AuthContext } from '../Login';
import { CommonActions } from '@react-navigation/native';

const arrowBack = require("../img/arrow/arrowBackBg.png")
const headerImgSize = 40
const widthS = Dimensions.get("screen").width

export default function GeolocationView({
    navigation,
    route,
}) {
    const authContext = useContext(AuthContext)
    const {
        user,
        setPubsUpdate,
        noUserlocation,
        setNoUserlocation,
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const [address, setAddress] = useState()
    const [loading, setLoading] = useState(false)

    const autocompleteRef = useRef()
    const modalBox = ModalBox()
    const modalBoxGoSettings = ModalBox()
    const currentUser = auth.currentUser;
    const userDoc = currentUser ? doc(firestore, "Clients", currentUser.uid) : null;
    let lang = setAppLang()

    Geocoder.init(API_KEY)

    const requestGeolocationPermission = async () => {
        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization()
            getCurrentLocation()
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: traductor("Permission de géolocalisation"),
                        message: traductor("La localisation est nécessaire pour calculer la distance entre vous et les offres"),
                        buttonNeutral: traductor("Demander moi plus tard"),
                        buttonNegative: traductor("Annuler"),
                        buttonPositive: traductor("OK"),
                    },
                )

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    getCurrentLocation()
                } else {
                    modalBoxGoSettings.openBoxInfos(traductor("Echec"), traductor("La permission de localisation est nécessaire pour cette action"))
                }
            } catch (err) {
                modalBox.openBoxInfos(traductor("Echec"), err)
            }
        }
    }

    const onGoSettings = () => {
        Linking.openSettings()
    }

    const onPressGoBack = () => {
        StatusBar.setBarStyle("dark-content", true)
        goToScreen(navigation, "goBack")
    }

    const saveLocation = (lat, long, address, city, country, country_short, postalcode, region, department) => {
        updateDoc(userDoc, {
            geolocation: {
                latitude: lat,
                longitude: long,
                address: address,
                city: city,
                country: country,
                country_short: country_short,
                postalcode: postalcode,
                region: region,
                department: department,
            }
        }).then(() => {
            setPubsUpdate(true)
            setTimeout(() => {
                setLoading(false)
                const resetAction = CommonActions.reset({
                    index: 0,
                    routes: [{ name: route.params.from }]
                })
                navigation.dispatch(resetAction)
            }, 3000)
        }).catch((err) => {
            setLoading(false)
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue"))
        })
    }

    const saveNoUserLocation = (lat, long, address, city, country, country_short, postalcode, region, department) => {
        setNoUserlocation({
            latitude: lat,
            longitude: long,
            address: address,
            city: city,
            country: country,
            country_short: country_short,
            postalcode: postalcode,
            region: region,
            department: department,
        })
        setPubsUpdate(true)
        setTimeout(() => {
            setLoading(false)
            const resetAction = CommonActions.reset({
                index: 0,
                routes: [{ name: route.params.from }]
            })
            navigation.dispatch(resetAction)
        }, 3000)
    }

    const deleteLocation = () => {
        updateDoc(userDoc, {
            geolocation: {
                latitude: "",
                longitude: "",
                address: "",
                city: "",
                country: "",
                country_short: "",
                postalcode: "",
                region: "",
                department: "",
            }
        }).then(() => {
            setPubsUpdate(true)
            setTimeout(() => {
                setLoading(false)
                const resetAction = CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Accueil" }]
                })
                navigation.dispatch(resetAction)
            }, 3000)
        }).catch((err) => {
            setLoading(false)
            modalBox.openBoxInfos(traductor("Echec"), traductor("Une erreur est survenue"))
        })
    }

    const deleteNoUserLocation = () => {
        setNoUserlocation({
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
        setPubsUpdate(true)
        setTimeout(() => {
            setLoading(false)
            const resetAction = CommonActions.reset({
                index: 0,
                routes: [{ name: "Accueil" }]
            })
            navigation.dispatch(resetAction)
        }, 3000)
    }

    const getCurrentLocation = () => {
        setLoading(true)
        Geolocation.getCurrentPosition((location) => {
            Geocoder.from(location?.coords?.latitude, location?.coords?.longitude).then(res => {
                let location = res.results[0].geometry.location
                let address = res.results[0].formatted_address
                let city_filter = res?.results[0]?.address_components.filter((elt) => elt.types.includes("locality") || elt.types.includes("administrative_area_level_1"))
                let city = city_filter[0]?.long_name || ""
                let country = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "country")[0]?.long_name || ""
                let country_short = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "country")[0]?.short_name || ""
                let postalcode = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "postal_code")[0]?.long_name || ""
                let region = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "administrative_area_level_1")[0]?.long_name || ""
                let department = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "administrative_area_level_2")[0]?.long_name || ""

                setAddress(address)
                autocompleteRef?.current?.setAddressText(address)

                if (user) {
                    saveLocation(location.lat, location.lng, address, city, country, country_short, postalcode, region, department)
                } else {
                    saveNoUserLocation(location.lat, location.lng, address, city, country, country_short, postalcode, region, department)
                }
            })
        }, error => {
            setLoading(false)
            modalBoxGoSettings.openBoxInfos(traductor("Echec"), traductor("Vérifier si la localisation est activée sur votre téléphone et que vous donnez la permission à l'application"))
        })
    }

    const onSaveGeolocation = async (e) => {
        setLoading(true)
        if (e !== undefined && e !== null && e !== "") {
            Geocoder.from(`${e}`).then((res) => {
                let location = res.results[0].geometry.location
                let address = e
                let city_filter = res?.results[0]?.address_components.filter((elt) => elt.types.includes("locality") || elt.types.includes("administrative_area_level_1"))
                let city = city_filter[0]?.long_name || ""
                let country = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "country")[0]?.long_name || ""
                let country_short = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "country")[0]?.short_name || ""
                let postalcode = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "postal_code")[0]?.long_name || ""
                let region = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "administrative_area_level_1")[0]?.long_name || ""
                let department = res?.results[0]?.address_components.filter((elt) => elt.types[0] === "administrative_area_level_2")[0]?.long_name || ""

                if (user) {
                    saveLocation(location.lat, location.lng, address, city, country, country_short, postalcode, region, department)
                } else {
                    saveNoUserLocation(location.lat, location.lng, address, city, country, country_short, postalcode, region, department)
                }
            }).catch((err) => {
                setLoading(false)
                if (err?.origin?.status === "ZERO_RESULTS") {
                    modalBox.openBoxInfos("", traductor("Aucun résultat trouvé pour cette adresse"))
                } else {
                    modalBox.openBoxInfos("", `${err?.origin?.status}`)
                }
            })
        }
        if (e === "") {
            if (user) {
                deleteLocation()
            } else {
                deleteNoUserLocation()
            }
        }
    }

    useEffect(() => {
        if (user) {
            user?.docData?.geolocation?.address && autocompleteRef?.current?.setAddressText(user?.docData?.geolocation?.address)
            user?.docData?.geolocation?.address && setAddress(user?.docData?.geolocation?.address)
        } else {
            noUserlocation?.address && autocompleteRef?.current?.setAddressText(noUserlocation?.address)
            noUserlocation?.address && setAddress(noUserlocation?.address)
        }
    }, [])

    return (<View styles={[styles.viewContainer]}>
        <SafeAreaView backgroundColor={primaryColor} />
        <View style={[styles.headerBg]} />

        <Header
            title={traductor("Localisation")}
            titleStyle={[styles.headerTitle]}
            containerStyle={[{ marginTop: statusBarHeigth }]}
            titleContainerStyle={[{ marginRight: headerImgSize }]}
            imgLeft={arrowBack}
            imgLeftStyle={[styles.headerImg]}
            leftAction={onPressGoBack}
        />

        <View style={[styles.formContainer, boxShadowInput]}>
            <ScrollView style={[boxShadowInput, { minHeight: 50, borderRadius: 15, backgroundColor: "#f7f7f7" }]} bounces={false} horizontal keyboardShouldPersistTaps={"always"}>
                <GooglePlacesAutocomplete
                    ref={autocompleteRef}
                    styles={{
                        textInputContainer: {
                            backgroundColor: "#f7f7f7",
                            height: 50,
                            borderRadius: 15,
                        },
                        textInput: {
                            height: 50,
                            color: "#000",
                            fontSize: 13,
                            backgroundColor: "#f7f7f7",
                            width: widthS - 80,
                            maxWidth: widthS - 80,
                            paddingLeft: 20,
                            borderRadius: 15,
                        },
                        predefinedPlacesDescription: {
                            color: "#1faadb",
                        },
                    }}
                    placeholder="Adresse"
                    query={{
                        key: API_KEY,
                        language: lang,
                    }}
                    enablePoweredByContainer={false}
                    onPress={(data, details = null) => {
                        onSaveGeolocation(data.description)
                    }}
                    textInputProps={{
                        placeholderTextColor: "#00000050",
                        onSubmitEditing: (e) => onSaveGeolocation(e?.nativeEvent?.text),
                        onChangeText: setAddress
                    }}
                />
            </ScrollView>

            <Text style={[styles.or]}>{traductor("Ou")}</Text>

            <TouchableOpacity style={[styles.btn]} onPress={requestGeolocationPermission}>
                <Text style={[styles.btnText]}>{traductor("Me localiser")}</Text>
            </TouchableOpacity>
        </View>

        <AGLoading
            isLoading={loading}
        />

        {modalBox.renderBoxInfos("")}
        {modalBoxGoSettings.renderBoxInfos("", onGoSettings)}

    </View>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "600",
    },
    headerImg: {
        width: headerImgSize,
        height: headerImgSize,
    },
    headerBg: {
        paddingTop: statusBarHeigth,
        backgroundColor: primaryColor,
        position: "absolute",
        left: 0,
        right: 0,
    },
    formContainer: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 40,
        borderRadius: 12,
        padding: 20,
    },
    btn: {
        backgroundColor: primaryColor,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        padding: 10,
        marginTop: 20,
        height: 50,
    },
    btnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "400",
    },
    or: {
        marginTop: 20,
        textAlign: "center",
    },
})