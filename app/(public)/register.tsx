import { TextInput, View, StyleSheet, Pressable, Text } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { Stack } from 'expo-router';

const Register = () => {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Create the user and send the verification email
    const onSignUpPress = async () => {
        if (!isLoaded) {
            return;
        }
        setLoading(true);

        try {
            // Create the user on Clerk
            await signUp.create({
                emailAddress,
                password,
            });

            // Send verification Email
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            // Change the UI to verify the email address
            setPendingVerification(true);
        } catch (err: any) {
            alert(err.errors[0].message);
        } finally {
            setLoading(false);
        }
    };

    // Verify the email address
    const onPressVerify = async () => {
        if (!isLoaded) {
            return;
        }
        setLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            await setActive({ session: completeSignUp.createdSessionId });
        } catch (err: any) {
            alert(err.errors[0].message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
            <Spinner visible={loading} />

            <View style={styles.card}>
                {!pendingVerification && (
                    <>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Please fill in the details to create your account
                        </Text>

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

                        <Pressable onPress={onSignUpPress} style={styles.button}>
                            <Text style={styles.buttonText}>Sign Up</Text>
                        </Pressable>
                    </>
                )}

                {pendingVerification && (
                    <>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            Enter the code sent to your email to complete the process
                        </Text>

                        <TextInput
                            value={code}
                            placeholder="Enter Verification Code"
                            style={styles.inputField}
                            onChangeText={setCode}
                            placeholderTextColor="#999"
                        />
                        <Pressable onPress={onPressVerify} style={styles.button}>
                            <Text style={styles.buttonText}>Verify Email</Text>
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
});

export default Register;
