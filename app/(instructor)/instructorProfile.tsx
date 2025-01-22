import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { useFormData } from "@/components/InstructorProvider";

const swimmingStyles = ["freestyle", "breaststroke", "butterfly", "backstroke"];
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeOptions = Array.from({ length: 24 }, (_, i) =>
    ["00", "15", "30", "45"].map((m) => `${i.toString().padStart(2, "0")}:${m}`)
).flat();

interface AvailableHour {
    day: string;
    start: string;
    end: string;
}

const InstructorProfile = () => {
    const { getToken } = useAuth();
    const { details } = useLocalSearchParams();
    const { instructorDetails, setInstructorDetails } = useFormData();
    const jsonDetails = details ? JSON.parse(details as string) : null;

    useEffect(() => {
        if (jsonDetails && !instructorDetails) {
            setInstructorDetails(jsonDetails);
        }
    }, []);

    const currentDetails = instructorDetails || jsonDetails;

    const initializeAvailableHours = () => {
        if (!currentDetails?.availableHours || !Array.isArray(currentDetails.availableHours)) {
            return [{ day: "", start: "", end: "" }];
        }
        return currentDetails.availableHours.map(({ day, start, end }: AvailableHour) => ({
            day: day || "",
            start: start || "",
            end: end || "",
        }));
    };

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(currentDetails?.name || "");
    const [expertise, setExpertise] = useState<string[]>(currentDetails?.expertise || [""]);
    const [availableHours, setAvailableHours] = useState<AvailableHour[]>(initializeAvailableHours());

    const handleAddExpertise = () => setExpertise([...expertise, ""]);
    const handleRemoveExpertise = (index: number) =>
        setExpertise(expertise.filter((_, i) => i !== index));
    const handleUpdateExpertise = (value: string, index: number) => {
        const updatedExpertise = [...expertise];
        updatedExpertise[index] = value;
        setExpertise(updatedExpertise);
    };

    const handleAddAvailableHour = () =>
        setAvailableHours([...availableHours, { day: "", start: "", end: "" }]);
    const handleRemoveAvailableHour = (index: number) =>
        setAvailableHours(availableHours.filter((_, i) => i !== index));
    const handleUpdateAvailableHour = (index: number, field: keyof AvailableHour, value: string) => {
        const updatedHours = [...availableHours];
        updatedHours[index][field] = value;
        setAvailableHours(updatedHours);
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);

            const body = {
                name,
                expertise,
                availableHours,
            };

            const token = await getToken();
            if (!token) {
                throw new Error("Authentication token is missing.");
            }

            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors/${currentDetails._id}`,
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
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update instructor details");
            }

            const updatedData = await response.json();
            setName(updatedData.name);
            setExpertise(updatedData.expertise || []);
            setAvailableHours(updatedData.availableHours || []);
            setInstructorDetails(updatedData);
            Alert.alert("Success", "Instructor details updated successfully!");
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
            {/* Blue Title Header */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>Hello 👋</Text>
                </View>
                <TextInput
                    style={styles.staticInput}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Expertise Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Styles of Expertise</Text>
                </View>
                {expertise.map((exp: string, index: number) => (
                    <View key={index} style={styles.card}>
                        <Picker
                            selectedValue={exp}
                            style={[styles.input]}
                            onValueChange={(value) => handleUpdateExpertise(value, index)}
                        >
                            <Picker.Item label="Select Expertise" value="" />
                            {swimmingStyles.map((s) => (
                                <Picker.Item key={s} label={s} value={s} />
                            ))}
                        </Picker>
                        <Pressable
                            style={styles.trashIcon}
                            onPress={() => handleRemoveExpertise(index)}
                        >
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </Pressable>
                    </View>
                ))}
                <Pressable onPress={handleAddExpertise}>
                    <Text style={styles.addButton}>+ Add Expertise</Text>
                </Pressable>
            </View>

            {/* Available Hours Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Available Hours</Text>
                </View>
                {availableHours.map((hour: AvailableHour, index: number) => (
                    <View key={index} style={styles.cardSelect}>
                        <Picker
                            selectedValue={hour.day}
                            style={[styles.input]}
                            onValueChange={(value) => handleUpdateAvailableHour(index, "day", value)}
                        >
                            <Picker.Item label="Select Day" value="" />
                            {daysOfWeek.map((day) => (
                                <Picker.Item key={day} label={day} value={day} />
                            ))}
                        </Picker>
                        <View style={styles.row}>
                            <Picker
                                selectedValue={hour.start}
                                style={[styles.input, { flex: 1, marginRight: 5 }]}
                                onValueChange={(value) => handleUpdateAvailableHour(index, "start", value)}
                            >
                                <Picker.Item label="Start Time" value="" />
                                {timeOptions.map((time) => (
                                    <Picker.Item key={time} label={time} value={time} />
                                ))}
                            </Picker>
                            <Picker
                                selectedValue={hour.end}
                                style={[styles.input, { flex: 1 }]}
                                onValueChange={(value) => handleUpdateAvailableHour(index, "end", value)}
                            >
                                <Picker.Item label="End Time" value="" />
                                {timeOptions.map((time) => (
                                    <Picker.Item key={time} label={time} value={time} />
                                ))}
                            </Picker>
                        </View>
                        <Pressable
                            style={[styles.trashIcon, { top: 20, right: 10 }]}
                            onPress={() => handleRemoveAvailableHour(index)}
                        >
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </Pressable>
                    </View>
                ))}
                <Pressable onPress={handleAddAvailableHour}>
                    <Text style={styles.addButton}>+ Add Available Hour</Text>
                </Pressable>
            </View>

            {/* Update Button */}
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
        backgroundColor: "#1E90FF",
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
        flexDirection: "row", // Aligns content horizontally
        alignItems: "center", // Vertically centers content
    },
    cardSelect: {
        padding: 15,
        paddingRight: 50, // Extra space for the trash icon
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        position: "relative",
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
    row: { flexDirection: "row", marginTop: 10 },
    addButton: {
        fontSize: 16,
        color: "#1E90FF",
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
        backgroundColor: "#1E90FF", // Replace this with your preferred color if different
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
        fontSize: 20
    },
    title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
});

export default InstructorProfile;
