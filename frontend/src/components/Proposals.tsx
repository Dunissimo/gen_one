 
import { ProposalCard } from "./ProposalCard";
import { useProposals } from "../hooks/useProposals";

export const Proposals = () => {
    const { loading, activeProposals, finishedProposals, reload } = useProposals();

    return (
        <div id="proposals" className="tab-content">
            <div className="card">
                <h2>📋 Active Proposals</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                        <span className="loading" style={{ margin: '20px auto' }}></span>
                        <p>Loading proposals...</p>
                    </div>
                ) : activeProposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>No proposals yet</div>
                ) : (
                    <div className="proposal-list">
                        {activeProposals.map(proposal => (
                            <ProposalCard key={proposal.proposalId} proposal={proposal} reload={reload} />
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <h2>📋 Proposals History</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                        <span className="loading" style={{ margin: '20px auto' }}></span>
                        <p>Loading proposals...</p>
                    </div>
                ) : finishedProposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>No proposals yet</div>
                ) : (
                    <div className="proposal-list">
                        {finishedProposals.map(proposal => (
                            <ProposalCard key={proposal.proposalId} proposal={proposal} reload={reload} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};