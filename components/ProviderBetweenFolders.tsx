import React, { createContext, useState, useContext } from "react";

// Define the type for the context
interface UpdateContextType {
    updatedClasses: Set<string>;
    canUpdate: (className: string) => boolean;
    resetUpdates: () => void;
    setUpdatedClassesFromDefault: (defaultClasses: Set<string>) => void; // Function to set default classes
}

// Create the context
const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

// Provider Component
export const UpdateProvider: React.FC<{ children: React.ReactNode; defaultUpdatedClasses?: Set<string> }> = ({
                                                                                                                 children,
                                                                                                                 defaultUpdatedClasses = new Set(), // Default to an empty set if not provided
                                                                                                             }) => {
    const [updatedClasses, setUpdatedClasses] = useState<Set<string>>(new Set(defaultUpdatedClasses));

    // Check if the class can update, and mark it as updated
    const canUpdate = (className: string): boolean => {
        if (updatedClasses.has(className)) {
            return false;
        }
        setUpdatedClasses((prev) => new Set(prev).add(className));
        return true;
    };

    // Reset all updates
    const resetUpdates = () => {
        setUpdatedClasses(new Set());
    };

    // Set default classes programmatically
    const setUpdatedClassesFromDefault = (defaultClasses: Set<string>) => {
        setUpdatedClasses(defaultClasses);
    };

    return (
        <UpdateContext.Provider
            value={{ updatedClasses, canUpdate, resetUpdates, setUpdatedClassesFromDefault }}
        >
            {children}
        </UpdateContext.Provider>
    );
};

// Custom hook to consume the UpdateContext
export const useUpdateContext = (): UpdateContextType => {
    const context = useContext(UpdateContext);
    if (!context) {
        throw new Error("useUpdateContext must be used within an UpdateProvider");
    }
    return context;
};
