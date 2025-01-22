import React, { createContext, useContext, useState, ReactNode } from 'react';
import {IInstructor} from "@/models/user";

interface InstructorDataContextType {
    instructorDetails: IInstructor | null;
    setInstructorDetails: React.Dispatch<React.SetStateAction<any>>;
}

const InstructorDataContext = createContext<InstructorDataContextType | undefined>(undefined);

export const InstructorProvider = ({ children }: { children: ReactNode }) => {
    const [instructorDetails, setInstructorDetails] =  useState<IInstructor | null>(null);

    return (
        <InstructorDataContext.Provider value={{ instructorDetails, setInstructorDetails }}>
            {children}
        </InstructorDataContext.Provider>
    );
};

export const useFormData = () => {
    const context = useContext(InstructorDataContext);
    if (!context) {
        throw new Error('useFormData must be used within a FormDataProvider');
    }
    return context;
};
