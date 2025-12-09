/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import 'react-native-gesture-handler';
import React, {  } from 'react';
import LandingView from './Components/LandingView';
import { LoadingProvider } from './Components/AGTools';
import { AuthProvider } from './Components/Login';

export default function App(): React.JSX.Element {
    return(<>
        <LoadingProvider>
            <AuthProvider>
                <LandingView />
            </AuthProvider>
        </LoadingProvider>
    </>)
}