import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';

const PwReset = () => {
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const { signIn, setActive } = useSignIn();
    const [loading, setLoading] = useState(false);

    // Request a password reset code by email
    const onRequestReset = async () => {
        try {
            setLoading(true);
            await signIn!.create({
                strategy: 'reset_password_email_code',
                identifier: emailAddress,
            });
            setSuccessfulCreation(true);
        } catch (err: any) {
            alert(err.errors[0]?.message || 'Failed to request password reset.');
        } finally {
            setLoading(false);
        }
    };

    // Reset the password with the code and the new password
    const onReset = async () => {
        try {
            setLoading(true);
            const result = await signIn!.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });
            alert('Password reset successfully');

            // Set the user session active, which will log in the user automatically
            if (setActive) {
                await setActive({ session: result.createdSessionId });
            }
        } catch (err: any) {
            alert(err.errors[0]?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerBackVisible: !successfulCreation }} />
            <View style={styles.card}>
                {!successfulCreation ? (
                    <>
                        <Text style={styles.title}>Reset Your Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email to receive a password reset code.
                        </Text>
                        <TextInput
                            autoCapitalize="none"
                            placeholder="Enter your email"
                            value={emailAddress}
                            onChangeText={setEmailAddress}
                            style={styles.inputField}
                            placeholderTextColor="#999"
                        />

                        <Pressable onPress={onRequestReset} style={[styles.button, loading && styles.disabledButton]} disabled={loading}>
                            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Email'}</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>
                            Enter the verification code sent to your email and your new password.
                        </Text>
                        <TextInput
                            value={code}
                            placeholder="Enter Verification Code"
                            style={styles.inputField}
                            onChangeText={setCode}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Enter New Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.inputField}
                            placeholderTextColor="#999"
                        />
                        <Pressable onPress={onReset} style={[styles.button, loading && styles.disabledButton]} disabled={loading}>
                            <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Set New Password'}</Text>
                        </Pressable>
                    </>
                )}
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
    button: {
        marginTop: 16,
        height: 50,
        backgroundColor: '#008080',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
});

export default PwReset;
