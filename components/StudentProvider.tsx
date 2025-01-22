import React, { createContext, useContext, useState, ReactNode } from 'react';
import {IStudent} from "@/models/user";

interface StudentDataContextType {
    studentDetails: IStudent | null;
    setStudentDetails: React.Dispatch<React.SetStateAction<any>>;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
    const [studentDetails, setStudentDetails] =  useState<IStudent | null>(null);

    return (
        <StudentDataContext.Provider value={{ studentDetails, setStudentDetails }}>
            {children}
        </StudentDataContext.Provider>
    );
};

export const useFormData = () => {
    const context = useContext(StudentDataContext);
    if (!context) {
        throw new Error('useFormData must be used within a FormDataProvider');
    }
    return context;
};
