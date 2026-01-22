import { createContext, useCallback, useContext, useState } from "react";

const AlertContext = createContext<any>(null);

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

export const useAlert = () => {
    const context = useContext(AlertContext);

    if (!context) throw new Error('useAlert must be used within AlertProvider');

    return context;
};