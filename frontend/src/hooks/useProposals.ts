/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from "react";
import type { IProposalsContext } from "../contexts/ProposalsContext";

export const ProposalsContext = createContext<IProposalsContext | null>(null);

export const useProposals = () => {
    const context = useContext(ProposalsContext);

    if (!context) throw new Error('useProposals must be used within ProposalsProvider');

    return context;
};