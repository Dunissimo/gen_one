/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { CONFIG } from "../utils";

import { FundGovernor__factory } from '../../../hardhat/typechain-types/factories/contracts/FundGovernor__factory';
import { ProposalManager__factory } from '../../../hardhat/typechain-types/factories/contracts/ProposalManager__factory';
import { Professional__factory } from '../../../hardhat/typechain-types/factories/contracts/Professional__factory';
import { RTKCoin__factory } from '../../../hardhat/typechain-types/factories/contracts/RTKCoin__factory';
import { VotingSystem__factory } from '../../../hardhat/typechain-types/factories/contracts/VotingSystem__factory';
import { FundVault__factory } from '../../../hardhat/typechain-types/factories/contracts/FundVault__factory';
import type { FundGovernor } from "../../../hardhat/typechain-types/contracts/FundGovernor";
import type { ProposalManager } from "../../../hardhat/typechain-types/contracts/ProposalManager";
import type { Professional } from "../../../hardhat/typechain-types/contracts/Professional";
import type { RTKCoin } from "../../../hardhat/typechain-types/contracts/RTKCoin";
import type { VotingSystem } from "../../../hardhat/typechain-types/contracts/VotingSystem";
import type { FundVault } from "../../../hardhat/typechain-types/contracts/FundVault";
import { Web3Context } from "../hooks/useWeb3";

export interface IState {
    provider: ethers.BrowserProvider | null,
    signer: ethers.JsonRpcSigner | null,
    rpcSigner: ethers.JsonRpcProvider | null,
    userAddress: string | null,
    governorContract: FundGovernor | null,
    proposalManagerContract: ProposalManager | null,
    profiTokenContract: Professional | null,
    rtkTokenContract: RTKCoin | null,
    votingSystemContract: VotingSystem | null,
    fundVaultContract: FundVault | null,
    isConnected: boolean,
    connectWallet: (() => Promise<boolean>) | null,
    disconnectWallet: (() => Promise<void>) | null,
}

const initialState: IState = {
    provider: null,
    signer: null,
    rpcSigner: null,
    userAddress: null,
    governorContract: null,
    proposalManagerContract: null,
    profiTokenContract: null,
    rtkTokenContract: null,
    votingSystemContract: null,
    fundVaultContract: null,
    isConnected: false,
    connectWallet: null,
    disconnectWallet: null
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
            const rpcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

            const governorContract = FundGovernor__factory.connect(CONFIG.FUND_GOVERNOR, signer);
            const proposalManagerContract = ProposalManager__factory.connect(CONFIG.PROPOSAL_MANAGER, signer);
            const profiTokenContract = Professional__factory.connect(CONFIG.PROFI_TOKEN, signer);
            const rtkTokenContract = RTKCoin__factory.connect(CONFIG.RTK_TOKEN, signer);
            const votingSystemContract = VotingSystem__factory.connect(CONFIG.VOTING_SYSTEM, signer);
            const fundVaultContract = FundVault__factory.connect(CONFIG.FUND_VAULT, signer);

            setState({
                provider,
                signer,
                rpcSigner: rpcProvider,
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

