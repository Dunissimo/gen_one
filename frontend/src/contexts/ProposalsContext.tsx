/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { ProposalsContext } from "../hooks/useProposals";

export interface IProposalsContext {
    loading: boolean;
    reload: () => Promise<void>;
    activeProposals: any[];
    finishedProposals: any[];
}

export const ProposalsProvider = ({ children }: { children: any }) => {
    const [loading, setLoading] = useState(false);
    const [proposals, setProposals] = useState<any[]>([]);
    const { proposalManagerContract } = useWeb3();
    const active = proposals.filter((prop) => prop.status === 1n || prop.status === 0n);
    const finished = proposals.filter((prop) => prop.status !== 1n && prop.status !== 0n);

    const load = async () => {
        try {
            if (!proposalManagerContract) {
                return;
            };

            setLoading(true);

            const proposalIds = await proposalManagerContract.getAllProposalIds();
    
            const proposalsList = await Promise.all(
                proposalIds.map((id: any) => proposalManagerContract.getProposal(id))
            );

            setProposals(proposalsList);
        } catch (error) {
            console.error('Error loading proposals:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [proposalManagerContract]);

    return (
        <ProposalsContext.Provider value={{ loading, reload: load, activeProposals: active, finishedProposals: finished }}>
            {children}
        </ProposalsContext.Provider>
    );
}