import React, {useCallback, useEffect, useState} from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Pressable,
} from "react-native";
import {ILesson, WeeklyLessonData, WeeklyStudentLessonData} from "@/models/lesson";
import {useFocusEffect, useRouter} from "expo-router";
import {useFormData} from "@/components/StudentProvider";
import {Ionicons} from "@expo/vector-icons";
import {useChangeContext} from "@/components/ChangeProvider";
import {
    useUpdateContext
} from "@/components/ProviderBetweenFolders";

const colors = [
    "#FFDEAD", // Navajo White
    "#87CEEB", // Sky Blue
    "#98FB98", // Pale Green
    "#FFD700", // Gold
    "#7FFFD4", // Aquamarine
    "#40E0D0", // Turquoise
    "#FFDAB9", // Peach Puff
    "#ffba5b", // Dark Orange (light enough)
    "#f6baf6", // Plum
];

let colorCounter = 0;

const MyCalendar = () => {
    const { doesChanged, setDoesChanged } = useChangeContext();
    const { canUpdate, resetUpdates  } = useUpdateContext();
    const {studentDetails, setStudentDetails} = useFormData();
    const [weeklyLessons, setWeeklyLessons] = useState<WeeklyStudentLessonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [todayDate, setTodayDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const [instructors, setInstructors] = useState<{ _id: string; name: string }[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingInstructors, setLoadingInstructors] = useState(false);
    const className = "MyCalendar";


    const fetchInstructors = async (page: number = 1) => {
        try {
            setLoadingInstructors(true);
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors?page=${page}&limit=4`
            );
            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Failed to fetch instructors.`;
                throw new Error(errorMessage); // Throw error with detailed message
            }

            const data = await response.json();
            setInstructors(data.instructors);
            setTotalPages(Math.ceil(data.total / 4)); // Calculate total pages based on the total count
        } catch (err) {
            console.error("Error fetching instructors:", err);
        } finally {
            setLoadingInstructors(false);
        }
    };


    const fetchWeeklyLessons =async (date: Date) => {
        try {
            setLoading(true);

            // Get the student ID from studentDetails
            const studentId = studentDetails?._id;

            if (!studentId) {
                throw new Error("Student ID is missing");
            }
            const body: Record<string, any> = {
                date: date.toISOString(),
                studentId: studentId,
            };
            if (selectedInstructors.length > 0) {
                body.instructorId = selectedInstructors;
            }
            console.log(body);

            const response = await fetch(`https://swimming-pool-api.onrender.com/api/lessons/student-weekly`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Failed to fetch weekly lessons`;
                throw new Error(errorMessage); // Throw error with detailed message
            }



            // Assume the response matches the WeeklyLessonData type
            const data: WeeklyStudentLessonData = await response.json();
            // Add colors and organize data
            const lessonsWithMetadata: WeeklyStudentLessonData = Object.keys(data).reduce(
                (acc, day) => {
                    // Use type assertion to ensure `day` is a key of WeeklyLessonData
                    const dayKey = day as keyof WeeklyStudentLessonData;

                    const dayData = data[dayKey];
                    const lessonsWithColors = dayData.lessons.map((lesson: ILesson) => ({
                        ...lesson,
                        color: getNextColor(),
                    }));

                    acc[dayKey] = {
                        ...dayData,
                        lessons: lessonsWithColors,
                    };

                    return acc;
                },
                {} as WeeklyStudentLessonData
            );
            console.log(lessonsWithMetadata);
            setWeeklyLessons(lessonsWithMetadata);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    const getNextColor = () => {
        const color = colors[colorCounter % colors.length]; // Cycle through colors
        colorCounter++; // Increment the counter
        return color;
    };

    useEffect(() => {
        fetchInstructors(currentPage);
    }, [currentPage]);

    useEffect(() => {
        fetchWeeklyLessons(currentDate);
    }, [currentDate, selectedInstructors]);

    useEffect(() => {
        if (doesChanged) {
            fetchWeeklyLessons(currentDate); // Refresh lessons
            setDoesChanged(false); // Reset the state after handling the change
        }
    }, [doesChanged]);

    useFocusEffect(
        useCallback(() => {
            console.log("Checking for updates...");
            if (canUpdate(className)) {
                console.log(`Fetching data for ${className}`);
                fetchWeeklyLessons(currentDate);
            } else {
                console.log(`${className} has already been updated.`);
            }
        }, [currentDate]) // Ensures this runs only when the screen is focused
    );

    const handleWeekChange = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + direction * 7); // Move by a week
        setCurrentDate(newDate);
    };


    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getWeekRange = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Move to Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Move to Saturday
        return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    };

    const handlePageChange = (direction: "left" | "right") => {
        setCurrentPage((prev) => {
            const newPage = direction === "left" ? prev - 1 : prev + 1;
            return Math.max(1, Math.min(newPage, totalPages)); // Ensure page is within range
        });
    };
    const toggleInstructorSelection = (instructorId: string) => {
        setSelectedInstructors((prev) =>
            prev.includes(instructorId)
                ? prev.filter((id) => id !== instructorId) // Deselect
                : [...prev, instructorId] // Select
        );
    };

    const renderInstructors = () => (
        <View style={styles.instructorContainer}>
            {/* Previous Page Button */}
            <Pressable
                onPress={() => handlePageChange("left")}
                style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                disabled={currentPage === 1}
            >
                <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentPage === 1 ? "#ccc" : "#000"}
                />
            </Pressable>

            {/* Instructors List */}
            <ScrollView horizontal contentContainerStyle={styles.instructorList}>
                {instructors.map((instructor) => (
                    <Pressable
                        key={instructor._id}
                        style={[
                            styles.instructorButton,
                            selectedInstructors.includes(instructor._id) &&
                            styles.instructorButtonSelected,
                        ]}
                        onPress={() => toggleInstructorSelection(instructor._id)}
                    >
                        <Text
                            style={[
                                styles.instructorButtonText,
                                selectedInstructors.includes(instructor._id) &&
                                styles.instructorButtonTextSelected,
                            ]}
                        >
                            {instructor.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Next Page Button */}
            <Pressable
                onPress={() => handlePageChange("right")}
                style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                disabled={currentPage === totalPages}
            >
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={currentPage === totalPages ? "#ccc" : "#000"}
                />
            </Pressable>
        </View>
    );

    const toggleExpanded = (lessonId: string) => {
        setExpandedLessons((prev) => ({
            ...prev,
            [lessonId]: !prev[lessonId],
        }));
    };


    const renderDayLessons = (day: string, lessons: ILesson[], date: string, editable: boolean) => (
        <View key={day} style={styles.dayContainer}>
            {/* Day Header */}
            <View style={styles.dayHeaderContainer}>
                {/* Day Title with Icon */}
                <View style={styles.dayHeaderTitle}>
                    <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.dayIcon} />
                    <Text style={styles.dayHeader}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                </View>
            </View>

            {/* Date (Italicized) */}
            <View style={styles.daySecondHeaderContainer}>
                <Text style={styles.dayDate}>
                    {new Date(date).toLocaleDateString("en-GB")}
                </Text>
            </View>


            {/* Lessons */}
            {lessons.length > 0 ? (
                lessons.map((lesson) => (
                    <View
                        key={lesson._id}
                        style={[styles.lessonRow, { backgroundColor: lesson.color }]}
                    >
                        <Pressable
                            onPress={() => toggleExpanded(lesson._id)}
                            style={styles.lessonSummary}
                        >
                            {/* Lesson Title and Buttons */}
                            <View style={styles.lessonTitleContainer}>
                                <Text style={styles.lessonTitle}>
                                    {new Date(lesson.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}{" "}
                                    -{" "}
                                    {new Date(lesson.endTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}
                                </Text>

                                <View style={styles.actionIcons}>
                                    {lesson.assignable && (
                                        <Pressable
                                            style={styles.iconButton}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/Calendar/assignLesson',
                                                    params: { lesson: lesson._id },
                                                })
                                            }
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </Pressable>
                                    )}
                                    {lesson.cancelable && (
                                        <Pressable
                                            style={[styles.iconButton,{ backgroundColor : "#FF6750"}]}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/Calendar/removeFromLesson',
                                                    params: { lesson: lesson._id },
                                                })
                                            }
                                        >
                                            <Ionicons name="close" size={16} color="#fff" />
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {/* Instructor Name */}
                            <View>
                                <Text style={styles.lessonText}>
                                    Instructor:{" "}
                                    {typeof lesson.instructor === "object"
                                        ? lesson.instructor?.name
                                        : "N/A"}
                                </Text>
                            </View>

                            {/* Expanded Details */}
                            {expandedLessons[lesson._id] && (
                                <View style={styles.expandedDetails}>
                                    <Text style={styles.detailText}>Style: {lesson.style}</Text>
                                    <Text style={styles.detailText}>Students:</Text>
                                    {lesson.students.length > 0 ? (
                                        lesson.students.map((student) => (
                                            <Text
                                                key={(student as any)._id}
                                                style={styles.studentText}
                                            >
                                                {(student as any).firstName}{" "}
                                                {(student as any).lastName}
                                            </Text>
                                        ))
                                    ) : (
                                        <Text style={styles.noStudentsText}>
                                            No students assigned
                                        </Text>
                                    )}
                                </View>
                            )}
                        </Pressable>
                    </View>
                ))
            ) : (
                <Text style={styles.noLessonsText}>No lessons available</Text>
            )}
            {/* Error Handling */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => handleWeekChange(-1)}>
                    <Text style={styles.navButtonText}>{"<"}</Text>
                </Pressable>
                <View style={styles.weekRangeContainer}>
                    {loading || loadingInstructors ? (
                        <ActivityIndicator size="small" color="#1E90FF" />
                    ) : (
                        <Text style={styles.weekRange}>Week: {getWeekRange(currentDate)}</Text>
                    )}
                </View>
                <Pressable onPress={() => handleWeekChange(1)}>
                    <Text style={styles.navButtonText}>{">"}</Text>
                </Pressable>
            </View>

            {/* Instructors */}
            <View style={styles.instructorFilter}>{renderInstructors()}</View>

            {/* Lessons */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {Object.entries(weeklyLessons || {}).map(([day, { lessons, date, editable }]) =>
                    renderDayLessons(day, lessons, date, editable)
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingTop: 15,
        backgroundColor: "#228B22",
    },
    filters: {
        flexDirection: "row",
        justifyContent: "center",
        padding: 15,
        backgroundColor: "#228B22",
    },
    filterButton: {
        backgroundColor: "#ffffff",
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#228B22",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterButtonText: {
        fontSize: 14,
        color: "#228B22",
        fontWeight: "bold",
        textAlign: "center",
    },
    weekRangeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    weekRange: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginLeft: 10,
    },
    navButtonText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
    },
    scrollContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    dayContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden", // Ensures child elements stay within the rounded corners
    },
    dayHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#228B22",
        paddingLeft: 5,
        paddingRight: 15,
        paddingTop: 15,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    daySecondHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#228B22",
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    dayHeader: {
        fontSize: 22,
        fontWeight: "600",
        color: "#fff",
    },
    addButton: {
        backgroundColor: "#ffffff",
        borderRadius: 50,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#228B22",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    addButtonText: {
        color: "#228B22",
        fontWeight: "600",
        fontSize: 16,
        textAlign: "center",
    },
    workingHoursContainer: {
        padding: 15,
        backgroundColor: "#f8f9fc",
    },
    workingHoursLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 5,
    },
    workingHoursDetails: {
        fontSize: 14,
        color: "#666",
        marginBottom: 3,
        paddingLeft: 10,
    },
    lessonRow: {
        padding: 15,
        borderRadius: 10,
        margin: 10, // Adds spacing between lessons and edges
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lessonSummary: {
        flexDirection: "column",
        justifyContent: "center",
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#444",
        marginBottom: 5,
    },
    lessonText: {
        fontSize: 16,
        color: "#555",
    },
    expandedDetails: {
        marginTop: 10,
        paddingLeft: 10,
    },
    detailText: {
        fontSize: 16,
        color: "#333",
    },
    studentText: {
        fontSize: 14,
        color: "#555",
        marginLeft: 10,
    },
    noStudentsText: {
        fontSize: 14,
        fontStyle: "italic",
        color: "#999",
    },
    noLessonsText: {
        fontSize: 16,
        color: "#999",
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 10,
    },
    errorContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#ffe6e6",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#ff4d4d",
    },
    errorText: {
        fontSize: 14,
        color: "#d9534f",
        fontWeight: "500",
        textAlign: "center",
    },
    dayIcon: {
        marginLeft: 10,
    },
    dayDate: {
        paddingLeft: 25,
        fontSize: 12,
        fontStyle: "italic",
        color: "#fff",
    },
    lessonActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    editButton: {
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
        flex: 1,
    },
    deleteButton: {
        backgroundColor: "#F44336",
        padding: 10,
        borderRadius: 5,
        flex: 1,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
    }, actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    dayHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Align title and icons horizontally
    },
    actionIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        backgroundColor: "#32CD32",
        borderRadius: 15, // Circle shape
        width: 30, // Equal width and height for a circle
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 5,
    },
    instructorFilter: { padding: 10, backgroundColor: "#228B22" },
    instructorContainer: { flexDirection: "row", paddingVertical: 10 },
    instructorButton: {
        backgroundColor: "#fff", // Seamless default background
        borderRadius: 10,
        padding: 8,
        marginHorizontal: 4,
        borderWidth: 0, // Remove border for default
        elevation:0
    },
    instructorButtonSelected: {
        backgroundColor: "#ffd93e", // Subtle contrast (Navajo White)
        elevation: 4, // Add shadow for a 3D look
    },
    instructorButtonText: {
        fontSize: 14,
        color: "#228B22", // Consistent green text
        fontWeight: "600", // Slightly bold for readability
    },
    instructorButtonTextSelected: {
        color: "#000", // Darker text for contrast in the selected state
    },
    pageButton: {
        marginTop:15,
        padding: 5,
        borderRadius: 5,
        backgroundColor: "transparent", // No background for seamless look
    },
    disabledButton: {
        opacity: 0.3, // Lower opacity for disabled buttons
    },
    instructorList: { flexDirection: "row", paddingVertical: 10 },
});


export default MyCalendar;