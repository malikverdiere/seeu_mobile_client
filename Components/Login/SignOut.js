import React, {  } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { auth } from '../../firebase.config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SignOut(){
    async function onSignOut() {
        try {
            await GoogleSignin.revokeAccess()
            await GoogleSignin.signOut()
            await auth.signOut()
        } catch (error) {
            await auth.signOut()
        }
    }
    function render() {
        return(<>
            <TouchableOpacity style={[styles.btn]} onPress={onSignOut}>
                <Text style={[styles.text]}>Deco</Text>
            </TouchableOpacity>
        </>)
    }
    return { onSignOut, render }
}
const styles = StyleSheet.create({
    btn:{
        backgroundColor:"#00000050",
        paddingHorizontal:20,
        paddingVertical:10,
    },
    text:{
        color:"#000",
    },
})