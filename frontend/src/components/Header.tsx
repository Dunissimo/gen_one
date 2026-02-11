import { useAlert } from "../hooks/useAlert";
import { useProposals } from "../hooks/useProposals";
import { useWeb3 } from "../hooks/useWeb3";
import { CONFIG, devFastForward, formatAddress } from "../utils";

export const Header = () => {
    const { userAddress, rpcSigner, connectWallet, isConnected, disconnectWallet } = useWeb3();
    const { showAlert } = useAlert();
    const { reload } = useProposals();

    const handleConnect = async () => {
        const success = await connectWallet!();
        if (success) {
            showAlert('Wallet connected successfully!', 'success');
        } else {
            showAlert('Failed to connect wallet', 'error');
        }
    };
    
    const handleForward = () => {
        devFastForward(rpcSigner, 604800);
        reload();
    }

    return (
        <header>
            <div className="container">
                <div className="header-content">
                    <div>
                        <h1>🚀 DAO Venture Fund</h1>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Decentralized Governance & Investment</p>
                        <button onClick={handleForward}>Skip 1 week</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <button className="connect-btn" onClick={handleConnect} disabled={isConnected}>
                            {isConnected ? `Connected: ${formatAddress(userAddress!)}` : 'Connect Wallet'}
                        </button>
                        {
                            isConnected && (
                                <button 
                                    onClick={disconnectWallet!}
                                    className="btn-disconnect"
                                    title="Disconnect Wallet"
                                >
                                    ❌
                                </button>
                            )
                        }
                        <div className="account-info" style={{ marginTop: '8px' }}>
                            {isConnected && `Chain ID: ${CONFIG.NETWORK_ID}`}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};