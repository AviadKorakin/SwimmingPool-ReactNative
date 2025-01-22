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
import { useChangeContext } from "@/components/ChangeProvider";

const RemoveLesson = () => {
    const router = useRouter();
    const { lesson } = useLocalSearchParams();
    const { doesChanged, setDoesChanged } = useChangeContext();
    const [loading, setLoading] = useState(false); // Add loading state

    const handleRemoveLesson = async () => {
        try {
            setLoading(true); // Start loading
            const response = await fetch(`https://swimming-pool-api.onrender.com/api/lessons/${lesson}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete the lesson.");
            }

            setDoesChanged(true);
            Alert.alert("Success", "The lesson has been deleted.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete the lesson.");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Are you sure you want to cancel the lesson?</Text>
            <Text style={styles.warningText}>
                Please take care, we can’t recover this step.
            </Text>
            <Pressable
                style={styles.trashButton}
                onPress={handleRemoveLesson}
                disabled={loading} // Disable button while loading
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="trash" size={30} color="#fff" />
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
    trashButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#F44336", // Red color for delete
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default RemoveLesson;
