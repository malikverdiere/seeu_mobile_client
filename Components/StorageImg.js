import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { traductor } from './AGTools';
import { storage } from '../firebase.config';
import ImagePicker from 'react-native-image-crop-picker';

export default function StorageImg(fileWidth,fileHeigth){
    const [imagePicker, setImagePicker] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [transferred, setTransferred] = useState(0)

    const takePhotoFromCamera = (modalBox) =>{
        ImagePicker.openCamera({
            compressImageMaxWidth: fileWidth,
            compressImageMaxHeight: fileHeigth,
            cropping: Platform.OS === "ios" ? false : true,
            compressImageQuality: 1,
        }).then(image => {
            setImagePicker(image.path)
        })
        .catch((err)=>{
            if(err.message === "User cancelled image selection"){
                return
                // if(modalBox){
                //     modalBox.openBoxInfos("Echec","Sélection d'image annulé")
                // } else {
                //     Alert.alert("Echec","Sélection d'image annulé")
                // }
            } else {
                if(err.message === "User did not grant camera permission."){
                    if(modalBox){
                        modalBox.openBoxInfos(traductor("Echec"),traductor("L'utilisateur n'a pas accordé l'autorisation de caméra."))
                    } else {
                        Alert.alert(traductor("Echec"),traductor("L'utilisateur n'a pas accordé l'autorisation de caméra."))
                    }
                } else {
                    if(modalBox){
                        modalBox.openBoxInfos(traductor("Echec"),err.message)
                    } else {
                        Alert.alert(traductor("Echec"),err.message)
                    }
                }
            }
        })
    }

    const choosePhotoFromLibrary = (modalBox) =>{
        ImagePicker.openPicker({
            compressImageMaxWidth: fileWidth,
            compressImageMaxHeight: fileHeigth,
            cropping: Platform.OS === "ios" ? false : true,
            compressImageQuality: 1,
        }).then(image => {
            setImagePicker(image.path)
        }).catch((err)=>{
            if(err.message === "User cancelled image selection"){
                return
                // if(modalBox){
                //     modalBox.openBoxInfos("Echec","Sélection d'image annulé")
                // } else {
                //     Alert.alert("Echec","Sélection d'image annulé")
                // }
            } else {
                if(err.message === "User did not grant library permission."){
                    if(modalBox){
                        modalBox.openBoxInfos(traductor("Echec"),traductor("L'utilisateur n'a pas accordé l'autorisation de bibliothèque."))
                    } else {
                        Alert.alert(traductor("Echec"),traductor("L'utilisateur n'a pas accordé l'autorisation de bibliothèque."))
                    }
                } else {
                    if(modalBox){
                        modalBox.openBoxInfos(traductor("Echec"),err.message)
                    } else {
                        Alert.alert(traductor("Echec"),err.message)
                    }
                }
            }
        })
    }

    const uploadImage = async(filePath,customPathImg,modalBox,messageValidate) =>{
        const uploadUri = imagePicker || customPathImg
        let fileName = filePath
        const storageRef = storage.ref(fileName)
        
        setUploading(true)
        setTransferred(0)

        const task = storageRef.putFile(uploadUri)
        task.on('state_changed', taskSnapshot => {
            setTransferred(Math.round(taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100)
        })

        try{
            await task
            const url = await storageRef.getDownloadURL()

            setUploading(false)
            setImagePicker(null)

            if(messageValidate){
                if(modalBox){
                    modalBox.openBoxInfos(traductor("Succès"),traductor("Votre image à bien était enregistrée"))
                } else {
                    Alert.alert(traductor("Succès"),traductor("Votre image à bien était enregistrée"))
                }
            }

            return url
        } catch(e) {
            setUploading(false)
            setImagePicker(null)
            if(modalBox){
                modalBox.openBoxInfos(traductor("Echec"),e)
            } else {
                Alert.alert(traductor("Echec"),e)
            }
            return null
        }
    }
    
    const onDeleteChoose = () =>{
        setImagePicker(null)
    }
    
    const onDeleteStorage = (filePath,modalBox) =>{
        let fileName = filePath
        const storageRef = storage.ref(fileName)
        storageRef.delete().then(()=>{
            if(modalBox){
                modalBox.openBoxInfos(traductor("Succès"),traductor("Image supprimée"))
            } else {
                Alert.alert(traductor("Succès"),traductor("Image supprimée"))
            }
        }).catch((err)=>{
            if(modalBox){
                modalBox.openBoxInfos(traductor("Echec"),err.message)
            } else {
                Alert.alert(traductor("Echec"),err.message)
            }
        })
    }

    return {
        imagePicker,
        uploading,
        transferred,
        takePhotoFromCamera,
        choosePhotoFromLibrary,
        onDeleteChoose,
        onDeleteStorage,
        uploadImage,
    }
}