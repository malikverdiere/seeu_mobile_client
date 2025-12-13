/**
 * AuthModal.js - Modal de connexion élégante
 * 
 * Modal pour l'authentification avec:
 * - Connexion Google
 * - Connexion Apple
 * - Connexion Email
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { 
    signInWithCredential,
    GoogleAuthProvider,
    AppleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { auth } from '../firebase.config';
import { primaryColor, setAppLang } from './AGTools';

// ============ TRANSLATIONS ============
const translations = {
    loginTitle: { en: "Sign in to continue", fr: "Connectez-vous pour continuer", th: "ลงชื่อเข้าใช้เพื่อดำเนินการต่อ" },
    loginSubtitle: { en: "Book your beauty appointment", fr: "Réservez votre rendez-vous beauté", th: "จองการนัดหมายความงามของคุณ" },
    googleSignIn: { en: "Continue with Google", fr: "Continuer avec Google", th: "ทำการเลื่อนไปด้วย Google" },
    appleSignIn: { en: "Continue with Apple", fr: "Continuer avec Apple", th: "ทำการเลื่อนไปด้วย Apple" },
    emailSignIn: { en: "Continue with Email", fr: "Continuer avec Email", th: "ทำการเลื่อนไปด้วย Email" },
    orDivider: { en: "or", fr: "ou", th: "หรือ" },
    termsAgreement: { en: "By signing in, you agree to our Terms of Service and Privacy Policy", fr: "En vous connectant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité", th: "โดยการลงชื่อเข้าใช้ คุณยอมรับข้อกำหนดการให้บริการและนโยบายความเป็นส่วนตัวของเรา" },
    signingIn: { en: "Signing in...", fr: "Connexion en cours...", th: "กำลังลงชื่อเข้า..." },
    error: { en: "Error", fr: "Erreur", th: "ข้อผิดพลาด" },
    cancelled: { en: "Sign in cancelled", fr: "Connexion annulée", th: "ยกเลิกการลงชื่อเข้า" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ SVG ICONS ============

const GoogleIcon = ({ size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <Path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <Path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <Path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </Svg>
);

const AppleIcon = ({ size = 24, color = "#000" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.04 2.29.77 3.06.76.87-.01 1.71-.78 3.07-.76 4.34.26 4.97 5.57 3.87 7.76-1.38 2.59-3.77 3.75-5.87 2.21z"
            fill={color}
        />
        <Path
            d="M12.03 7.25c-.15-1.75 1.01-3.29 2.62-3.49.2 1.78-1.63 3.51-2.62 3.49z"
            fill={color}
        />
    </Svg>
);

const EmailIcon = ({ size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M22 6L12 13L2 6"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const CloseIcon = ({ size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 6L6 18M6 6L18 18"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// ============ BUTTON COMPONENT ============

const AuthButton = ({ icon: Icon, label, onPress, loading, isApple = false }) => (
    <TouchableOpacity
        style={[styles.authButton, isApple && styles.appleButton]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
    >
        {loading ? (
            <ActivityIndicator size="small" color={isApple ? "#FFFFFF" : "#4285F4"} />
        ) : (
            <>
                <Icon size={20} color={isApple ? "#FFFFFF" : undefined} />
                <Text style={[styles.authButtonText, isApple && styles.appleButtonText]}>
                    {label}
                </Text>
            </>
        )}
    </TouchableOpacity>
);

// ============ MAIN COMPONENT ============

const AuthModal = ({ 
    visible, 
    onClose, 
    onSuccess,
    onNavigateToEmail 
}) => {
    const lang = setAppLang();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    
    // Configure Google Sign In
    useEffect(() => {
        if (visible) {
            GoogleSignin.configure({
                webClientId: "846057365263-2hfi38vu782um9lotb1ubr7imi5rhrdn.apps.googleusercontent.com",
            });
        }
    }, [visible]);
    
    // Handle Google Sign In
    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const { idToken } = await GoogleSignin.signIn();
            
            if (!idToken) {
                throw new Error('No ID token received from Google Sign In');
            }
            
            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);
            
            console.log('[AuthModal] Google sign in successful');
            onSuccess?.();
        } catch (error) {
            if (error.code !== 'SIGN_IN_CANCELLED') {
                Alert.alert(t('error', lang), error.message);
            } else {
                console.log('[AuthModal] Google sign in cancelled');
            }
        } finally {
            setGoogleLoading(false);
        }
    };
    
    // Handle Apple Sign In
    const handleAppleSignIn = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert(t('error', lang), 'Apple Sign In is only available on iOS');
            return;
        }
        
        try {
            setAppleLoading(true);
            
            // Perform Apple authentication request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            
            // Ensure Apple returned an identityToken
            if (!appleAuthRequestResponse.identityToken) {
                throw new Error('No identity token received from Apple Sign In');
            }
            
            // Create Firebase credential
            const { identityToken, nonce } = appleAuthRequestResponse;
            const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
            await signInWithCredential(auth, appleCredential);
            
            console.log('[AuthModal] Apple sign in successful');
            onSuccess?.();
        } catch (error) {
            if (error.code !== appleAuth.Error.CANCELED) {
                Alert.alert(t('error', lang), error.message);
            } else {
                console.log('[AuthModal] Apple sign in cancelled');
            }
        } finally {
            setAppleLoading(false);
        }
    };
    
    // Handle Email Sign In
    const handleEmailSignIn = () => {
        onClose?.();
        onNavigateToEmail?.();
    };
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <CloseIcon size={24} />
                    </TouchableOpacity>
                    
                    {/* Content */}
                    <View style={styles.content}>
                        {/* Title */}
                        <Text style={styles.title}>{t('loginTitle', lang)}</Text>
                        <Text style={styles.subtitle}>{t('loginSubtitle', lang)}</Text>
                        
                        {/* Auth Buttons */}
                        <View style={styles.buttonsContainer}>
                            {/* Google Button */}
                            <AuthButton
                                icon={GoogleIcon}
                                label={t('googleSignIn', lang)}
                                onPress={handleGoogleSignIn}
                                loading={googleLoading}
                            />
                            
                            {/* Apple Button (only on iOS) */}
                            {Platform.OS === 'ios' && (
                                <AuthButton
                                    icon={AppleIcon}
                                    label={t('appleSignIn', lang)}
                                    onPress={handleAppleSignIn}
                                    loading={appleLoading}
                                    isApple={true}
                                />
                            )}
                            
                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>{t('orDivider', lang)}</Text>
                                <View style={styles.dividerLine} />
                            </View>
                            
                            {/* Email Button */}
                            <AuthButton
                                icon={EmailIcon}
                                label={t('emailSignIn', lang)}
                                onPress={handleEmailSignIn}
                                loading={loading}
                            />
                        </View>
                        
                        {/* Terms Agreement */}
                        <Text style={styles.termsText}>
                            {t('termsAgreement', lang)}
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

// ============ STYLES ============

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    closeButton: {
        alignSelf: 'flex-end',
        paddingTop: 16,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#747676',
        textAlign: 'center',
        fontFamily: 'Montserrat-Medium',
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E5E5',
        borderRadius: 16,
        gap: 12,
    },
    appleButton: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    authButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        fontFamily: 'Montserrat-SemiBold',
    },
    appleButtonText: {
        color: '#FFFFFF',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#BDBDBD',
        fontFamily: 'Montserrat-Medium',
    },
    termsText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#747676',
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 16,
        fontFamily: 'Montserrat-Medium',
    },
});

export default AuthModal;

