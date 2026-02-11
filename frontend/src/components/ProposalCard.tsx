/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import { formatAddress } from "../utils";
import { useEffect, useState } from "react";
import { useWeb3 } from "../hooks/useWeb3";

export const ProposalCard = ({ proposal }: any) => {
    const typeNames = ['Invest New', 'Invest Existing', 'Add Member', 'Remove Member', 'Manage PROFI', 'Manage RTK'];
    const statusNames = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Executed'];
    const statusClasses = ['pending', 'active', '', 'defeated', 'succeeded', 'executed'];

    const typeName = typeNames[proposal.proposeType] || 'Unknown';
    const statusName = statusNames[proposal.status] || 'Unknown';
    const statusClass = statusClasses[proposal.status] || '';

    const { signer, rpcSigner, governorContract } = useWeb3();
    const [quorumType, setQuorumType] = useState<string | null>(null);
    const [isEnd, setIsEnd] = useState(false);
    const isExecuted = proposal.status === 4n || proposal.status === 3n; 

    console.log(proposal.status);
    
    const handleStartVoting = () => {
        if (!governorContract || !quorumType) return;
        
        governorContract?.startVoting(proposal.proposalId, BigInt(quorumType));
    }

    async function getBlockchainTime(provider: ethers.BrowserProvider | ethers.JsonRpcProvider) {
        const block = await provider.getBlock("latest");
        
        return BigInt(block!.timestamp);
    }

    const check = () => {
        if (proposal.status !== 0n) return;
        return proposal.proposer === signer?.address;
    }

    const handleExecute = async () => {
        if (!governorContract) return;

        const tx = await governorContract.finalizeVote(proposal.proposalId);
        await tx.wait();

        const tx2 = await governorContract.executeProposal(proposal.proposalId);
        await tx2.wait();
    }

    useEffect(() => {
        const checkEnd = async () => {
            if (!rpcSigner) return false;

            const votingEndTime = proposal.votingEndTime;
            const now = await getBlockchainTime(rpcSigner);

            setIsEnd(now >= votingEndTime);
        }

        checkEnd();
    }, [proposal, rpcSigner]);

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
                    <><strong>Amount:</strong> {ethers.formatUnits(proposal.amount, 18)} ETH<br /></>
                )}
            </div>
            {check() && (
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <select onChange={(e) => setQuorumType(e.target.value)} style={{width: 'calc(100% - 130px)'}} defaultValue="default">
                        <option value="default" disabled>Select quorum type</option>
                        <option value="0" disabled={proposal.proposeType === 0n || proposal.proposeType === 1n}>SimpleM</option>
                        <option value="1" disabled={proposal.proposeType === 0n || proposal.proposeType === 1n}>SuperM</option>
                        <option value="2">WeightVote</option>
                    </select>

                    <button onClick={handleStartVoting}>Start voting</button>
                </div>
            )}
            {!isEnd && !isExecuted && proposal.status === 1n && (
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
            {!check() && isEnd && !isExecuted && (
                <button onClick={handleExecute}>Execute proposal</button>
            )}
        </div>
    );
};