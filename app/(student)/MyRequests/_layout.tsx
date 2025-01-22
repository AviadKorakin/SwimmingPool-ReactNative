import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {ChangeProvider} from "@/components/ChangeProvider";

const LessonManagerInstructorLayout = () => {
    const router = useRouter(); // Use router for back navigation

    return (
        <ChangeProvider>
            <Stack
                screenOptions={{
                    headerShown: false, // Hide default headers globally
                }}
                initialRouteName="showMyRequests" // Set the initial route to "MyCalendar"
            >
                {/* Pool Calendar Screen */}
                <Stack.Screen name="showMyRequests"/>

                {/*add Request Lesson with back button */}
                <Stack.Screen
                    name="addRequestLesson"
                    options={{
                        headerShown: true, // Show a header only for addLesson
                        header: () => (
                            <Pressable
                                style={styles.backButtonContainer}
                                onPress={() => router.back()}
                            >
                                <Ionicons
                                    name="arrow-back-outline"
                                    size={24}
                                    color="#228B22"
                                    style={styles.backButton}
                                />
                            </Pressable>
                        ),
                    }}
                />
            </Stack>
        </ChangeProvider>
    );
};

const styles = StyleSheet.create({
    backButtonContainer: {
        height: 50,
        backgroundColor: '#f5f5f5', // Background color for the header
        justifyContent: 'center',
        paddingLeft: 15, // Padding for the back button
    },
    backButton: {
        alignSelf: 'flex-start',
    },
});

export default LessonManagerInstructorLayout;
