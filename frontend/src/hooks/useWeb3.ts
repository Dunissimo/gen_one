import { createContext, useContext } from "react";
import type { IState } from "../contexts/Web3Context";

export const Web3Context = createContext<IState | null>(null);

export const useWeb3 = (): IState => {
    const context = useContext(Web3Context);
    
    if (!context) throw new Error('useWeb3 must be used within Web3Provider');
    
    return context;
};