/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { AlertContext } from "../hooks/useAlert";


export const AlertProvider = ({ children }: { children: any }) => {
    const [alerts, setAlerts] = useState<any[]>([]);

    const showAlert = useCallback((message: string, type: string = 'info') => {
        const id = Date.now();
        
        setAlerts(prev => [...prev, { id, message, type }]);

        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 5000);
    }, []);

    return (
        <AlertContext.Provider value={{ alerts, showAlert }}>
            {children}
        </AlertContext.Provider>
    );
};