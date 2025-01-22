import { useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Pressable,
    Text,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Login = () => {
    const { signIn, setActive, isLoaded } = useSignIn();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onSignInPress = async () => {
        if (!isLoaded) {
            return;
        }
        setLoading(true);
        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });

            // This indicates the user is signed in
            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
            Alert.alert('Error', err.errors[0].message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Log in to your account</Text>

                <TextInput
                    autoCapitalize="none"
                    placeholder="Email Address"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    style={styles.inputField}
                    placeholderTextColor="#999"
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.inputField}
                    placeholderTextColor="#999"
                />

                <Pressable
                    onPress={onSignInPress}
                    style={[styles.loginButton, loading && styles.disabledButton]}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="log-in-outline" size={28} color="#fff" />
                    )}
                </Pressable>

                <Link href="/reset" asChild>
                    <Pressable style={styles.linkButton}>
                        <Text style={styles.linkText}>Forgot password?</Text>
                    </Pressable>
                </Link>
                <Link href="/register" asChild>
                    <Pressable style={styles.linkButton}>
                        <Text style={styles.registerText}>Create Account</Text>
                    </Pressable>
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 15,
        backgroundColor: '#fff',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputField: {
        marginVertical: 8,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    loginButton: {
        marginTop: 16,
        width: 60,
        height: 60,
        backgroundColor: '#008080',
        borderRadius: 30, // Circular shape
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center', // Center the button horizontally
    },
    disabledButton: {
        backgroundColor: '#A9A9A9', // Gray color for disabled state
    },
    linkButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    linkText: {
        color: '#3B82F6', // Appealing blue color
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Login;
