import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import {Picker} from "@react-native-picker/picker";
import {useAuth} from "@clerk/clerk-expo";
import {useLocalSearchParams} from "expo-router";
import {useFormData} from "@/components/InstructorProvider";
import {Ionicons} from "@expo/vector-icons";
import {useChangeContext} from "@/components/ChangeProvider";

interface TimeSlot {
    time: string;
    status: "free" | "partial" | "busy";
}

const AddLesson = () => {
    const {doesChanged, setDoesChanged} = useChangeContext();
    const {date} = useLocalSearchParams();
    const {instructorDetails} = useFormData();
    const {getToken} = useAuth();
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [savingData, setSavingData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeline, setTimeline] = useState<TimeSlot[]>([]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableHours, setAvailableHours] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [lessonType, setLessonType] = useState<string | null>(null);
    const [students, setStudents] = useState<{ studentId: string; studentName: string, lessonPreference : string }[]>(
        []
    );
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    useEffect(() => {
        fetchAvailableHours();
    }, []);

    useEffect(() => {
        if (selectedStyle && lessonType) {
            fetchStudents();
        }
    }, [selectedStyle, lessonType]);

    const fetchStudents = async () => {
        if (!selectedStyle || !lessonType) {
            Alert.alert("Error", "Please select a style and lesson type before fetching students.");
            return;
        }

        try {
            setLoadingStudents(true);
            const token = await getToken();
            if (!token) {
                throw new Error("Authentication token is missing.");
            }

            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/students/match?style=${selectedStyle}&type=${lessonType}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch students.");
            }

            const data = await response.json();
            console.log("Fetched Students:", data);
            setStudents(data); // Ensure `data` is an array
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to add lesson." || "Failed to fetch students.");
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchAvailableHours = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                throw new Error("Authentication token is missing.");
            }
            console.log(`https://swimming-pool-api.onrender.com/api/instructors/available-hours?instructorId=${instructorDetails?._id}&date=${date}`)
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors/available-hours?instructorId=${instructorDetails?._id}&date=${date}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch available hours.");
            }
            const data = await response.json();
            const availableHours = data.availableHours;
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayString = daysOfWeek[new Date(date as string).getDay()];
            populateTimeline(availableHours,dayString);
            setAvailableHours(availableHours.map((slot: { start: any; end: any; }) => `${slot.start} - ${slot.end}`));
        } catch (error) {
            console.error(error);
            // @ts-ignore
            Alert.alert("Error", error.message || "Failed to fetch available hours.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddLesson = async () => {
        if (!selectedTime || !startTime || !endTime || !selectedStyle || !lessonType ) {
            Alert.alert("Error", "Please fill in all fields before adding a lesson.");
            return;
        }

        try {
            setSavingData(true); // Start global loading

            const token = await getToken();
            if (!token) {
                throw new Error("Authentication token is missing.");
            }

            // Combine date and time into Date objects
            const combineDateAndTime = (dateString: string, timeString: string): Date => {
                const [hours, minutes] = timeString.split(":").map(Number);
                const dateObject = new Date(dateString);
                dateObject.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, and milliseconds
                return dateObject;
            };
            const fullStartTime = combineDateAndTime(date as string, startTime);
            const fullEndTime = combineDateAndTime(date as string, endTime);

            const body = {
                instructor: instructorDetails?._id,
                students: selectedStudents,
                style: selectedStyle,
                type: lessonType,
                startTime: fullStartTime,
                endTime: fullEndTime,
            };
            console.log()
            const response = await fetch("https://swimming-pool-api.onrender.com/api/lessons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add lesson.");
            }

            // Success: Reset inputs and refresh data
            setSelectedTime(null);
            setStartTime(null);
            setEndTime(null);
            setSelectedStyle(null);
            setLessonType(null);
            setSelectedStudents([]);
            setDoesChanged(true);
            await fetchAvailableHours(); // Re-fetch data
            await fetchStudents();

            Alert.alert("Success", "Lesson added successfully!");
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to add lesson."
            );
        } finally {
            setSavingData(false); // Stop global loading
        }
    };


    const populateTimeline = (hours: { start: string; end: string }[],day: string) => {
        if (!instructorDetails) {
            setTimeline([]);
            return;
        }
        const hoursForDay = instructorDetails!.availableHours.filter((entry) => entry.day === day);

        if (!hoursForDay.length) {
            setTimeline([]);
            return;
        }

        // Find the earliest start time and the latest end time manually
        let earliestStart = hoursForDay[0].start;
        let latestEnd = hoursForDay[0].end;

        hoursForDay.forEach(({ start, end }) => {
            if (start < earliestStart) earliestStart = start;
            if (end > latestEnd) latestEnd = end;
        });

        const [startHour, startMinute] = earliestStart.split(":").map(Number);
        const [endHour, endMinute] = latestEnd.split(":").map(Number);

        // Create slots for the entire range
        const slots: TimeSlot[] = [];
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (
            currentHour < endHour ||
            (currentHour === endHour && currentMinute < endMinute)
            ) {
            const time = `${currentHour.toString().padStart(2, "0")}:${currentMinute
                .toString()
                .padStart(2, "0")}`;
            slots.push({ time, status: "busy" }); // Initialize all slots as "busy"

            currentMinute += 15;
            if (currentMinute === 60) {
                currentMinute = 0;
                currentHour += 1;
            }
            }

        console.log("Initial Slots:", slots);

        // Mark slots based on available hours
        hours.forEach(({start, end}) => {
            slots.forEach((slot, index) => {
                const slotTime = slot.time;

                // Fully within the available range is "free"
                if (slotTime >= start && slotTime < end) {
                    slot.status = "free";
                }
                // Partial overlap at the start or end
                else if (
                    (slotTime < start && slots[index + 1]?.time > start) || // Slot ends after start
                    (slotTime < end && slots[index + 1]?.time > end)       // Slot ends after end
                ) {
                    slot.status = "partial";
                }
            });
        });

        console.log("Updated Slots:", slots);

        setTimeline(slots);
    };


    const generateTimeSlots = (start: string, end: string) => {
        const adjustTo15Minutes = (time: string): string => {
            let [hour, minute] = time.split(":").map(Number);
            minute = Math.ceil(minute / 15) * 15;
            if (minute === 60) {
                minute = 0;
                hour += 1;
            }
            return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        };

        const adjustedStart = adjustTo15Minutes(start);
        const adjustedEnd = adjustTo15Minutes(end);

        const slots = [];
        let [currentHour, currentMinutes] = adjustedStart.split(":").map(Number);
        const [endHour, endMinutes] = adjustedEnd.split(":").map(Number);

        while (currentHour < endHour || (currentHour === endHour && currentMinutes <= endMinutes)) {
            slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`);
            currentMinutes += 15;

            if (currentMinutes === 60) {
                currentMinutes = 0;
                currentHour += 1;
            }
        }

        setTimeSlots(slots);
        setStartTime(slots[0]);
        setEndTime(slots[slots.length - 1]);
    };

    const handleTimeSelection = (value: string | null) => {
        setSelectedTime(value);
        if (value) {
            const [start, end] = value.split(" - ");
            generateTimeSlots(start, end);
        } else {
            setTimeSlots([]);
            setStartTime(null);
            setEndTime(null);
        }
    };

    return loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF"/>
        </View>
    ) : (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Timeline Container */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                </View>
                <View style={styles.timelineRow}>
                    {timeline.map((slot, index) => (
                        <View
                            key={index}
                            style={[
                                styles.timelineSlot,
                                slot.status === "free"
                                    ? styles.freeSlot
                                    : slot.status === "partial"
                                        ? styles.partialSlot
                                        : styles.busySlot,
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Lesson Time Picker */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pick a Time Section</Text>
                </View>
                <Picker
                    selectedValue={selectedTime}
                    onValueChange={handleTimeSelection}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Time" value={null}/>
                    {availableHours.map((hour, index) => (
                        <Picker.Item key={index} label={hour} value={hour}/>
                    ))}
                </Picker>
            </View>

            {/* Pick Start and End Time */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pick Start and End Time</Text>
                </View>
                <View style={styles.row}>
                    <Picker
                        selectedValue={startTime}
                        onValueChange={(value) => setStartTime(value)}
                        style={[styles.picker, styles.pickerHalf]}
                    >
                        <Picker.Item label="Start" value={null}/>
                        {timeSlots.map((time, index) => (
                            <Picker.Item key={index} label={time} value={time}/>
                        ))}
                    </Picker>
                    <Text style={styles.timeSeparator}>-</Text>
                    <Picker
                        selectedValue={endTime}
                        onValueChange={(value) => setEndTime(value)}
                        style={[styles.picker, styles.pickerHalf]}
                    >
                        <Picker.Item label="End" value={null}/>
                        {timeSlots.map((time, index) => (
                            <Picker.Item key={index} label={time} value={time}/>
                        ))}
                    </Picker>
                </View>
            </View>
            {/* Pick a Lesson Style */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pick a Lesson Style</Text>
                </View>
                <Picker
                    selectedValue={selectedStyle}
                    onValueChange={(value) => setSelectedStyle(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select a style" value={null}/>
                    {instructorDetails?.expertise?.map((style, index) => (
                        <Picker.Item key={index} label={style} value={style}/>
                    ))}
                </Picker>
            </View>
            {/* Select Lesson Type */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select Lesson Type</Text>
                </View>
                <Picker
                    selectedValue={lessonType}
                    onValueChange={(value) => setLessonType(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Lesson Type" value={null}/>
                    <Picker.Item label="Group" value="group"/>
                    <Picker.Item label="Private" value="private"/>
                </Picker>
            </View>
            {loadingStudents ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1E90FF"/>
                    <Text>Loading students...</Text>
                </View>
            ) : (
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pick Students</Text>
                    </View>
                    {students && students.length > 0 ? (
                        lessonType === "private" ? (
                            // Single selection for private lessons
                            <Picker
                                selectedValue={selectedStudents[0] || null}
                                onValueChange={(value) => setSelectedStudents([value!])}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a Student" value={null}/>
                                {students.map((student) => (
                                    <Picker.Item
                                        key={student.studentId}
                                        label={`${student.studentName}`}
                                        value={student.studentId}
                                    />
                                ))}
                            </Picker>
                        ) : (
                            // Multi-selection for group lessons
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
                                                    backgroundColor: selectedStudents.includes(student.studentId)
                                                        ? "green" // Green when selected
                                                        : backgroundColor, // Dynamic background based on lesson type
                                                    borderColor: selectedStudents.includes(student.studentId)
                                                        ? "darkgreen"
                                                        : "#ccc", // Dynamic border
                                                },
                                            ]}
                                            onPress={() => {
                                                if (selectedStudents.includes(student.studentId)) {
                                                    setSelectedStudents((prev) =>
                                                        prev.filter((id) => id !== student.studentId)
                                                    );
                                                } else {
                                                    setSelectedStudents((prev) => [...prev, student.studentId]);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.studentText,
                                                    selectedStudents.includes(student.studentId) && styles.selectedStudentText,
                                                ]}
                                            >
                                                {student.studentName}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )
                    ) : (
                        <Text style={styles.noStudentsText}>No students available</Text> // Display message if no students are available
                    )}
                </View>
            )}
            {/* Add New Button Below All Containers */}
            <View style={styles.center}>
                <Pressable
                    onPress={handleAddLesson}
                    style={styles.circleAddButton}
                    disabled={loading} // Disable button during loading
                >
                    {savingData ? (
                        <ActivityIndicator size="small" color="#fff"/>
                    ) : (
                        <Ionicons name="add-outline" size={30} color="#fff"/>
                    )}
                </Pressable>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {flexGrow: 1, padding: 20},
    sectionContainer: {
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
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
    sectionTitle: {fontSize: 18, fontWeight: "bold", color: "#fff"},
    timelineRow: {
        flexDirection: "row",
        padding: 10,
        flexWrap: "nowrap",
    },

    timelineSlot: {flex: 1, height: 30},
    freeSlot: {backgroundColor: "green"},
    partialSlot: {backgroundColor: "orange"},
    busySlot: {backgroundColor: "red"},
    picker: {height: 60, margin: 10, borderColor: "#ccc", borderWidth: 1, borderRadius: 10,   backgroundColor: "#f9f9f9"},
    pickerHalf: {flex: 1},
    row: {flexDirection: "row", alignItems: "center", justifyContent: "space-between"},
    timeSeparator: {fontSize: 20, fontWeight: "bold", color: "#1E90FF", marginHorizontal: 10},
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
    studentBoxContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    noStudentsText: {
        fontSize: 16,
        color: "#999",
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 10,
    },
    circleAddButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#1E90FF", // Matches the existing color theme
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
});

export default AddLesson;
