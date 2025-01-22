import React from 'react';
import { Stack } from 'expo-router';
import CustomHeader from '../../components/CustomHeader';
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const LoginHeader = () => {
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Swimming Pool App </Text>
            <MaterialIcons name="waves" size={24} color="white" />
        </View>
    );
};

const PublicLayout = () => {
    return (
        <Stack
            screenOptions={{
                header: ({ options }) => (
                    <CustomHeader
                        title={options.headerTitle || 'Default Title'}
                        backgroundColor="#008080"
                    />
                ),
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    header: () => <LoginHeader />, // Use the custom LoginHeader
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    headerTitle: 'Create Account',
                }}
            />
            <Stack.Screen
                name="reset"
                options={{
                    headerTitle: 'Reset Password',
                }}
            />
        </Stack>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#008080',
        padding: 15,
    },
    icon: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
});
export default PublicLayout;
