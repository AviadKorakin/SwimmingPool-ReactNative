import {IInstructor, IStudent} from "@/models/user";

export type RequestLessonFilter = Partial<
    Pick<ILessonRequest, "instructor" | "students" | "style" | "type" | "status" | "startTime" | "endTime">
>;

export interface ILessonRequest extends Document {
    _id: string
    instructor: IInstructor; // Reference to Instructor
    students: IStudent[]; // List of student IDs
    style: string; // Swimming style
    type: "private" | "group"; // Lesson type
    startTime: Date; // Lesson start time
    endTime: Date; // Lesson end time
    status: "pending" | "approved" | "rejected"; // Request status
    createdAt: Date; // Request creation timestamp
    canApprove?: boolean;
}