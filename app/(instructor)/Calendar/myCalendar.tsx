import React, {useCallback, useEffect, useState} from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Pressable,
} from "react-native";
import {ILesson, WeeklyLessonData} from "@/models/lesson";
import {useFocusEffect, useRouter} from "expo-router";
import {useFormData} from "@/components/InstructorProvider";
import {Icon} from "@clerk/clerk-js/dist/types/ui/primitives";
import {Ionicons} from "@expo/vector-icons";
import {useChangeContext} from "@/components/ChangeProvider";
import {useUpdateContext} from "@/components/ProviderBetweenFolders";

const colors = [
    "#FFB6C1", // Light Pink
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
    const {instructorDetails, setInstructorDetails} = useFormData();
    const [weeklyLessons, setWeeklyLessons] = useState<WeeklyLessonData | null>(null);
    const { canUpdate, resetUpdates  } = useUpdateContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [todayDate, setTodayDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showMyLessons, setShowMyLessons] = useState(false);
    const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
    const [workingHours, setWorkingHours] = useState<{ [day: string]: { start: string; end: string }[] } | null>(null);
    const router = useRouter();
    const className = "MyCalendar";


    const fetchWeeklyLessons = async (date: Date) => {
        try {
            setLoading(true);

            // Build the base URL with the required date
            let url = `https://swimming-pool-api.onrender.com/api/lessons/weekly?date=${date.toISOString()}`;

            // Always add `instructorId` if `instructorDetails` exists
            if (instructorDetails) {
                url += `&instructorId=${instructorDetails._id}`;
            }

            // Add `sort=true` if `showMyLessons` is enabled
            if (showMyLessons) {
                url += `&sort=true`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch weekly lessons");
            }

            // Assume the response matches the WeeklyLessonData type
            const data: WeeklyLessonData = await response.json();

            // Add colors and organize data
            const lessonsWithMetadata: WeeklyLessonData = Object.keys(data).reduce(
                (acc, day) => {
                    // Use type assertion to ensure `day` is a key of WeeklyLessonData
                    const dayKey = day as keyof WeeklyLessonData;

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
                {} as WeeklyLessonData
            );
            console.log(lessonsWithMetadata.Monday);
            setWeeklyLessons(lessonsWithMetadata);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkingHours = async () => {
        console.log(instructorDetails);
        if (instructorDetails?.availableHours) {
            const hoursByDay = instructorDetails.availableHours.reduce((acc, {day, start, end}) => {
                acc[day] = acc[day] || [];
                acc[day].push({start, end});
                return acc;
            }, {} as { [day: string]: { start: string; end: string }[] });
            setWorkingHours(hoursByDay);
        }
    };

    const getNextColor = () => {
        const color = colors[colorCounter % colors.length]; // Cycle through colors
        colorCounter++; // Increment the counter
        return color;
    };

    useEffect(() => {
        fetchWeeklyLessons(currentDate);
    }, [currentDate, showMyLessons]);

    useFocusEffect(
        useCallback(() => {
            console.log("Checking for updates...");
            console.log(currentDate);
            if (canUpdate(className)) {
                console.log(`Fetching data for ${className}`);
                fetchWeeklyLessons(currentDate);
            } else {
                console.log(`${className} has already been updated.`);
            }
        }, [currentDate]) // Ensures this runs only when the screen is focused
    );
    useEffect(() => {
        if (doesChanged) {
            fetchWeeklyLessons(currentDate); // Refresh lessons
            setDoesChanged(false); // Reset the state after handling the change
        }
    }, [doesChanged]);

    useEffect(() => {
        if (instructorDetails) {
            fetchWorkingHours();
        }
    }, [instructorDetails]);

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

                {/* Add Lesson Button */}
                {editable && (
                    <Pressable
                        style={styles.addButton}
                        onPress={() =>
                            router.push({
                                pathname: '/Calendar/addLesson',
                                params: { date: new Date(date).toISOString().split("T")[0] },
                            })
                        }
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </Pressable>
                )}
            </View>

            {/* Date (Italicized) */}
            <View style={styles.daySecondHeaderContainer}>
                <Text style={styles.dayDate}>
                    {new Date(date).toLocaleDateString("en-GB")}
                </Text>
            </View>

            {/* Working Hours */}
            {workingHours?.[day] && workingHours[day].length > 0 && (
                <View style={styles.workingHoursContainer}>
                    <Text style={styles.workingHoursLabel}>Working Hours:</Text>
                    {workingHours[day].map((hours, index) => (
                        <Text key={index} style={styles.workingHoursDetails}>
                            {hours.start} - {hours.end}
                        </Text>
                    ))}
                </View>
            )}

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
                                    {/*{lesson.editable && (*/}
                                    {/*    <Pressable*/}
                                    {/*        style={styles.iconButton}*/}
                                    {/*        onPress={() => console.log(`Edit Lesson: ${lesson._id}`)}*/}
                                    {/*    >*/}
                                    {/*        <Ionicons name="create-outline" size={16} color="#fff" />*/}
                                    {/*    </Pressable>*/}
                                    {/*)}*/}
                                    {lesson.deletable && (
                                        <Pressable
                                            style={[styles.iconButton]}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/Calendar/removeLesson',
                                                    params: { lesson: lesson._id },
                                                })
                                            }
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#fff" />
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
            <View style={styles.header}>
                <Pressable onPress={() => handleWeekChange(-1)}>
                    <Text style={styles.navButtonText}>{"<"}</Text>
                </Pressable>
                <View style={styles.weekRangeContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#1E90FF"/>
                    ) : (
                        <Text style={styles.weekRange}>
                            Week: {getWeekRange(currentDate)}
                        </Text>
                    )}

                </View>
                <Pressable onPress={() => handleWeekChange(1)}>
                    <Text style={styles.navButtonText}>{">"}</Text>
                </Pressable>
            </View>
            <View style={styles.filters}>
                <Pressable
                    style={styles.filterButton}
                    onPress={() => setShowMyLessons((prev) => !prev)}
                >
                    <Text style={styles.filterButtonText}>
                        {showMyLessons ? "✓ Show My Lessons" : "Show My Lessons"}
                    </Text>
                </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {Object.entries(weeklyLessons || {}).map(([day, {lessons, date, editable}]) =>
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
        backgroundColor: "#1E90FF",
    },
    filters: {
        flexDirection: "row",
        justifyContent: "center",
        padding: 15,
        backgroundColor: "#1E90FF",
    },
    filterButton: {
        backgroundColor: "#ffffff",
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#1E90FF",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterButtonText: {
        fontSize: 14,
        color: "#1E90FF",
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
        backgroundColor: "#1E90FF",
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
        backgroundColor: "#1E90FF",
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
        borderColor: "#1E90FF",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    addButtonText: {
        color: "#1E90FF",
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
        backgroundColor: "#1E90FF",
        borderRadius: 15, // Circle shape
        width: 30, // Equal width and height for a circle
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 5,
    },

});


export default MyCalendar;