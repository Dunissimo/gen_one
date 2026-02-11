/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ProposalCard } from "./ProposalCard";
import { useWeb3 } from "../hooks/useWeb3";

export const Proposals = () => {
    const { proposalManagerContract } = useWeb3();
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProposals = async () => {
            try {
                setLoading(true);

                if (!proposalManagerContract) {
                    console.error("NO contract")
                    return;
                };

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
        };

        loadProposals();
    }, [proposalManagerContract]);

    return (
        <div id="proposals" className="tab-content">
            <div className="card">
                <h2>📋 All Proposals</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                        <span className="loading" style={{ margin: '20px auto' }}></span>
                        <p>Loading proposals...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>No proposals yet</div>
                ) : (
                    <div className="proposal-list">
                        {proposals.map(proposal => (
                            <ProposalCard key={proposal.proposalId} proposal={proposal} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};