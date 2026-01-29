import { useEffect, useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { formatString } from "../utils";
import { ethers } from "ethers";

export const Dashboard = () => {
    const { userAddress, governorContract, proposalManagerContract, profiTokenContract, rtkTokenContract, fundVaultContract } = useWeb3();
    const [stats, setStats] = useState({
        totalProposals: '-',
        activeProposals: '-',
        profiBalance: '-',
        rtkBalance: '-',
        vaultBalance: '-',
        votingPeriod: '-',
        votingDelay: '-',
        proposalThreshold: '-'
    });

    useEffect(() => {
        const updateDashboard = async () => {
            try {
                if (!userAddress) return;

                const [allIds, activeIds, profiBalance, rtkBalance, vaultBalance, votingPeriod, votingDelay, proposalThreshold] = await Promise.all([
                    proposalManagerContract.getAllProposalIds(),
                    proposalManagerContract.getActiveProposals(),
                    profiTokenContract.balanceOf(userAddress),
                    rtkTokenContract.balanceOf(userAddress),
                    fundVaultContract.getBalance(),
                    governorContract.votingPeriod(),
                    governorContract.votingDelay(),
                    governorContract.proposalThreshold()
                ]);


                setStats({
                    totalProposals: allIds.length,
                    activeProposals: activeIds.length,
                    profiBalance: formatString(ethers.formatUnits(profiBalance, 12)),
                    rtkBalance: formatString(ethers.formatUnits(rtkBalance, 12)),
                    vaultBalance: formatString(ethers.formatUnits(vaultBalance, 18)) + ' ETH',
                    votingPeriod: formatString(votingPeriod.toString()),
                    votingDelay: formatString(votingDelay.toString()),
                    proposalThreshold: formatString(ethers.formatUnits(proposalThreshold, 12))
                });
            } catch (error) {
                console.error('Dashboard error:', error);
            }
        };

        updateDashboard();
        
        const interval = setInterval(updateDashboard, 30000);

        return () => clearInterval(interval);
    }, [userAddress, governorContract, proposalManagerContract, profiTokenContract, rtkTokenContract, fundVaultContract]);

    return (
        <div id="dashboard" className="tab-content active">
            <div className="stats">
                <div className="stat-box">
                    <div className="stat-label">Total Proposals</div>
                    <div className="stat-value">{stats.totalProposals}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Active Proposals</div>
                    <div className="stat-value">{stats.activeProposals}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Your PROFI Balance</div>
                    <div className="stat-value">{stats.profiBalance}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Your RTK Balance</div>
                    <div className="stat-value">{stats.rtkBalance}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Vault Balance</div>
                    <div className="stat-value">{stats.vaultBalance}</div>
                </div>
            </div>

            <div className="card">
                <h2>📊 System Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                    <div><strong>Voting Period:</strong> {stats.votingPeriod} blocks</div>
                    <div><strong>Voting Delay:</strong> {stats.votingDelay} block</div>
                    <div><strong>Proposal Threshold:</strong> {stats.proposalThreshold} PROFI</div>
                    <div><strong>PROFI per Vote:</strong> 3</div>
                </div>
            </div>
        </div>
    );
};