import React, { useState, useEffect, createContext } from "react";
import { auth } from '../../firebase.config';
import { onAuthStateChanged } from '@react-native-firebase/auth';

export const AuthContext = createContext()
export const AuthProvider = (props) => {
    const [initializing, setInitializing] = useState(true)
    const [user, setUser] = useState(null)

    function onAuthStateChangedHandler(user) {
        setUser(user)
        if (initializing) setInitializing(false)
    }

    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, onAuthStateChangedHandler)
        return subscriber
    }, [])
    
    return (<>
        <AuthContext.Provider value={{
            initializing,
            user,
            setUser,
        }}>
            {props.children}
        </AuthContext.Provider>
    </>)
}