import { useEffect, useState } from "react";
import { useAlert } from "../contexts/AlertContext";
import { useWeb3 } from "../contexts/Web3Context";
import { CONFIG } from "../utils";

export const Voting = ({ isActive }: { isActive: boolean }) => {
    const { proposalManagerContract, governorContract, rtkTokenContract, signer } = useWeb3();
    const { showAlert } = useAlert();
    const [activeProposals, setActiveProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [delegateData, setDelegateData] = useState<any>({
        proposalId: '',
        rtkAmount: '',
        delegateeAddress: ''
    });
    const [delegating, setDelegating] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        const loadVotingProposals = async () => {
            try {
                setLoading(true);
                const proposalIds = await proposalManagerContract.getActiveProposals();
                const proposals = await Promise.all(
                    proposalIds.map((id: number) => proposalManagerContract.getProposal(id))
                );
                setActiveProposals(proposals);
            } catch (error) {
                console.error('Error loading voting proposals:', error);
            } finally {
                setLoading(false);
            }
        };

        loadVotingProposals();
    }, [isActive, proposalManagerContract]);

    const castVote = async (proposalId: number, support: any) => {
        if (!signer) {
            showAlert('Please connect wallet first', 'error');
            return;
        }

        try {
            const tx = await governorContract.connect(signer).castVote(proposalId, support);
            showAlert('Vote transaction sent...', 'info');
            await tx.wait();
            showAlert('Vote cast successfully!', 'success');
        } catch (error: any) {
            console.error('Error casting vote:', error);
            showAlert(error.message, 'error');
        }
    };

    const handleDelegate = (field: any, value: any) => {
        setDelegateData((prev: any) => ({ ...prev, [field]: value }));
    };

    const submitDelegate = async (e: any) => {
        e.preventDefault();
        if (!signer) {
            showAlert('Please connect wallet first', 'error');
            return;
        }

        try {
            setDelegating(true);
            const rtkAmount = (parseFloat(delegateData.rtkAmount) * 1e12).toString();

            const approveTx = await rtkTokenContract.connect(signer).approve(CONFIG.FUND_GOVERNOR, rtkAmount);
            await approveTx.wait();

            const tx = await governorContract.connect(signer).delegateVotingPower(
                delegateData.proposalId,
                delegateData.delegateeAddress,
                rtkAmount
            );

            showAlert('Delegation transaction sent...', 'info');
            await tx.wait();
            showAlert('Voting power delegated successfully!', 'success');

            setDelegateData({ proposalId: '', rtkAmount: '', delegateeAddress: '' });
        } catch (error: any) {
            console.error('Error delegating:', error);
            showAlert(error.message, 'error');
        } finally {
            setDelegating(false);
        }
    };

    if (!isActive) return null;

    return (
        <div id="voting" className="tab-content">
            <div className="card">
                <h2>🗳️ Vote on Proposals</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
                        <span className="loading" style={{ margin: '20px auto' }}></span>
                        <p>Loading active proposals...</p>
                    </div>
                ) : activeProposals.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>No active proposals</div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {activeProposals.map(proposal => {
                            const typeNames = ['Invest New', 'Invest Existing', 'Add Member', 'Remove Member', 'Manage PROFI', 'Manage RTK'];
                            return (
                                <div key={proposal.proposalId} className="card">
                                    <h3>Proposal #{proposal.proposalId.toString()} - {typeNames[proposal.proposeType]}</h3>
                                    <p style={{ color: '#6b7280', marginBottom: '10px' }}>{proposal.description}</p>
                                    <div className="vote-display">
                                        <div><strong>For:</strong> {proposal.votesFor.toString()} <strong>Against:</strong> {proposal.votesAgainst.toString()}</div>
                                        <div className="vote-bar">
                                            <div className="vote-for" style={{ width: `${Number(proposal.votesFor) > 0 ? (Number(proposal.votesFor) / (Number(proposal.votesFor) + Number(proposal.votesAgainst)) * 100) : 0}%` }}></div>
                                            <div className="vote-against" style={{ width: `${Number(proposal.votesAgainst) > 0 ? (Number(proposal.votesAgainst) / (Number(proposal.votesFor) + Number(proposal.votesAgainst)) * 100) : 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                        <button className="btn-secondary" onClick={() => castVote(proposal.proposalId, 1)}>Vote For</button>
                                        <button className="btn-danger" onClick={() => castVote(proposal.proposalId, 0)}>Vote Against</button>
                                        <button className="btn-secondary" onClick={() => castVote(proposal.proposalId, 2)}>Abstain</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="card">
                <h2>💫 Delegate Voting Power</h2>
                <form onSubmit={submitDelegate}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Proposal ID *</label>
                            <input
                                type="number"
                                placeholder="1"
                                value={delegateData.proposalId}
                                onChange={(e) => handleDelegate('proposalId', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>RTK Amount to Delegate *</label>
                            <input
                                type="number"
                                placeholder="100"
                                step="0.01"
                                value={delegateData.rtkAmount}
                                onChange={(e) => handleDelegate('rtkAmount', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Delegate To (Address) *</label>
                        <input
                            type="text"
                            placeholder="0x..."
                            value={delegateData.delegateeAddress}
                            onChange={(e) => handleDelegate('delegateeAddress', e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" disabled={delegating}>
                        {delegating ? <><span className="loading"></span> Delegating...</> : 'Delegate Power'}
                    </button>
                </form>
            </div>
        </div>
    );
};