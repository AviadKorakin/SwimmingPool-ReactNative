// src/models/user.ts
export interface IInstructor {
    _id: string;
    name: string; // Instructor's name
    availableHours: { day: string; start: string; end: string }[]; // Weekly availability
    expertise: string[]; // Swimming styles they can teach
}

export interface IStudent {
    _id: string;
    firstName: string;
    lastName: string;
    preferredStyles: string[]; // Preferred swimming styles
    lessonPreference: "private" | "group" | "both_prefer_private" | "both_prefer_group"; // Lesson type preference
}