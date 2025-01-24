import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {useLocalSearchParams, useRouter} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFormData } from "@/components/StudentProvider"
import {useChangeContext} from "@/components/ChangeProvider";
import {useUpdateContext} from "@/components/ProviderBetweenFolders";

type Student = {
    studentId: string;
    studentName: string;
    lessonPreference: string;
};

const AddLessonRequest = () => {
    const { canUpdate, resetUpdates  } = useUpdateContext();
    const { date, instructorId, start, end } = useLocalSearchParams();
    const { studentDetails } = useFormData(); // Access student details
    const { doesChanged, setDoesChanged } = useChangeContext();
    const [loading, setLoading] = useState(false);
    const [sharedStyles, setSharedStyles] = useState<string[]>([]); // Shared styles
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [lessonType, setLessonType] = useState<string | null>(null);
    const [students, setStudents] = useState<{ studentId: string; studentName: string, lessonPreference : string  }[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchInstructorDetails();
    }, [instructorId]);

    useEffect(() => {
        if (start && end) {
            generateTimeSlots(start as string, end as string);
        }

    }, [start, end]);
    useEffect(() => {
        if (selectedStyle && lessonType) {
            fetchStudents();
        }
        else
        {
            setStudents([]);
            setSelectedStudents([]);
        }
    }, [selectedStyle, lessonType]);

    const fetchStudents = async () => {
        if (!selectedStyle || !lessonType) {
            Alert.alert("Error", "Please select a style and lesson type before fetching students.");
            return;
        }

        try {
            setLoadingStudents(true);
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/students/match?style=${selectedStyle}&type=${lessonType}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch students.");
            }

            const data: Student[] = await response.json();

            // Exclude a specific student ID
            const excludedStudentId = studentDetails?._id;

            const filteredData = data.filter((student ) => student.studentId !== excludedStudentId);

            setStudents(filteredData); // Ensure `data` is an array
        } catch (error) {
            Alert.alert("Error", "Failed to fetch students.");
        } finally {
            setLoadingStudents(false);
        }
    };

    const getStudentBackgroundColor = (student: { lessonPreference: string }) => {
        let backgroundColor = "#f0f0f0";

        if (lessonType === "private") {
            switch (student.lessonPreference) {
                case "private":
                    backgroundColor = "#ffffff";
                    break;
                case "both_prefer_private":
                    backgroundColor = "#e0e0e0";
                    break;
                case "both_prefer_group":
                    backgroundColor = "#c0c0c0";
                    break;
                case "group":
                    backgroundColor = "#a0a0a0";
                    break;
            }
        } else if (lessonType === "group") {
            switch (student.lessonPreference) {
                case "group":
                    backgroundColor = "#ffffff";
                    break;
                case "both_prefer_group":
                    backgroundColor = "#e0e0e0";
                    break;
                case "both_prefer_private":
                    backgroundColor = "#c0c0c0";
                    break;
                case "private":
                    backgroundColor = "#a0a0a0";
                    break;
            }
        }

        return backgroundColor;
    };

    const fetchInstructorDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors/${instructorId}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch instructor details.");
            }

            const instructor = await response.json();
            filterSharedStyles(instructor.expertise);
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to fetch instructor details."
            );
        } finally {
            setLoading(false);
        }
    };

    const filterSharedStyles = (instructorExpertise: string[]) => {
        const preferredStyles = studentDetails!.preferredStyles || [];
        const commonStyles = instructorExpertise.filter((style) =>
            preferredStyles.includes(style)
        );
        setSharedStyles(commonStyles);
    };

    const generateTimeSlots = (start: string, end: string) => {
        const slots: string[] = [];
        let [currentHour, currentMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        while (
            currentHour < endHour ||
            (currentHour === endHour && currentMinute <= endMinute)
            ) {
            slots.push(
                `${currentHour.toString().padStart(2, "0")}:${currentMinute
                    .toString()
                    .padStart(2, "0")}`
            );
            currentMinute += 15;
            if (currentMinute === 60) {
                currentMinute = 0;
                currentHour += 1;
            }
        }
        setTimeSlots(slots);
    };

    const handleAddRequest = async () => {
        if (!startTime || !endTime || !selectedStyle) {
            Alert.alert("Error", "Please fill all fields before adding a lesson.");
            return;
        }

        try {
            setLoading(true);

            // Start with an array containing only the current user's student ID
            const studentIds = [studentDetails!._id]; // Add the user's ID first

            // Use the existing date and combine it with startTime and endTime
            const startDateTime = new Date(date as string);
            const endDateTime = new Date(date as string);

            // Set the time part for start and end
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            startDateTime.setHours(startHour, startMinute, 0, 0);
            endDateTime.setHours(endHour, endMinute, 0, 0);

            // Add the selected student IDs to the array
            selectedStudents.forEach((studentId) => {
                studentIds.push(studentId);
            });
            console.log(date);
            const body = {
                instructor: instructorId, // Instructor ID
                students: studentIds, // Array of student IDs
                style: selectedStyle, // Swimming style
                type: lessonType, // Lesson type ("private" or "group")
                startTime: startDateTime.toISOString(), // Convert to ISO format
                endTime: endDateTime.toISOString(), // Convert to ISO format
                status: "pending", // Default status
            };

            const response = await fetch(
                "https://swimming-pool-api.onrender.com/api/lesson-requests",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Failed to add lesson request.`;
                throw new Error(errorMessage); // Throw error with detailed message
            }
            resetUpdates();
            Alert.alert("Success", "Lesson request added successfully!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to add lesson request."
            );
        } finally {
            setLoading(false);
        }
    };

    return loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF" />
        </View>
    ) : (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Time Slot Picker Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pick Start and End Time</Text>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={startTime}
                        onValueChange={(value) => setStartTime(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Start Time" value={null} />
                        {timeSlots.map((time, index) => (
                            <Picker.Item key={index} label={time} value={time} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={endTime}
                        onValueChange={(value) => setEndTime(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="End Time" value={null} />
                        {timeSlots.map((time, index) => (
                            <Picker.Item key={index} label={time} value={time} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Style Picker Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pick a Lesson Style</Text>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedStyle}
                        onValueChange={(value) => setSelectedStyle(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Style" value={null} />
                        {sharedStyles.map((style, index) => (
                            <Picker.Item key={index} label={style} value={style} />
                        ))}
                    </Picker>
                </View>
            </View>
            {/* Select Lesson Type */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select Lesson Type</Text>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={lessonType}
                        onValueChange={(value) => setLessonType(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Lesson Type" value={null} />
                        {(() => {
                            switch (studentDetails?.lessonPreference) {
                                case "both_prefer_group":
                                    return (
                                        <>
                                            <Picker.Item label="Private" value="private" />
                                            <Picker.Item label="Group" value="group" />
                                        </>
                                    );
                                case "both_prefer_private":
                                    return (
                                        <>
                                            <Picker.Item label="Private" value="private" />
                                            <Picker.Item label="Group" value="group" />
                                        </>
                                    );
                                case "private":
                                    return <Picker.Item label="Private" value="private" />;
                                case "group":
                                    return <Picker.Item label="Group" value="group" />;
                                default:
                                    return <Picker.Item label="No preference available" value={null} />;
                            }
                        })()}
                    </Picker>
                </View>
            </View>

            {/* Students Picker */}
            {loadingStudents ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1E90FF" />
                    <Text style={styles.loadingText}>Loading students...</Text>
                </View>
            ) : (
                <>
                    {/* Conditional Header and Students List for Lesson Type */}
                    {lessonType && lessonType !== "private" && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Pick Students</Text>
                            </View>
                            {/* Students List */}
                            {students && students.length > 0 ? (
                                <ScrollView contentContainerStyle={styles.studentBoxContainer}>
                                    {students.map((student) => {
                                        let backgroundColor = "#f0f0f0"; // Default light gray

                                        // Adjust background colors based on the selected lesson type
                                        if (lessonType === "private") {
                                            switch (student.lessonPreference) {
                                                case "private":
                                                    backgroundColor = "#ffffff"; // Whitest for private
                                                    break;
                                                case "both_prefer_private":
                                                    backgroundColor = "#e0e0e0"; // Slightly darker
                                                    break;
                                                case "both_prefer_group":
                                                    backgroundColor = "#c0c0c0"; // Darker
                                                    break;
                                                case "group":
                                                    backgroundColor = "#a0a0a0"; // Darkest for group
                                                    break;
                                            }
                                        } else if (lessonType === "group") {
                                            switch (student.lessonPreference) {
                                                case "group":
                                                    backgroundColor = "#ffffff"; // Whitest for group
                                                    break;
                                                case "both_prefer_group":
                                                    backgroundColor = "#e0e0e0"; // Slightly darker
                                                    break;
                                                case "both_prefer_private":
                                                    backgroundColor = "#c0c0c0"; // Darker
                                                    break;
                                                case "private":
                                                    backgroundColor = "#a0a0a0"; // Darkest for private
                                                    break;
                                            }
                                        }

                                        return (
                                            <Pressable
                                                key={student.studentId}
                                                style={[
                                                    styles.studentBox,
                                                    {
                                                        backgroundColor: selectedStudents.includes(
                                                            student.studentId
                                                        )
                                                            ? "green" // Green when selected
                                                            : backgroundColor, // Dynamic background based on lesson type
                                                        borderColor: selectedStudents.includes(
                                                            student.studentId
                                                        )
                                                            ? "darkgreen"
                                                            : "#ccc", // Dynamic border
                                                    },
                                                ]}
                                                onPress={() => {
                                                    if (selectedStudents.includes(student.studentId)) {
                                                        setSelectedStudents((prev) =>
                                                            prev.filter(
                                                                (id) => id !== student.studentId
                                                            )
                                                        );
                                                    } else {
                                                        setSelectedStudents((prev) => [
                                                            ...prev,
                                                            student.studentId,
                                                        ]);
                                                    }
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.studentText,
                                                        selectedStudents.includes(
                                                            student.studentId
                                                        ) && styles.selectedStudentText,
                                                    ]}
                                                >
                                                    {student.studentName}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <Text style={styles.noStudentsText}>No students available</Text>
                            )}
                        </View>
                    )}
                </>

            )}


            {/* Add Request Button */}
            <View style={styles.center}>
                <Pressable
                    onPress={handleAddRequest}
                    style={styles.circleAddButton}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="add-outline" size={30} color="#fff" />
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
        backgroundColor: "#228B22",
        padding: 15,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "center" },
    pickerContainer: {
        backgroundColor: "#fff",
        padding: 10,
        margin: 5,
        borderRadius: 10,

    },
    studentBoxContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        padding: 5,
        backgroundColor:"#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    picker: {
        height: 60,backgroundColor: "#f9f9f9",
        color: "#333",borderColor: "#ccc", borderWidth: 1, borderRadius: 10
    },
    center: { alignItems: "center", marginTop: 20 },
    circleAddButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#228B22",
        justifyContent: "center",
        alignItems: "center",
    },
    studentItem: {
        padding: 10,
        marginVertical: 5,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
    },
    selectedStudentItem: {
        backgroundColor: "#1E90FF",
        color: "#fff",
    },
    studentBox: {
        padding: 15,
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
        margin: 5,
        minWidth: 100,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#ccc",
        borderWidth: 1,
    },
    selectedStudentBox: {
        backgroundColor: "green",
        borderColor: "darkgreen",
    },
    studentText: {
        fontSize: 14,
        color: "#000",
    },
    selectedStudentText: {
        color: "#fff",
        fontWeight: "bold",
    },
    noStudentsText: {
        fontSize: 16,
        color: "#999",
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 10,
    },
    loadingText: {
        fontSize: 16,
        color: "#999",
        marginTop: 5,
    },

    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default AddLessonRequest;
