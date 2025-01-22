import React, {useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Pressable} from 'react-native';
import {Tabs, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '@clerk/clerk-expo';
import CustomHeader from "@/components/CustomHeader";
import {InstructorProvider} from "@/components/InstructorProvider";

export const LogoutButton = () => {
    const {signOut} = useAuth();
    const [loading, setLoading] = useState(false);

    const doLogout = async () => {
        setLoading(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff"/>
            </View>
        );
    }

    return (
        <Pressable onPress={doLogout} style={{marginRight: 10}}>
            <Ionicons name="log-out-outline" size={24} color={'#fff'}/>
        </Pressable>
    );
};

const TabsPage = () => {
    const {isSignedIn} = useAuth();
    const router = useRouter();

    return (
        <InstructorProvider>
            <Tabs
                screenOptions={{
                    header: ({options}) => (
                        <CustomHeader
                            title={options.headerTitle || 'Default Title'}
                            headerRight={<LogoutButton/>}
                            backgroundColor="#1E90FF"
                        />
                    ),
                    tabBarStyle: {height: 60},
                    tabBarLabelStyle: {fontSize: 14},
                }}
            >
                {/* Profile Tab */}
                <Tabs.Screen
                    name="instructorProfile"
                    options={{
                        headerTitle: 'Profile',
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="person-circle-outline" size={size} color={color}/>
                        ),
                        tabBarLabel: 'Profile',
                    }}
                    redirect={!isSignedIn}
                />

                {/* Pool Calendar  Tab */}
                <Tabs.Screen
                    name="Calendar"
                    options={{
                        headerTitle: 'Calendar',
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="calendar-outline" size={size} color={color}/>
                        ),
                        tabBarLabel: 'Calendar',
                    }}
                    redirect={!isSignedIn}
                />
                {/* Requests  Tab */}
                <Tabs.Screen
                    name="LessonRequests"
                    options={{
                        headerTitle: 'Lesson Requests',
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="clipboard-outline" size={size} color={color}/>
                        ),
                        tabBarLabel: 'Requests',
                    }}
                    redirect={!isSignedIn}
                />
            </Tabs>
        </InstructorProvider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
});

export default TabsPage;
