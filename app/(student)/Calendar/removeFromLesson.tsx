import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFormData } from "@/components/StudentProvider";
import { useChangeContext } from "@/components/ChangeProvider";

const RemoveFromLesson = () => {
    const router = useRouter();
    const { lesson } = useLocalSearchParams();
    const { doesChanged, setDoesChanged } = useChangeContext();
    const { studentDetails } = useFormData();
    const [loading, setLoading] = useState(false); // Add loading state

    const handleRemoveFromLesson = async () => {
        try {
            setLoading(true); // Start loading

            // Ensure student ID is available
            const studentId = studentDetails?._id;
            if (!studentId) {
                throw new Error("Student ID is missing.");
            }

            // Make the API request
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/students/${studentId}/lessons/${lesson}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Unable to remove your attendance from the lesson. Please try again later.`;
                throw new Error(errorMessage); // Throw error with detailed message
            }

            setDoesChanged(true); // Notify that lessons have changed
            Alert.alert("Success", "You have successfully been removed from the lesson.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unable to remove your attendance from the lesson. Please try again later."
            );
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Are you sure you want to cancel your attendance for this lesson?</Text>
            <Text style={styles.warningText}>
                By proceeding, you will be removed from this lesson.
            </Text>
            <Pressable
                style={styles.removeButton}
                onPress={handleRemoveFromLesson}
                disabled={loading} // Disable button while loading
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="close" size={30} color="#fff" />
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 15,
        textAlign: "center",
    },
    warningText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    removeButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#F44336", // Red color for remove
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default RemoveFromLesson;
