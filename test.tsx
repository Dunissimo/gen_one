const App = () => {
    return (
        <div>
            <header>
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1>🚀 DAO Venture Fund</h1>
                            <p style={{color: "#6b7280", fontSize: '14px'}}>Decentralized Governance & Investment</p>
                        </div>
                        <div style={{textAlign: "right"}}>
                            <button className="connect-btn" id="connectBtn">Connect Wallet</button>
                            <div className="account-info" id="accountInfo" style={{marginTop: '8px'}}></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <div id="alertContainer"></div>

                <div className="tabs">
                    <button className="tab-btn active" data-tab="dashboard">Dashboard</button>
                    <button className="tab-btn" data-tab="proposals">Proposals</button>
                    <button className="tab-btn" data-tab="create">Create Proposal</button>
                    <button className="tab-btn" data-tab="voting">Vote</button>
                    <button className="tab-btn" data-tab="tokens">Tokens</button>
                </div>

                {/* Dashboard Tab */}
                <div id="dashboard" className="tab-content active">
                    <div className="stats" id="stats">
                        <div className="stat-box">
                            <div className="stat-label">Total Proposals</div>
                            <div className="stat-value" id="totalProposals">-</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Active Proposals</div>
                            <div className="stat-value" id="activeProposals">-</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Your PROFI Balance</div>
                            <div className="stat-value" id="profiBalance">-</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Your RTK Balance</div>
                            <div className="stat-value" id="rtkBalance">-</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Vault Balance</div>
                            <div className="stat-value" id="vaultBalance">-</div>
                        </div>
                    </div>

                    <div className="card">
                        <h2>📊 System Status</h2>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px'}}>
                            <div>
                                <strong>Voting Period:</strong> <span id="votingPeriod">-</span> blocks
                            </div>
                            <div>
                                <strong>Voting Delay:</strong> <span id="votingDelay">-</span> block
                            </div>
                            <div>
                                <strong>Proposal Threshold:</strong> <span id="proposalThreshold">-</span> PROFI
                            </div>
                            <div>
                                <strong>PROFI per Vote:</strong> 3
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proposals Tab */}
                <div id="proposals" className="tab-content">
                    <div className="card">
                        <h2>📋 All Proposals</h2>
                        <div id="proposalsList" className="proposal-list">
                            <div style={{gridColumn: '1/-1', textAlign: 'center', color: '#6b7280', padding: '40px 20px'}}>
                                <span className="loading" style={{margin: '20px auto'}}></span>
                                <p>Loading proposals...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Proposal Tab */}
                <div id="create" className="tab-content">
                    <div className="card">
                        <h2>➕ Create New Proposal</h2>
                        <form id="createProposalForm">
                            <div className="form-group">
                                <label>Proposal Type *</label>
                                <select id="proposeType" required>
                                    <option value="">-- Select Type --</option>
                                    <option value="1">Invest in New Startup (Type A)</option>
                                    <option value="2">Additional Investment (Type B)</option>
                                    <option value="3">Add DAO Member (Type C)</option>
                                    <option value="4">Remove DAO Member (Type D)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Target Address *</label>
                                <input type="text" id="targetAddress" placeholder="0x..." required />
                            </div>

                            <div className="form-group">
                                <label>Investment Amount (ETH)</label>
                                <input type="number" id="investAmount" placeholder="0.5" step="0.01" min="0" />
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea id="description" placeholder="Detailed description of the proposal..." required></textarea>
                            </div>

                            <button type="submit" id="submitProposalBtn">Create Proposal</button>
                        </form>
                    </div>
                </div>

                {/* Voting Tab */}
                <div id="voting" className="tab-content">
                    <div className="card">
                        <h2>🗳️ Vote on Proposals</h2>
                        
                        <div id="votingList" style={{display: 'grid', gap: '15px'}}>
                            <div style={{textAlign: 'center', color: '#6b7280', padding: '40px 20px'}}>
                                <span className="loading" style={{margin: '20px auto'}}></span>
                                <p>Loading active proposals...</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2>💫 Delegate Voting Power</h2>
                        
                        <form id="delegateForm">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Proposal ID *</label>
                                    <input type="number" id="delegateProposalId" placeholder="1" required />
                                </div>
                                <div className="form-group">
                                    <label>RTK Amount to Delegate *</label>
                                    <input type="number" id="delegateRtkAmount" placeholder="100" step="0.01" required />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Delegate To (Address) *</label>
                                <input type="text" id="delegateeAddress" placeholder="0x..." required />
                            </div>

                            <button type="submit" id="delegateBtn">Delegate Power</button>
                        </form>
                    </div>
                </div>

                {/* Tokens Tab */}
                <div id="tokens" className="tab-content">
                    <div className="card">
                        <h2>💰 Buy RTK Tokens</h2>
                        <form id="buyRtkForm">
                            <div className="form-group">
                                <label>RTK Amount to Purchase *</label>
                                <input type="number" id="buyAmount" placeholder="100" step="0.01" required />
                            </div>
                            <div style={{background: 'var(--light)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px'}}>
                                <strong>Price:</strong> <span id="rtkPrice">Calculating...</span> ETH
                            </div>
                            <button type="submit" id="buyRtkBtn">Purchase RTK Tokens</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
