import { useAlert } from "../contexts/AlertContext";
import { useWeb3 } from "../contexts/Web3Context";
import { CONFIG, formatAddress } from "../utils";

export const Header = () => {
    const { userAddress, connectWallet, isConnected } = useWeb3();
    const { showAlert } = useAlert();

    const handleConnect = async () => {
        const success = await connectWallet();
        if (success) {
            showAlert('Wallet connected successfully!', 'success');
        } else {
            showAlert('Failed to connect wallet', 'error');
        }
    };

    return (
        <header>
            <div className="container">
                <div className="header-content">
                    <div>
                        <h1>🚀 DAO Venture Fund</h1>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Decentralized Governance & Investment</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <button className="connect-btn" onClick={handleConnect} disabled={isConnected}>
                            {isConnected ? `Connected: ${formatAddress(userAddress)}` : 'Connect Wallet'}
                        </button>
                        <div className="account-info" style={{ marginTop: '8px' }}>
                            {isConnected && `Chain ID: ${CONFIG.NETWORK_ID}`}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};