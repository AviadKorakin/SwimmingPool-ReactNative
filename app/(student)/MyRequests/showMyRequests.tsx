import React, {useCallback, useEffect, useState} from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useFormData} from "@/components/StudentProvider";
import {ILessonRequest} from "@/models/lessonRequest";
import {useChangeContext} from "@/components/ChangeProvider";
import {useUpdateContext} from "@/components/ProviderBetweenFolders";
import {useFocusEffect} from "expo-router";


const showMyRequests = () => {
    const {studentDetails} = useFormData();
    const { canUpdate, resetUpdates  } = useUpdateContext();
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + (7 - today.getDay())); // Move to next week's Sunday
        nextWeek.setHours(0, 0, 0, 0); // Reset time to the start of the day
        return nextWeek;
    });
    const [statusFilter, setStatusFilter] = useState<string[]>(["pending"]); // Multi-select for statuses
    const [loading, setLoading] = useState(true);
    const [lessonRequests, setLessonRequests] = useState<ILessonRequest[]>([]);
    const [error, setError] = useState<string | null>(null);
    const className = "showMyRequests";

    const fetchLessonRequests = async () => {
        try {
            setLoading(true);

            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

            const body = {
                students: [studentDetails!._id], // Array of student IDs
                status: statusFilter, // Array of statuses
                startTime: startOfWeek.toISOString(), // Start of week
                endTime: endOfWeek.toISOString(), // End of week
            };
            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/lesson-requests/all`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body),
                }
            );
            if (!response.ok) {
                const errorBody = await response.json(); // Parse error details from response body
                const errorMessage =
                    errorBody?.error || `Error ${response.status}: Failed to fetch lesson requests`;
                throw new Error(errorMessage); // Throw error with detailed message
            }
            const data: { lessonRequests: ILessonRequest[] } = await response.json();
            console.log(data.lessonRequests);
            setLessonRequests(data.lessonRequests);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleWeekChange = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + direction * 7); // Move by a week
        setCurrentDate(newDate);
    };

    const cancelRequest = async (requestId: string, requestType: "group" | "private") => {
        try {
            // Determine the URL based on the request type
            const url =
                requestType === "group"
                    ? `https://swimming-pool-api.onrender.com/api/lesson-requests/${requestId}/students/${studentDetails?._id}`
                    : `https://swimming-pool-api.onrender.com/api/lesson-requests/${requestId}`;

            const response = await fetch(url, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorMessage = `Failed to cancel the ${requestType} request.`;
                throw new Error(errorMessage);
            }
            resetUpdates();
            Alert.alert("Success", `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} request canceled successfully.`);
            fetchLessonRequests(); // Refresh the data
        } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "An unknown error occurred.");
        }
    };


    useEffect(() => {
        fetchLessonRequests();
    }, [currentDate, statusFilter]);

    useFocusEffect(
        useCallback(() => {
            console.log("Checking for updates...");
            if (canUpdate(className)) {
                console.log(`Fetching data for ${className}`);
                fetchLessonRequests();
            } else {
                console.log(`${className} has already been updated.`);
            }
        }, []) // Ensures this runs only when the screen is focused
    );


    const toggleStatusFilter = (status: string) => {
        setStatusFilter((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status) // Remove status if already selected
                : [...prev, status] // Add status if not already selected
        );
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
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => handleWeekChange(-1)}>
                    <Text style={styles.navButtonText}>{"<"}</Text>
                </Pressable>
                <View style={styles.weekRangeContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#1E90FF"/>
                    ) : (
                        <Text style={styles.weekRange}>Week: {getWeekRange(currentDate)}</Text>
                    )}
                </View>
                <Pressable onPress={() => handleWeekChange(1)}>
                    <Text style={styles.navButtonText}>{">"}</Text>
                </Pressable>
            </View>

            {/* Filter */}
            <View style={styles.filter}>
                {["pending", "approved", "rejected"].map((status) => (
                    <Pressable
                        key={status}
                        onPress={() => toggleStatusFilter(status)}
                        style={[
                            styles.filterButton,
                            statusFilter.includes(status) && styles.filterButtonSelected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                statusFilter.includes(status) && styles.filterButtonTextSelected,
                            ]}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Lesson Requests */}
            <ScrollView style={styles.scrollView}>
                {loading ? (
                    <ActivityIndicator size="large" color="#1E90FF"/>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : lessonRequests.length > 0 ? (
                    lessonRequests.map((request) => (
                        <View key={request._id} style={styles.requestContainer}>
                            {/* Title Section */}
                            <View style={styles.requestHeader}>
                                <View style={styles.requestHeaderTitle}>
                                    {/* Icon for Style */}
                                    <Ionicons
                                        name="water" // Example icon for swimming style
                                        size={20}
                                        color="#fff"
                                        style={styles.iconSpacing}
                                    />

                                    {/* Style Text */}
                                    <Text style={styles.requestTitle}>
                                        {request.style.charAt(0).toUpperCase() + request.style.slice(1)}
                                    </Text>

                                    {/* Divider Icon */}
                                    <Ionicons
                                        name="chevron-forward-outline"
                                        size={20}
                                        color="#fff"
                                        style={styles.iconSpacing}
                                    />

                                    {/* Icon for Group Style */}
                                    <Ionicons
                                        name={request.type === "group" ? "people" : "person"} // Use "people" for group and "person" for private
                                        size={20}
                                        color="#fff"
                                        style={styles.iconSpacing}
                                    />

                                    {/* Type Text */}
                                    <Text style={styles.requestTitle}>
                                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                                    </Text>

                                    {/* Cancel Button - Render only if status is "pending" */}
                                    {request.status === "pending" && (
                                        <Pressable onPress={() => cancelRequest(request._id, request.type)} style={styles.cancelButton}>
                                            <Ionicons name="close" size={20} color="#228B22" />
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            <View style={styles.requestSecondHeader}>
                                {/* Time Section */}
                                <Text style={styles.requestTime}>
                                    {formatDate(new Date(request.startTime))} {"  "}
                                    {new Date(request.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(request.endTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Text>
                            </View>

                            {/* Expanded Details */}
                            <View style={styles.requestDetailsContainer}>
                                <View style={styles.requestDetails}>
                                    <Text style={styles.requestText}>
                                        <Text style={styles.fieldLabel}>Instructor:</Text>{" "}
                                        {typeof request.instructor === "object" ? request.instructor?.name : request.instructor}
                                    </Text>
                                    <Text style={styles.requestText}>
                                        <Text style={styles.fieldLabel}>Students:</Text>{" "}
                                        {request.students.length > 0 ? (
                                            request.students.map((student, index) => (
                                                <Text key={index}>
                                                    {student.firstName + " " + student.lastName}
                                                    {index < request.students.length - 1 ? ", " : ""}
                                                </Text>
                                            ))
                                        ) : (
                                            <Text>No students assigned</Text>
                                        )}
                                    </Text>
                                    <Text style={styles.requestText}>
                                        <Text style={styles.fieldLabel}>Status:</Text> {request.status}
                                    </Text>
                                    <Text style={styles.requestText}>
                                        <Text style={styles.fieldLabel}>Created At:</Text>{" "}
                                        {formatDate(new Date(request.createdAt))}
                                    </Text>
                                    {request.canApprove !== undefined && (
                                        <Text style={styles.requestText}>
                                            <Text style={styles.fieldLabel}>Can Approve:</Text>{" "}
                                            {request.canApprove ? "Yes" : "No"}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noLessonsText}>No lesson requests found</Text>
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
    iconSpacing: {
        marginHorizontal: 4, // Space between text and icon
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    navButtonText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
    },
    weekRangeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    requestDetailsContainer: {
        paddingVertical: 15, // Add spacing for the container
        paddingHorizontal: 20, // Add spacing inside the container
        backgroundColor: "#ffffff", // White background for contrast
        borderRadius: 10, // Rounded corners
        marginVertical: 10, // Space between containers
        shadowColor: "#000", // Subtle shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Shadow for Android
        width: "90%", // Fit the container width elegantly
        alignSelf: "center", // Center the container on the screen
    },
    weekRange: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginLeft: 10,
    },
    filter: {
        flexDirection: "row",
        justifyContent: "center",
        padding: 10,
        backgroundColor: "#228B22",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: "#f5f5f5",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    requestHeaderTitle: {
        flexDirection: "row",
        justifyContent: "space-between", // Ensures the title and button are on opposite ends
        alignItems: "center", // Vertically center-align items
        width: "100%", // Ensure it spans the full width of the container
    },
    filterButtonSelected: {
        backgroundColor: "#ffd93e",
        borderColor: "#ffba5b",
    },
    filterButtonText: {
        fontSize: 14,
        color: "#228B22",
        fontWeight: "bold",
    },
    filterButtonTextSelected: {
        color: "#000",
    },
    scrollView: {
        flex: 1,
        padding: 15,
    },
    requestContainer: {
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
    requestHeaderContainer: {
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
    requestDate: {
        fontSize: 10,
        color: "#555",
        marginBottom: 10,
        fontStyle: "italic",
    },
    requestDetails: {
        flexDirection: "column", // Align items vertically
        justifyContent: "center", // Center content
        alignItems: "flex-start", // Align text to the left
        gap: 10, // Space between text items
    },
    noLessonsText: {
        fontSize: 16,
        color: "#999",
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 10,
    },
    errorText: {
        color: "#d9534f",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 14,
        marginTop: 20,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#228B22",
        paddingLeft: 5,
        paddingRight: 15,
        paddingTop: 10,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,

    },
    requestSecondHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#228B22",
        paddingLeft: 5,
        paddingRight: 15,
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
    requestTitle: {
        fontSize: 22,
        fontWeight: "600",
        color: "#fff",
    },
    cancelButton: {
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
    requestTime: {
        fontSize: 13,
        fontStyle: "italic",
        color: "#fff",
        marginBottom: 10,
        marginLeft: 20,
    },
    requestText: {
        fontSize: 14,
        color: "#444", // Darker text for better readability
        marginBottom: 5,
    },
    fieldLabel: {
        fontWeight: "bold",
        color: "#228B22",
    },
});
export default showMyRequests;
