import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import React from "react";

const StartPage = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#008080" style={styles.spinner} />
            <Text style={styles.message}>Fetching your details, just a moment...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20, // To prevent text overflow on smaller screens
    },
    spinner: {
        marginBottom: 20, // Adds spacing between spinner and message
    },
    message: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default StartPage;
