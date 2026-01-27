import { formatAddress, formatNumber } from "../utils";

export const ProposalCard = ({ proposal }: any) => {
    const typeNames = ['Invest New', 'Invest Existing', 'Add Member', 'Remove Member', 'Manage PROFI', 'Manage RTK'];
    const statusNames = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Executed'];
    const statusClasses = ['pending', 'active', '', 'defeated', 'succeeded', 'executed'];

    const typeName = typeNames[proposal.proposeType] || 'Unknown';
    const statusName = statusNames[proposal.status] || 'Unknown';
    const statusClass = statusClasses[proposal.status] || '';

    return (
        <div className="proposal-item">
            <div className="proposal-header">
                <span className="proposal-id">Proposal #{proposal.proposalId.toString()}</span>
                <span className={`proposal-status status-${statusClass}`}>{statusName}</span>
            </div>
            <div className="proposal-type">Type: {typeName}</div>
            <div className="proposal-info">
                <strong>Description:</strong> {proposal.description.substring(0, 80)}{proposal.description.length > 80 ? '...' : ''}<br />
                <strong>Proposer:</strong> {formatAddress(proposal.proposer)}<br />
                {proposal.targetAddress !== '0x0000000000000000000000000000000000000000' && (
                    <><strong>Target:</strong> {formatAddress(proposal.targetAddress)}<br /></>
                )}
                {proposal.amount > 0n && (
                    <><strong>Amount:</strong> {formatNumber(proposal.amount, 3)} ETH<br /></>
                )}
            </div>
            {proposal.status === 1 && (
                <div className="vote-display">
                    <div><strong>For:</strong> {proposal.votesFor.toString()} <strong>Against:</strong> {proposal.votesAgainst.toString()}</div>
                    <div className="vote-bar">
                        <div className="vote-for" style={{ 
                            width: `${proposal.votesFor > 0 ? (Number(proposal.votesFor) / (Number(proposal.votesFor) + Number(proposal.votesAgainst)) * 100) : 0}%` 
                        }}></div>
                        <div className="vote-against" style={{ 
                            width: `${proposal.votesAgainst > 0 ? (Number(proposal.votesAgainst) / (Number(proposal.votesFor) + Number(proposal.votesAgainst)) * 100) : 0}%` 
                        }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};