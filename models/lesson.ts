// src/models/lesson.ts
import { IInstructor, IStudent } from "@/models/user";

export interface ILesson {
    _id: string;
    style: string; // Swimming style
    type: "private" | "group"; // Lesson type
    startTime: string; // ISO Date string
    endTime: string; // ISO Date string
    instructor: IInstructor | string; // Instructor details
    students: IStudent[] | string[]; // Array of students
    color?: string; // Optional color property
    editable?: boolean; // Indicates if the lesson can be edited
    deletable?: boolean; // Indicates if the lesson can be deleted
    assignable?: boolean;// Lesson is assignable
    cancelable?: boolean;// Lesson is cancelable
}

export interface DayLessonData {
    date: string; // ISO Date string representing the day
    editable: boolean; // Indicates if the day is editable
    lessons: ILesson[]; // Array of lessons for the day
}

export interface WeeklyLessonData {
    Sunday: DayLessonData;
    Monday: DayLessonData;
    Tuesday: DayLessonData;
    Wednesday: DayLessonData;
    Thursday: DayLessonData;
    Friday: DayLessonData;
    Saturday: DayLessonData;
}

export interface DayStudentLessonData {
    date: string; // ISO Date string representing the day
    lessons: ILesson[]; // Array of lessons for the day
}

export interface WeeklyStudentLessonData {
    Sunday: DayStudentLessonData;
    Monday: DayStudentLessonData;
    Tuesday: DayStudentLessonData;
    Wednesday: DayStudentLessonData;
    Thursday: DayStudentLessonData;
    Friday: DayStudentLessonData;
    Saturday: DayStudentLessonData;
}
export interface WeeklyAvailability {
    instructorId: string;
    instructorName: string;
    weeklyHours: {
        day: DayOfWeek;
        availableHours: { start: string; end: string }[];
    }[];
}


export type DayOfWeek =
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';
