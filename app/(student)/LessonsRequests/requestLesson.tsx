import React, {useCallback, useEffect, useState} from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Pressable,
} from "react-native";
import {ILesson, WeeklyAvailability, WeeklyLessonData, WeeklyStudentLessonData} from "@/models/lesson";
import {useFocusEffect, useRouter} from "expo-router";
import {useFormData} from "@/components/StudentProvider";
import {Ionicons} from "@expo/vector-icons";
import {useChangeContext} from "@/components/ChangeProvider";
import {useUpdateContext} from "@/components/ProviderBetweenFolders";

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

const requestLesson = () => {
    const { canUpdate, resetUpdates  } = useUpdateContext();
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const { doesChanged, setDoesChanged } = useChangeContext();
    const {studentDetails, setStudentDetails} = useFormData();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + (7 - today.getDay())); // Move to next week's Sunday
        nextWeek.setHours(0, 0, 0, 0); // Reset time to the start of the day
        return nextWeek;
    });
    const router = useRouter();
    const [instructors, setInstructors] = useState<{ _id: string; name: string }[]>([]);
    const [weeklyAvailableHours, setWeeklyAvailableHours] = useState<
        WeeklyAvailability[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingInstructors, setLoadingInstructors] = useState(false);
    const className = "requestLesson";


    const fetchWorkingHours = async (date: Date) => {
        try {
            setLoading(true);

            const body: Record<string, any> = {
                date: date.toISOString(),
            };

            if (selectedStyles.length > 0) {
                body.styles = selectedStyles;
            }
            else
            {
                body.styles= studentDetails?.preferredStyles;
            }
             if (selectedInstructors.length > 0) {
                body.instructorIds = selectedInstructors;
            }

            console.log("Fetching working hours with:", body);

            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors/weekly-available-hours`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const errorBody = await response.json(); // Parse the response body for detailed error
                const errorMessage = errorBody?.error || "Failed to fetch weekly available hours"; // Default error message if none provided
                throw new Error(`Error ${response.status}: ${errorMessage}`);
            }

            // Explicitly cast the response data to the WeeklyAvailability type
            const data: { weeklyAvailability: WeeklyAvailability[] } = await response.json();

            setWeeklyAvailableHours(data.weeklyAvailability);
            setError(null);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            console.log(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    const fetchInstructors = async (page: number = 1) => {
        try {
            setLoadingInstructors(true);
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/instructors?page=${page}&limit=4`
            );
            if (!response.ok) throw new Error("Failed to fetch instructors.");
            const data = await response.json();
            setInstructors(data.instructors);
            setTotalPages(Math.ceil(data.total / 4)); // Calculate total pages based on the total count
        } catch (err) {
            console.error("Error fetching instructors:", err);
        } finally {
            setLoadingInstructors(false);
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
        fetchWorkingHours(currentDate);
    }, [currentDate, selectedStyles, selectedInstructors]);

    useEffect(() => {
        if (doesChanged) {
            fetchWorkingHours(currentDate); // Refresh lessons
            setDoesChanged(false); // Reset the state after handling the change
        }
    }, [doesChanged]);

    useFocusEffect(
        useCallback(() => {
            console.log("Checking for updates...");
            if (canUpdate(className)) {
                console.log(`Fetching data for ${className}`);
                fetchWorkingHours(currentDate); // Refresh lessons
            } else {
                console.log(`${className} has already been updated.`);
            }
        }, []) // Ensures this runs only when the screen is focused
    );

    useEffect(() => {
        if (studentDetails?.preferredStyles) {
            setSelectedStyles([]); // Reset selected styles if needed
        }
    }, [studentDetails]);

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
    const toggleStyleSelection = (style: string) => {
        setSelectedStyles((prev) =>
            prev.includes(style)
                ? prev.filter((s) => s !== style) // Remove style if already selected
                : [...prev, style] // Add style if not selected
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

    const renderStyles = () => (
        <ScrollView horizontal contentContainerStyle={styles.styleList}>
            {studentDetails?.preferredStyles?.map((style) => (
                <Pressable
                    key={style}
                    style={[
                        styles.styleButton,
                        selectedStyles.includes(style) && styles.styleButtonSelected,
                    ]}
                    onPress={() => toggleStyleSelection(style)}
                >
                    <Text
                        style={[
                            styles.styleButtonText,
                            selectedStyles.includes(style) && styles.styleButtonTextSelected,
                        ]}
                    >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );


    const renderWorkingHours = () => {
        // Helper function to calculate the week's start (Sunday)
        const calculateWeekStart = (currentDate: Date) => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Move to Sunday
            startOfWeek.setHours(0, 0, 0, 0); // Reset time
            return startOfWeek;
        };

        // Get the start of the current week
        const currentWeekStart = calculateWeekStart(currentDate);

        // Helper function to get the day's date
        const getDayDate = (weekStart: Date, dayIndex: number) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + dayIndex); // Adjust for the day index
            return dayDate;
        };

        const getNextColor = (index: number) => colors[index % colors.length];

        const daysOfWeek = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        return (
            <ScrollView contentContainerStyle={styles.workingHoursContainer}>
                {/* Iterate over days of the week */}
                {daysOfWeek.map((day, index) => {
                    const dayDate = getDayDate(currentWeekStart, index);

                    // Filter instructors with availability for the current day
                    const instructorsForDay = weeklyAvailableHours.filter((instructor) =>
                        instructor.weeklyHours.some((d) => d.day === day)
                    );

                    return (
                        <View key={day} style={styles.dayContainer}>
                            {/* Day Header */}
                            <View style={styles.dayHeaderContainer}>
                                <View style={styles.dayHeaderTitle}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={20}
                                        color="#fff"
                                        style={styles.dayIcon}
                                    />
                                    <Text style={styles.dayHeader}>{day}</Text>
                                </View>
                            </View>
                            <View style={styles.daySecondHeaderContainer}>
                                <Text style={styles.dayDate}>
                                    {dayDate.toLocaleDateString("en-GB")}
                                </Text>
                            </View>

                            {/* Instructor Availabilities */}
                            {instructorsForDay.length > 0 ? (
                                instructorsForDay.map((instructor) => {
                                    const dayAvailability = instructor.weeklyHours.find(
                                        (d) => d.day === day
                                    );

                                    return (
                                        <View
                                            key={instructor.instructorId}
                                            style={styles.instructorWorkingHours}
                                        >
                                            {/* Instructor Name */}
                                            <Text style={styles.instructorName}>
                                                {instructor.instructorName}
                                            </Text>

                                            {/* Available Time Slots */}
                                            {dayAvailability?.availableHours &&
                                            dayAvailability.availableHours.length > 0 ? (
                                                dayAvailability.availableHours.map((slot, index) => (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.workingHourRow,
                                                            {
                                                                backgroundColor: getNextColor(index),
                                                            },
                                                        ]}
                                                    >
                                                        <Text style={styles.workingHourTitle}>
                                                            {slot.start} - {slot.end}
                                                        </Text>
                                                        <View style={styles.actionIcons}>
                                                        <Pressable
                                                            style={styles.iconButton}
                                                            onPress={() =>
                                                                router.push({
                                                                    pathname: '/LessonsRequests/addRequestLesson',
                                                                    params: {date: dayDate.toISOString(), instructorId: instructor.instructorId , start : slot.start, end : slot.end},
                                                                })
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="checkmark"
                                                                size={16}
                                                                color="#fff"
                                                            />
                                                        </Pressable>
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noAvailability}>
                                                    No availability
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.noLessonsText}>No instructors available</Text>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };





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
            {/* Styles */}
            <View style={styles.styleFilter}>{renderStyles()}</View>
            {/* Instructors */}
            <View style={styles.instructorFilter}>{renderInstructors()}</View>

            {/* Working Hours */}
            <View style={styles.workingHoursSection}>
                {loading ? (
                    <ActivityIndicator size="large" color="#1E90FF" />
                ) : (
                    renderWorkingHours()
                )}
            </View>

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
    workingHourRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
        borderRadius: 10,
        margin: 10, // Adds spacing between lessons and edges
        backgroundColor: "#ffffff",
    },
    lessonSummary: {
        flexDirection: "column",
        justifyContent: "center",
    },
    workingHourTitle: {
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
    instructorFilter: {  backgroundColor: "#228B22" ,paddingHorizontal:10 },
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
        marginTop:5,
        padding: 5,
        borderRadius: 5,
        backgroundColor: "transparent", // No background for seamless look
    },
    disabledButton: {
        opacity: 0.3, // Lower opacity for disabled buttons
    },
    instructorList: { flexDirection: "row", paddingBottom: 5 },

    styleFilter: {  backgroundColor: "#228B22",paddingHorizontal:10 },
    styleList:  { flexDirection: "row", paddingVertical: 10 },
    styleButton: {
        backgroundColor: "#fff", // Seamless default background
        borderRadius: 10,
        padding: 8,
        marginHorizontal: 4,
        borderWidth: 0, // Remove border for default
        elevation:0
    },
    styleButtonSelected: {
        backgroundColor: "#ffd93e", // Subtle contrast (Navajo White)
        elevation: 4, // Add shadow for a 3D look
    },
    styleButtonText: {
        fontSize: 14,
        color: "#228B22", // Consistent green text
        fontWeight: "600", // Slightly bold for readability
    },
    styleButtonTextSelected: {  color: "#000", },
    instructorWorkingHours: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "#FFF",
        borderRadius: 10,
    },
    instructorName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#444",
        marginBottom: 10,
        textAlign: "center", // Center the name
    },
    dayName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#555",
    },
    timeSlot: {
        padding: 10,
        borderRadius: 8,
        marginVertical: 5,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "500",
        color: "#444",
    },
    noAvailability: {
        fontSize: 14,
        fontStyle: "italic",
        color: "#999",
        textAlign: "center",
        marginTop: 5,
    },
    workingHoursSection: {
        flex: 1,
        padding: 15,
        backgroundColor: "#F5F5F5",
    },
});


export default requestLesson;