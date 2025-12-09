import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StatusBar, Alert, Platform } from 'react-native';
import { AGLoading, LoadingContext, NoUserProvider, StackLogin, TabNavigator, UserProvider } from './AGTools';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { AuthContext } from './Login';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import SplashScreen from './SplashScreen';
// Clarity désactivé temporairement
// import { LogLevel, initialize, setCurrentScreenName } from 'react-native-clarity';
// import { CLARITY_KEY } from '@env';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function LandingView() {
    const {
        loading,
        setLoading,
    } = useContext(LoadingContext)
    const {
        user,
        initializing,
    } = useContext(AuthContext)

    const [screen, setScreen] = useState(false)
    const [splashScreen, setSplashScreen] = useState(true)

    const navigationRef = useNavigationContainerRef()
    const routeNameRef = useRef()

    const trakingRequest = useCallback(async () => {
        try {
            const status = await requestTrackingPermission()
        } catch (e) {
            Alert.alert('Error', e?.toString?.() ?? e)
        }
    }, [])

    // Clarity désactivé temporairement
    // const clarityConfig = {
    //     logLevel: LogLevel.Verbose,
    // }

    // useEffect(() => {
    //     if (Platform.OS === 'android') {
    //         initialize(CLARITY_KEY, clarityConfig)
    //     }
    // }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            trakingRequest()
        }, 3000)
    }, [])

    useLayoutEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])
    useLayoutEffect(() => {
        const timer = setTimeout(() => {
            setScreen(true)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])
    useLayoutEffect(() => {
        const timer = setTimeout(() => {
            setSplashScreen(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    if (initializing) return null

    return (<>
        <SafeAreaProvider>
            <StatusBar translucent backgroundColor="transparent" />

            {(screen && user) ?
                <NavigationContainer ref={navigationRef}
                    onReady={() => {
                        routeNameRef.current = navigationRef.getCurrentRoute().name
                        // Clarity désactivé temporairement
                        // setCurrentScreenName(routeNameRef.current)
                    }}
                    onStateChange={() => {
                        const previousRouteName = routeNameRef.current
                        const currentRouteName = navigationRef.getCurrentRoute().name

                        if (previousRouteName !== currentRouteName) {
                            routeNameRef.current = currentRouteName
                            // Clarity désactivé temporairement
                            // setCurrentScreenName(currentRouteName)
                        }
                    }}
                >
                    <UserProvider>
                        <TabNavigator />
                    </UserProvider>
                </NavigationContainer>
                : screen &&
                <NavigationContainer>
                    <NoUserProvider>
                        <StackLogin />
                    </NoUserProvider>
                </NavigationContainer>
            }

            {splashScreen && <SplashScreen />}
            <AGLoading isLoading={loading} />
        </SafeAreaProvider>
    </>)
}