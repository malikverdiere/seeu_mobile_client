import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity, Platform, Pressable, SafeAreaView, Image, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { API_KEY, boxShadowInput, getCurrentDate, goToScreen, Header, InputText, KeyboardHeight, primaryColor, secondaryColor, setAppLang, statusBarHeigth, traductor, UserContext } from '../../AGTools';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ModalBox } from '../../ModalBox';
import { auth, firestore } from '../../../firebase.config';
import {
    collection,
    doc,
    updateDoc,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import StorageImg from '../../StorageImg';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const defaultImg = require("../../img/logo/defaultImg.png")
const arrowBack = require("../../img/arrow/arrowBackBg.png")
const setImg = require("../../img/btn/setImg.png")

const heightS = Dimensions.get("screen").height
const widthS = Dimensions.get("screen").width
const headerImgSize = 40
const profilImgSize = 74

export default function SetPersonnalInfos({
    navigation,
}) {
    const {
        user,
        registeredShops,
    } = useContext(UserContext)

    const [firstName, setFirstName] = useState(user?.docData?.firstName || "")
    const [lastName, setLastName] = useState(user?.docData?.lastName || "")
    const [phone, setPhone] = useState(user?.docData?.phone || "")
    const [gender, setGender] = useState(user?.docData?.gender || 0)
    const [postalCode, setPostalCode] = useState(user?.docData?.postalCode || "")
    const [address, setAddress] = useState(user?.docData?.address)
    const [birthday, setBirthday] = useState(user?.docData?.birthday?.seconds ? new Date(user.docData.birthday.seconds * 1000) : new Date("1990-01-28"))
    const [showBirthday, setShowBirthday] = useState(false)
    const [deleteImgLoad, setDeleteImgLoad] = useState(false)
    const [load, setLoad] = useState(false)

    const currentUser = auth.currentUser
    const userCollection = collection(firestore, "Clients")
    const userDocument = doc(userCollection, currentUser?.uid)
    const registeredShopsCollection = collection(userDocument, "RegisteredShops")
    const userImgStoragePath = `user_img/${currentUser.uid}`
    const modalBox = ModalBox()
    const modalBoxCallback = ModalBox()
    const modalBoxConfirm = ModalBox()
    const photoPicker = ModalBox()
    const defaultUserImg = user?.docData?.user_img ? user?.docData?.user_img : Image.resolveAssetSource(defaultImg).uri
    const storageProfilImg = StorageImg(500, 500)
    const autocompleteRef = useRef()
    let lang = setAppLang()

    const onBack = () => {
        if (load) {
            return
        } else {
            goToScreen(navigation, "goBack")
        }
    }

    const onChangeGender = (e) => {
        setGender(e)
    }

    const onCheck = () => {
        if (user?.docData?.birthdayUpdate !== true) {
            modalBoxConfirm.openBoxConfirm("", traductor("Êtes-vous sûr que toutes les informations sont correctes ? La date de naissance ne pourra plus être modifiée"))
        } else {
            if (firstName !== user?.docData?.firstName
                || lastName !== user?.docData?.lastName
                || gender !== user?.docData?.gender
                || phone !== user?.docData?.phone
                || postalCode !== user?.docData?.postalCode
                || address !== user?.docData?.address
            ) {
                modalBoxConfirm.openBoxConfirm("", traductor("Êtes-vous sûr que toutes les informations sont correctes ?"))
            } else {
                modalBox.openBoxInfos(traductor("Echec"), traductor("Aucun champ n'est modifié"))
            }
        }
    }

    const toggleDatePickerBirthday = () => {
        if (user?.docData?.birthdayUpdate !== true) {
            setShowBirthday(!showBirthday)
        }
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate
            setBirthday(currentDate)
            if (Platform.OS === "android") {
                toggleDatePickerBirthday()
                setBirthday(new Date(currentDate.toDateString()))
            }
        } else {
            toggleDatePickerBirthday()
        }
    }

    const onSetProfilImg = () => {
        photoPicker.openBoxPhotoPicker("", traductor("Choisir une photo de profil"))
    }

    const onTakePhoto = () => {
        setTimeout(() => {
            storageProfilImg.takePhotoFromCamera()
        }, 1000)
    }

    const onChooseLibrary = () => {
        setTimeout(() => {
            storageProfilImg.choosePhotoFromLibrary(modalBox)
        }, 1000)
    }

    const onDeleteStorage = async () => {
        setDeleteImgLoad(true);
        try {
            const storageRef = storage().ref(userImgStoragePath)
            await storageRef.delete()

            await updateDoc(userDocument, {
                user_img: "",
                user_img_Valid: false,
            });

            // Mise à jour en parallèle de tous les shops enregistrés
            const updatePromises = registeredShops.map(shop => 
                updateDoc(doc(registeredShopsCollection, shop.docId), {
                    user_img: "",
                    user_img_Valid: false,
                })
            );
            await Promise.all(updatePromises);

            setDeleteImgLoad(false);
            modalBox.openBoxInfos(traductor("Succès"), traductor("Image supprimée"));
        } catch (err) {
            setDeleteImgLoad(false);
            modalBox.openBoxInfos(traductor("Echec"), err.message);
        }
    }

    const profilImgUpload = async () => {
        if (!storageProfilImg.imagePicker) return;

        try {
            const imageUrl = await storageProfilImg.uploadImage(userImgStoragePath,false,modalBox,true)

            await updateDoc(userDocument, {
                user_img: imageUrl,
                user_img_Valid: false,
            });

            // Mise à jour en parallèle de tous les shops enregistrés
            const updatePromises = registeredShops.map(shop => 
                updateDoc(doc(registeredShopsCollection, shop.docId), {
                    user_img: imageUrl,
                    user_img_Valid: false,
                })
            );
            await Promise.all(updatePromises);

        } catch (error) {
            modalBox.openBoxInfos(traductor("Echec"), error.message);
        }
    }

    const onSubmit = async () => {
        setLoad(true);
        try {
            const userData = {
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                phone: phone,
                birthday: birthday,
                birthdayString: new Date(birthday).toLocaleDateString(),
                birthdayUpdate: true,
                postalCode: postalCode,
                address: address,
            };

            await updateDoc(userDocument, userData);

            // Mise à jour en parallèle de tous les shops enregistrés
            const updatePromises = registeredShops.map(shop => 
                updateDoc(doc(registeredShopsCollection, shop.docId), {
                    ...userData,
                    birthdayString: new Date(birthday).toLocaleDateString(),
                })
            );
            await Promise.all(updatePromises);

            setLoad(false);
            modalBoxCallback.openBoxInfos(traductor("Succès"), traductor("Informations modifiées"));
        } catch (err) {
            setLoad(false);
            modalBox.openBoxInfos(traductor("Echec"), err.message);
        }
    }

    useLayoutEffect(() => {
        profilImgUpload()
    }, [storageProfilImg.imagePicker])

    useEffect(() => {
        user?.docData?.address && autocompleteRef?.current?.setAddressText(user?.docData?.address)
        user?.docData?.address && setAddress(user?.docData?.address)
    }, [])

    return (<View style={[styles.viewContainer]}>

        <SafeAreaView />
        <LinearGradient style={[styles.headerBg, { height: heightS * 0.3 }]} colors={[secondaryColor, primaryColor]} start={{ x: 1.0, y: 0.0 }} end={{ x: 1.0, y: 1.5 }} />

        <ScrollView bounces={false} keyboardShouldPersistTaps={"always"} showsVerticalScrollIndicator={false}>
            <Header
                title={traductor("Modifer le profil")}
                containerStyle={[{ marginTop: statusBarHeigth, backgroundColor: "#ffffff00" }]}
                titleStyle={[styles.headerTitle]}
                imgLeft={arrowBack}
                imgLeftStyle={[styles.headerImg]}
                leftAction={onBack}
            />

            <View style={[styles.imgSection]}>
                <View>
                    <View style={[]}>
                        <Image style={[styles.profilImg]} source={{ uri: storageProfilImg?.imagePicker ? storageProfilImg.imagePicker : defaultUserImg }} />
                        {(storageProfilImg.uploading || deleteImgLoad) && <View style={[styles.loadingProfilImgContainer]}>
                            {storageProfilImg.uploading && <Text style={[styles.loadingProfilImgText]}>{storageProfilImg.transferred}%</Text>}
                            <ActivityIndicator size="large" color={secondaryColor} />
                        </View>}
                    </View>
                    <TouchableOpacity style={[styles.setImgProfilContainer]} onPress={() => onSetProfilImg()}>
                        <Image style={[styles.setImgProfil]} source={setImg} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.formContainer, boxShadowInput]}>
                <InputText
                    container={[{ marginBottom: 10 }]}
                    placeholder={traductor("Prénom")}
                    defaultValue={firstName}
                    inputAction={setFirstName}
                    inputStyle={[styles.inputStyle, boxShadowInput]}
                    errorStyle={[styles.errorStyle]}
                />
                <InputText
                    container={[{ marginBottom: 10 }]}
                    placeholder={traductor("Nom")}
                    defaultValue={lastName}
                    inputAction={setLastName}
                    inputStyle={[styles.inputStyle, boxShadowInput]}
                    errorStyle={[styles.errorStyle]}
                />
                <InputText
                    container={[{ marginBottom: 10 }]}
                    placeholder={traductor("Téléphone")}
                    defaultValue={phone}
                    inputAction={setPhone}
                    inputStyle={[styles.inputStyle, boxShadowInput]}
                    isNum
                    errorStyle={[styles.errorStyle]}
                />

                {!showBirthday && <Pressable onPress={toggleDatePickerBirthday}>
                    <InputText
                        container={[{ marginBottom: 10 }]}
                        defaultValue={`${getCurrentDate(birthday).day}/${getCurrentDate(birthday).month}/${getCurrentDate(birthday).year}`}
                        inputAction={setBirthday}
                        inputStyle={[styles.inputStyle, boxShadowInput]}
                        editable={false}
                        onPressIn={toggleDatePickerBirthday}
                    />
                    {user?.docData?.birthdayUpdate === true && <View style={[styles.inputLock]} />}
                </Pressable>}
                {showBirthday && <View style={[styles.inputLock, { position: "relative", marginBottom: 24 }]} />}
                {showBirthday && <DateTimePicker
                    mode={"date"}
                    display={"spinner"}
                    textColor={"#000"}
                    value={birthday}
                    onChange={onChangeDate}
                />}
                {showBirthday && Platform.OS === "ios" && (
                    <View style={[styles.iosDatePickerBtnContainer]}>
                        <TouchableOpacity style={[styles.iosDatePickerBtnCancel]} onPress={toggleDatePickerBirthday}>
                            <Text style={[styles.iosDatePickerBtnCancelText]}>{traductor("Annuler")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iosDatePickerBtnValid]} onPress={toggleDatePickerBirthday}>
                            <Text style={[styles.iosDatePickerBtnValidText]}>{traductor("Ok")}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <InputText
                    container={[{ marginBottom: 10 }]}
                    placeholder={traductor("Code postal")}
                    defaultValue={postalCode}
                    inputAction={setPostalCode}
                    inputStyle={[styles.inputStyle, boxShadowInput]}
                    isNum
                    errorStyle={[styles.errorStyle]}
                />

                <ScrollView style={[boxShadowInput, { minHeight: 50, borderRadius: 15, marginHorizontal: 20, backgroundColor: "#f7f7f7" }]} bounces={false} horizontal keyboardShouldPersistTaps={"always"}>
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
                            setAddress(data.description)
                        }}
                        textInputProps={{
                            placeholderTextColor: "#00000050",
                            onChangeText: setAddress
                        }}
                    />
                </ScrollView>

                <View style={[styles.optionInputContainer]}>
                    <TouchableOpacity style={[gender !== 1 ? styles.optionInput : styles.optionInputHover, { marginRight: 10 }]} onPress={() => onChangeGender(1)}>
                        <Text style={[gender !== 1 ? styles.optionInputText : styles.optionInputTextHover]}>{traductor("Homme")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[gender !== 2 ? styles.optionInput : styles.optionInputHover, { marginLeft: 10 }]} onPress={() => onChangeGender(2)}>
                        <Text style={[gender !== 2 ? styles.optionInputText : styles.optionInputTextHover]}>{traductor("Femme")}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.btn]} onPress={onCheck}>
                    {load ? <ActivityIndicator size={"small"} color={"#fff"} /> : <Text style={[styles.btnText]}>{traductor("Enregistrer")}</Text>}

                </TouchableOpacity>
            </View>

            <KeyboardHeight />
        </ScrollView>

        {modalBox.renderBoxInfos("")}
        {modalBoxCallback.renderBoxInfos("", onBack)}
        {modalBoxConfirm.renderBoxConfirm("", "", onSubmit)}
        {photoPicker.renderBoxPhotoPicker(onTakePhoto, onChooseLibrary, user?.docData?.user_img ? onDeleteStorage : false)}
    </View>)
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerBg: {
        borderBottomLeftRadius: 37,
        borderBottomRightRadius: 37,
        position: "absolute",
        left: 0,
        right: 0,
    },
    headerImg: {
        width: headerImgSize,
        height: headerImgSize,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "600",
        marginRight: headerImgSize,
    },
    imgSection: {
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        alignItems: "center",
        paddingBottom: 40,
        marginTop: -10,
        marginBottom: -30,
    },
    profilImg: {
        width: profilImgSize,
        height: profilImgSize,
        borderRadius: profilImgSize * 0.5,
    },
    loadingProfilImgContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000AA",
        borderRadius: profilImgSize * 0.5,
    },
    loadingProfilImgText: {
        textAlign: "center",
        position: "absolute",
        color: "#fff",
    },
    setImgProfilContainer: {
        position: "absolute",
        bottom: -10,
        right: -10,
    },
    setImgProfil: {
        width: headerImgSize,
        height: headerImgSize,
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginHorizontal: 20,
        paddingVertical: 20,
        marginVertical: 20,
    },
    inputStyle: {
        borderRadius: 15,
        borderWidth: 0,
        paddingLeft: 20,
        fontSize: 13,
        color: "#303030",
        backgroundColor: "#f7f7f7",
        marginHorizontal: 20,
    },
    errorStyle: {
        marginHorizontal: 20,
    },
    btn: {
        backgroundColor: primaryColor,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        padding: 10,
        marginTop: 30,
        marginHorizontal: 20,
    },
    btnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "400",
    },
    optionInputContainer: {
        marginTop: 24,
        flexDirection: "row",
        marginHorizontal: 20,
    },
    optionInput: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: "#f7f7f7",
        height: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    optionInputText: {
        fontSize: 13,
        color: "#303030",
    },
    optionInputHover: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: secondaryColor,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    optionInputTextHover: {
        fontSize: 13,
        color: primaryColor,
    },
    inputLock: {
        backgroundColor: "#00000010",
        position: "absolute",
        right: 0,
        left: 0,
        height: 50,
        borderRadius: 15,
        marginHorizontal: 20,
    },
    iosDatePickerBtnContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginBottom: 20,
    },
    iosDatePickerBtnCancel: {
        backgroundColor: "#11182711",
        padding: 20,
        borderRadius: 20,
    },
    iosDatePickerBtnCancelText: {
        color: primaryColor,
        fontSize: 14,
        fontWeight: "500",
    },
    iosDatePickerBtnValid: {
        backgroundColor: primaryColor,
        padding: 20,
        borderRadius: 20,
    },
    iosDatePickerBtnValidText: {
        color: secondaryColor,
        fontSize: 14,
        fontWeight: "500",
    },
})