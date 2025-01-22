import React, {useEffect, useState} from "react";
import {
    View,
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import {useFormData} from "@/components/StudentProvider";

const swimmingStyles = ["freestyle", "breaststroke", "butterfly", "backstroke"];

const lessonPreferences = [
    { label: "Private", value: "private" },
    { label: "Group", value: "group" },
    { label: "Both Prefer Private", value: "both_prefer_private" },
    { label: "Both Prefer Group", value: "both_prefer_group" },
];

const StudentProfile = () => {
    const { getToken } = useAuth();
    const router = useRouter();
    const { details } = useLocalSearchParams();
    const {studentDetails, setStudentDetails } = useFormData();
    const jsonDetails = details ? JSON.parse(details as string) : null;
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (jsonDetails && !studentDetails) {
            setStudentDetails(jsonDetails);
        }
    }, []);
    const currentDetails = studentDetails || jsonDetails;
    const [firstName, setFirstName] = useState(currentDetails?.firstName || "");
    const [lastName, setLastName] = useState(currentDetails?.lastName || "");
    const [preferredStyles, setPreferredStyles] = useState<string[]>(currentDetails?.preferredStyles || [""]);
    const [lessonPreference, setLessonPreference] = useState(currentDetails?.lessonPreference || "");

    const handleAddStyle = () => setPreferredStyles([...preferredStyles, ""]);
    const handleRemoveStyle = (index: number) => setPreferredStyles(preferredStyles.filter((_, i) => i !== index));
    const handleUpdateStyle = (value: string, index: number) => {
        const updatedStyles = [...preferredStyles];
        updatedStyles[index] = value;
        setPreferredStyles(updatedStyles);
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);

            const body = {
                firstName,
                lastName,
                preferredStyles,
                lessonPreference,
            };

            const token = await getToken();
            if (!token) {
                throw new Error("Authentication token is missing.");
            }

            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/students/${currentDetails._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Failed to update student details`;
                throw new Error(errorMessage); // Throw error with detailed message
            }

            const updatedData = await response.json();
            setFirstName(updatedData.firstName);
            setLastName(updatedData.lastName);
            setPreferredStyles(updatedData.preferredStyles);
            setLessonPreference(updatedData.lessonPreference);
            setStudentDetails(updatedData);
            Alert.alert("Success", "Student details updated successfully!");
        } catch (error) {
            console.error("Error updating details:", error);
            // @ts-ignore
            Alert.alert("Error", error.message || "Failed to update details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Green Title Header */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>Hello 👋</Text>
                </View>
                <TextInput
                    style={styles.staticInput}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                />
            </View>

            {/* Last Name Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Last Name</Text>
                </View>
                <TextInput
                    style={styles.staticInput}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>

            {/* Swimming Styles Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Preferred Swimming Styles</Text>
                </View>
                {preferredStyles.map((style, index) => (
                    <View key={index} style={styles.card}>
                        <Picker
                            selectedValue={style}
                            style={[styles.input]}
                            onValueChange={(value) => handleUpdateStyle(value, index)}
                        >
                            <Picker.Item label="Select Style" value="" />
                            {swimmingStyles.map((s) => (
                                <Picker.Item key={s} label={s} value={s} />
                            ))}
                        </Picker>
                        <Pressable
                            style={styles.trashIcon}
                            onPress={() => handleRemoveStyle(index)}
                        >
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </Pressable>
                    </View>
                ))}
                <Pressable onPress={handleAddStyle}>
                    <Text style={styles.addButton}>+ Add Style</Text>
                </Pressable>
            </View>

            {/* Lesson Preferences Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lesson Preference</Text>
                </View>
                <Picker
                    selectedValue={lessonPreference}
                    style={[styles.input]}
                    onValueChange={(value) => setLessonPreference(value)}
                >
                    <Picker.Item label="Select Lesson Preference" value="" />
                    {lessonPreferences.map((pref) => (
                        <Picker.Item key={pref.value} label={pref.label} value={pref.value} />
                    ))}
                </Picker>
            </View>

            {/* Circular Update Button */}
            <View style={styles.center}>
                <Pressable onPress={handleUpdate} style={styles.circleUpdateButton}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Ionicons name="sync-outline" size={30} color="#fff" />
                    )}
                </Pressable>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20 },
    sectionContainer: {
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    sectionHeader: {
        backgroundColor: "#228B22", // Lime Green color
        padding: 15,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
    card: {
        padding: 15,
        paddingRight: 50, // Extra space for the trash icon
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        height: 60,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#f9f9f9",
    },
    trashIcon: {
        position: "absolute",
        right: 15,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
    },
    addButton: {
        fontSize: 16,
        color: "#228B22",
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 10,
        textAlign: "center",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    circleUpdateButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#228B22", // Lime Green color
        justifyContent: "center",
        alignItems: "center",
    },
    staticInput: {
        width: "100%",
        height: 80,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: "#f9f9f9",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 20,
    },
    title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
});

export default StudentProfile;
