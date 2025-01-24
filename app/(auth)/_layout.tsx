import { ActivityIndicator, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import CustomHeader from "@/components/CustomHeader";

const LogoutButton = () => {
    const { signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const doLogout = async () => {
        setLoading(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Logout Error', 'An error occurred while logging out. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
            </View>
        );
    }

    return (
        <Pressable onPress={doLogout} style={{ marginRight: 10 }}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
        </Pressable>
    );
};

const TabsPage = () => {
    const { isSignedIn, getToken } = useAuth();
    const router = useRouter();

    const [userState, setUserState] = useState({ state: 0, id: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserState = async () => {
            if (isSignedIn) {
                try {
                    setLoading(true);

                    const token = await getToken();
                    if (!token) throw new Error('Failed to retrieve authentication token.');

                    const response = await fetch('https://swimming-pool-api.onrender.com/api/users/getState', {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fetch user state.');
                    }

                    const data = await response.json();
                    console.log('User state fetched successfully:', data);

                    setUserState(data);

                    if (data.state === 1) {
                        router.replace({
                            pathname: '/studentProfile',
                            params: { details: JSON.stringify(data.details) },
                        });
                    } else if (data.state === 2) {
                        router.replace({
                            pathname: '/instructorProfile',
                            params: { details: JSON.stringify(data.details) },
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user state:', error);
                    Alert.alert('Error', error instanceof Error ? error.message : "Failed to add lesson." || 'Failed to fetch user state. Please try again later.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserState();
    }, [isSignedIn]);

    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#008080" style={styles.spinner} />
                <Text style={styles.loadingText}>Loading your profile, please wait...</Text>
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                header: ({ options }) => (
                    <CustomHeader
                        title={options.headerTitle || 'Default Title'}
                        headerRight={<LogoutButton />}
                        backgroundColor="#8A2BE2"
                    />
                ),
                tabBarStyle: { height: 60 },
                tabBarLabelStyle: { fontSize: 14 },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    headerTitle: 'Home',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                    tabBarLabel: 'Home',
                }}
                redirect={!isSignedIn}
            />

            <Tabs.Screen
                name="registerToService"
                options={{
                    headerTitle: 'Pick Role',
                    tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
                    tabBarLabel: 'Pick Role',
                }}
                redirect={!isSignedIn}
            />
        </Tabs>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
    },
    spinner: {
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default TabsPage;