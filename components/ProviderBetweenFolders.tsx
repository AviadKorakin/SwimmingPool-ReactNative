import React, { createContext, useRef, useContext } from "react";

// Define the type for the context
interface UpdateContextType {
    updatedClasses: Map<string, number>;
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
    // Initialize the Map with default classes, setting their value to 1 (indicating "needs update")
    const initializeMap = (classes: Set<string>) => {
        const map = new Map<string, number>();
        classes.forEach((className) => map.set(className, 1));
        return map;
    };

    // Use useRef to store the map for better performance and to avoid unnecessary re-renders
    const updatedClassesRef = useRef<Map<string, number>>(initializeMap(defaultUpdatedClasses));

    // Check if the class can update, and mark it as updated
    const canUpdate = (className: string): boolean => {
        const currentValue = updatedClassesRef.current.get(className);

        if (currentValue === 0) {
            console.log(`Class "${className}" has already been updated.`);
            return false;
        }

        // Update the value to 0
        console.log(`Updating class "${className}" to updated (value = 0).`);
        updatedClassesRef.current.set(className, 0);
        return true;
    };

    // Reset all updates to their initial state (value = 1)
    const resetUpdates = () => {
        console.log("Resetting updates...");
        updatedClassesRef.current.forEach((_, key) => updatedClassesRef.current.set(key, 1));
        console.log("Reset updatedClasses map:", updatedClassesRef.current);
    };

    // Set default classes programmatically
    const setUpdatedClassesFromDefault = (defaultClasses: Set<string>) => {
        console.log("Setting updatedClasses from default set:", defaultClasses);
        updatedClassesRef.current = initializeMap(defaultClasses);
    };

    return (
        <UpdateContext.Provider
            value={{
                updatedClasses: updatedClassesRef.current,
                canUpdate,
                resetUpdates,
                setUpdatedClassesFromDefault,
            }}
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
