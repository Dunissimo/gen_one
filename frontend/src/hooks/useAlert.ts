/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from "react";

export const AlertContext = createContext<any>(null);

export const useAlert = () => {
    const context = useContext(AlertContext);

    if (!context) throw new Error('useAlert must be used within AlertProvider');

    return context;
};