import React, {useState} from 'react';
import {View, Pressable, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '@clerk/clerk-expo';
import {useRouter} from 'expo-router';


const swimmingStyles = ['freestyle', 'breaststroke', 'butterfly', 'backstroke'];

const lessonPreferences = [
    {label: 'Private', value: 'private'},
    {label: 'Group', value: 'group'},
    {label: 'Both Prefer Private', value: 'both_prefer_private'},
    {label: 'Both Prefer Group', value: 'both_prefer_group'},
];
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const RegisterToService = () => {
    const {getToken} = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [preferredStyles, setPreferredStyles] = useState<string[]>(['']);
    const [lessonPreference, setLessonPreference] = useState('');
    const [name, setName] = useState('');
    const [workingHours, setWorkingHours] = useState([{day: '', start: '', end: ''}]);
    const [expertise, setExpertise] = useState<string[]>(['']);

    const timeOptions = Array.from({length: 24}, (_, i) =>
        ['00', '15', '30', '45'].map((m) => `${i.toString().padStart(2, '0')}:${m}`)
    ).flat();

    const handleAddStyle = () => setPreferredStyles([...preferredStyles, '']);
    const handleRemoveStyle = (index: number) => setPreferredStyles(preferredStyles.filter((_, i) => i !== index));
    const handleUpdateStyle = (value: string, index: number) => {
        const updatedStyles = [...preferredStyles];
        updatedStyles[index] = value;
        setPreferredStyles(updatedStyles);
    };
    const handleAddExpertise = () => setExpertise([...expertise, '']);
    const handleRemoveExpertise = (index: number) => setExpertise(expertise.filter((_, i) => i !== index));
    const handleUpdateExpertise = (value: string, index: number) => {
        const updatedExpertise = [...expertise];
        updatedExpertise[index] = value;
        setExpertise(updatedExpertise);
    };

    const handleAddWorkingHour = () => setWorkingHours([...workingHours, {day: '', start: '', end: ''}]);
    const handleRemoveWorkingHour = (index: number) => setWorkingHours(workingHours.filter((_, i) => i !== index));
    const handleUpdateWorkingHour = (index: number, field: 'day' | 'start' | 'end', value: string) => {
        const updatedHours = [...workingHours];
        updatedHours[index][field] = value;
        setWorkingHours(updatedHours);
    };

    const handleReset = () => {
        setSelectedRole(null);
    };


    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (selectedRole === 'student') {
                if (!firstName || !lastName || !preferredStyles[0] || !lessonPreference) {
                    Alert.alert('Error', 'Please fill in all the required fields for the student.');
                    setLoading(false);
                    return;
                }
            } else if (selectedRole === 'instructor') {
                if (!name || !expertise[0] || workingHours.some(hour => !hour.day || !hour.start || !hour.end)) {
                    Alert.alert('Error', 'Please fill in all the required fields for the instructor.');
                    setLoading(false);
                    return;
                }
            }


            const body =
                selectedRole === 'student'
                    ? {firstName, lastName, preferredStyles, lessonPreference}
                    : {name, expertise, availableHours: workingHours};

            const token = await getToken();
            if (!token) {
                throw new Error('Authentication token is missing.');
            }

            const response = await fetch(
                `https://swimming-pool-api.onrender.com/api/users/register/${selectedRole}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to register details');
            }

            const data = await response.json(); // Assuming the API response includes the user details

            Alert.alert('Success', `${selectedRole} details submitted successfully!`);

            // Redirect to the appropriate profile with user details
            if (selectedRole === 'student') {
                router.replace({
                    pathname: '/studentProfile',
                    params: {details: JSON.stringify(data)}, // Pass user details as params
                });
            } else if (selectedRole === 'instructor') {
                router.replace({
                    pathname: '/instructorProfile',
                    params: {details: JSON.stringify(data)}, // Pass user details as params
                });
            }

        } catch
            (error) {
            console.error('Error submitting details:', error);
            // @ts-ignore
            Alert.alert('Error', error.message || 'Failed to submit details. Please try again.');
        } finally {
            setLoading(false);
        }

    };

    if (selectedRole) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerCard}>
                    <Text style={styles.title}>
                        {selectedRole === 'student' ? 'Student Details' : 'Instructor Details'}
                    </Text>
                </View>

                {selectedRole === 'student' ? (
                    <>
                        {/* First Name */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>First Name</Text>
                            </View>
                            <TextInput
                                style={styles.staticInput}
                                placeholder="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>

                        {/* Last Name */}
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

                        {/* Preferred Styles */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Preferred Styles</Text>
                            </View>
                            {preferredStyles.map((style, index) => (
                                <View key={index} style={styles.card}>
                                    <Picker
                                        selectedValue={style}
                                        style={[styles.input]}
                                        onValueChange={(value) => handleUpdateStyle(value, index)}
                                    >
                                        <Picker.Item label="Select Style" value=""/>
                                        {swimmingStyles.map((s) => (
                                            <Picker.Item key={s} label={s} value={s}/>
                                        ))}
                                    </Picker>
                                    <Pressable
                                        style={styles.trashIcon}
                                        onPress={() => handleRemoveStyle(index)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="red"/>
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable onPress={handleAddStyle}>
                                <Text style={styles.addButton}>+ Add Style</Text>
                            </Pressable>
                        </View>

                        {/* Lesson Preference */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Lesson Preference</Text>
                            </View>
                            <Picker
                                selectedValue={lessonPreference}
                                style={[styles.input]}
                                onValueChange={(value) => setLessonPreference(value)}
                            >
                                <Picker.Item label="Select Lesson Preference" value=""/>
                                {lessonPreferences.map((pref) => (
                                    <Picker.Item key={pref.value} label={pref.label} value={pref.value}/>
                                ))}
                            </Picker>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Instructor Name */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Name</Text>
                            </View>
                            <TextInput
                                style={styles.staticInput}
                                placeholder="Name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Expertise */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Expertise</Text>
                            </View>
                            {expertise.map((exp, index) => (
                                <View key={index} style={styles.card}>
                                    <Picker
                                        selectedValue={exp}
                                        style={[styles.input]}
                                        onValueChange={(value) => handleUpdateExpertise(value, index)}
                                    >
                                        <Picker.Item label="Select Expertise" value=""/>
                                        {swimmingStyles.map((s) => (
                                            <Picker.Item key={s} label={s} value={s}/>
                                        ))}
                                    </Picker>
                                    <Pressable
                                        style={styles.trashIcon}
                                        onPress={() => handleRemoveExpertise(index)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="red"/>
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable onPress={handleAddExpertise}>
                                <Text style={styles.addButton}>+ Add Expertise</Text>
                            </Pressable>
                        </View>

                        {/* Working Hours */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Available Hours</Text>
                            </View>
                            {workingHours.map((hour, index) => (
                                <View key={index} style={styles.cardSelect}>
                                    <Picker
                                        selectedValue={hour.day}
                                        style={[styles.input]}
                                        onValueChange={(value) => handleUpdateWorkingHour(index, 'day', value)}
                                    >
                                        <Picker.Item label="Select Day" value=""/>
                                        {daysOfWeek.map((day) => (
                                            <Picker.Item key={day} label={day} value={day}/>
                                        ))}
                                    </Picker>
                                    <View style={styles.row}>
                                        <Picker
                                            selectedValue={hour.start}
                                            style={[styles.input, {flex: 1, marginRight: 5}]}
                                            onValueChange={(value) => handleUpdateWorkingHour(index, 'start', value)}
                                        >
                                            <Picker.Item label="Start Time" value=""/>
                                            {timeOptions.map((time) => (
                                                <Picker.Item key={time} label={time} value={time}/>
                                            ))}
                                        </Picker>
                                        <Picker
                                            selectedValue={hour.end}
                                            style={[styles.input, {flex: 1}]}
                                            onValueChange={(value) => handleUpdateWorkingHour(index, 'end', value)}
                                        >
                                            <Picker.Item label="End Time" value=""/>
                                            {timeOptions.map((time) => (
                                                <Picker.Item key={time} label={time} value={time}/>
                                            ))}
                                        </Picker>
                                    </View>
                                    <Pressable
                                        style={[styles.trashIcon, {top: 20, right: 10}]}
                                        onPress={() => handleRemoveWorkingHour(index)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="red"/>
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable onPress={handleAddWorkingHour}>
                                <Text style={styles.addButton}>+ Add Working Hour</Text>
                            </Pressable>
                        </View>
                    </>
                )}

                <View style={[styles.row, {marginTop: 20}]}>
                    {/* Reset Button */}
                    <Pressable
                        onPress={handleReset}
                        style={[styles.circleResetButton, loading && {opacity: 0.7}]}
                        disabled={loading} // Disable the button when loading
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FF6750"/> // Red spinner for Reset
                        ) : (
                            <Ionicons style={styles.resetText} name="close" size={30} color="#FF6750"/>
                        )}
                    </Pressable>
                    <View style={styles.separator}/>
                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        style={[styles.circleSubmitButton, loading && {opacity: 0.7}]}
                        disabled={loading} // Disable the button when loading
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#52D507FF"/> // Green spinner for Submit
                        ) : (
                            <Ionicons style={styles.submitText} name="checkmark" size={30} color="#52D507FF"/>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        );
    }
    return (
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center', flex: 1}]}>
            {loading ? (
                <ActivityIndicator size="large" color="#52D507FF"/>
            ) : (
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <Pressable
                        style={styles.circleButton}
                        onPress={() => setSelectedRole('student')}
                    >
                        <Ionicons name="school-outline" size={30} color="#000"/>
                        <Text style={styles.buttonText}>Student</Text>
                    </Pressable>
                    <Pressable
                        style={styles.circleButton}
                        onPress={() => setSelectedRole('instructor')}
                    >
                        <Ionicons name="clipboard-outline" size={30} color="#000"/>
                        <Text style={styles.buttonText}>Instructor</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, marginTop:10},
    circleButton: {
        width: 100,
        height: 100,
        borderRadius: 60,
        backgroundColor: '#ffffff', // White background
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 40, // Space between buttons
        elevation: 5, // Add elevation for shadow
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        marginTop: 8,
        fontSize: 16,
        color: '#000000', // Black text
        fontWeight: 'bold',
        textAlign: 'center',
    },
    separator: {width: 10},

    container: {flexGrow: 1, padding: 20,},
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
        backgroundColor: "#8A2BE2", // Purple header
        padding: 15,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    cardSelect: {
        padding: 15,
        paddingRight: 50, // Extra space for the trash icon
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        position: "relative",
    },
    trashIcon: {
        position: "absolute",
        right: 15,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
    },
    sectionTitle: {fontSize: 18, fontWeight: "bold", color: "#fff"},
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
    input: {
        flex: 1,
        height: 60,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#f9f9f9",
    },
    addButton: {
        fontSize: 16,
        color: "#8A2BE2",
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 10,
        textAlign: "center",
    },
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
    headerCard: {
        width: '90%', // Adjust width as needed
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20, // Adjust padding for proper spacing
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center', // Horizontally center content inside the card
        justifyContent: 'center', // Vertically center content inside the card
        alignSelf: 'center', // Center the card within its parent
        marginVertical: 20, // Optional: Add some vertical spacing
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000', // Set text color as needed
        textAlign: 'center', // Center the text horizontally
        margin: 0, // Ensure no extra margins are applied
    },
    circleSubmitButton: {
        width: 60, // Adjust for button size
        height: 60,
        borderRadius: 30, // Full circular button
        backgroundColor: '#ffffff', // White background
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Shadow for depth
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    circleResetButton: {
        width: 60, // Adjust for button size
        height: 60,
        borderRadius: 30, // Full circular button
        backgroundColor: '#ffffff', // White background
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Shadow for depth
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitText: {
        color: '#52D507FF', // Green text color
        fontWeight: 'bold',
        fontSize: 48,
    },
    resetText: {
        color: '#FF6750', // Red text color
        fontWeight: 'bold',
        fontSize: 48,
    },

});

export default RegisterToService;
