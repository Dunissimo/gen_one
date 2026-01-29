import { ethers } from "ethers";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CONFIG } from "../utils";

import { FundGovernor__factory } from '../../../hardhat/typechain-types/factories/contracts/FundGovernor__factory';
import { ProposalManager__factory } from '../../../hardhat/typechain-types/factories/contracts/ProposalManager__factory';
import { Professional__factory } from '../../../hardhat/typechain-types/factories/contracts/Professional__factory';
import { RTKCoin__factory } from '../../../hardhat/typechain-types/factories/contracts/RTKCoin__factory';
import { VotingSystem__factory } from '../../../hardhat/typechain-types/factories/contracts/VotingSystem__factory';
import { FundVault__factory } from '../../../hardhat/typechain-types/factories/contracts/FundVault__factory';

const Web3Context = createContext<any>(null);

const initialState = {
    provider: null,
    signer: null,
    userAddress: null,
    governorContract: null,
    proposalManagerContract: null,
    profiTokenContract: null,
    rtkTokenContract: null,
    votingSystemContract: null,
    fundVaultContract: null,
    isConnected: false
};

export const Web3Provider = ({ children }: { children: any }) => {
    const [state, setState] = useState<any>(initialState);

    const connectWallet = useCallback(async () => {
        try {
            if (!window.ethereum) {
                alert('MetaMask not installed');
                throw new Error('MetaMask not installed')
            };

            const provider = new ethers.BrowserProvider(window.ethereum)
            await provider.send("eth_requestAccounts", [])
            
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            const governorContract = FundGovernor__factory.connect(CONFIG.FUND_GOVERNOR, provider);
            const proposalManagerContract = ProposalManager__factory.connect(CONFIG.PROPOSAL_MANAGER, provider);
            const profiTokenContract = Professional__factory.connect(CONFIG.PROFI_TOKEN, provider);
            const rtkTokenContract = RTKCoin__factory.connect(CONFIG.RTK_TOKEN, provider);
            const votingSystemContract = VotingSystem__factory.connect(CONFIG.VOTING_SYSTEM, provider);
            const fundVaultContract = FundVault__factory.connect(CONFIG.FUND_VAULT, provider);

            setState({
                provider,
                signer,
                userAddress,
                governorContract,
                proposalManagerContract,
                profiTokenContract,
                rtkTokenContract,
                votingSystemContract,
                fundVaultContract,
                isConnected: true
            });

            return true;
        } catch (error) {
            console.error('Connection error:', error);
            return false;
        }
    }, []);

    const autoConnect = useCallback(async () => {
        if (!window.ethereum) return false;

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });

            if (accounts.length > 0) {
                console.log("Available accounts: ", accounts);
                console.log('✅ Auto-reconnect:', accounts[0]);
                
                return await connectWallet();
            }
        } catch (error) {
            console.log('Auto-connect failed:', error);
        }

        return false;
    }, []);

    useEffect(() => {
        autoConnect();
    }, [autoConnect]);

    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                setState((prev: any) => ({ ...prev, isConnected: false, userAddress: null }));
            } else {
                connectWallet();
            }
        };

        const handleChainChanged = () => window.location.reload();

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        };
    }, [connectWallet]);

    const disconnectWallet = useCallback(async () => {
        try {
            if (!window.ethereum) return;

            await window.ethereum.request({
                method: 'wallet_revokePermissions',
                params: [{
                    eth_accounts: {}
                }]
            });

            setState(initialState);

            console.log('✅ Disconnected');

            window.location.reload();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }, []);

    return (
        <Web3Context.Provider value={{ ...state, connectWallet, disconnectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    
    if (!context) throw new Error('useWeb3 must be used within Web3Provider');
    
    return context;
};