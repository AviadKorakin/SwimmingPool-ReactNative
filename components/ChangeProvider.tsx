import React, { createContext, useState, useContext } from "react";

// Define the context and its type
interface ChangeContextType {
    doesChanged: boolean;
    setDoesChanged: (value: boolean) => void;
}

// Create the context
const ChangeContext = createContext<ChangeContextType | undefined>(undefined);

// Define the provider component
export const ChangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [doesChanged, setDoesChanged] = useState(false);

    return (
        <ChangeContext.Provider value={{ doesChanged, setDoesChanged }}>
            {children}
        </ChangeContext.Provider>
    );
};

// Custom hook for consuming the context
export const useChangeContext = (): ChangeContextType => {
    const context = useContext(ChangeContext);
    if (!context) {
        throw new Error("useLessonContext must be used within a ChangeProvider");
    }
    return context;
};
