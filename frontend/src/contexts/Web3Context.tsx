import { ethers } from "ethers";
import { createContext, useCallback, useContext, useState } from "react";
import { CONFIG } from "../utils";

import { abi as FUND_GOVERNOR_ABI } from '../../../hardhat/artifacts/contracts/FundGovernor.sol/FundGovernor.json';
import { abi as PROPOSAL_MANAGER_ABI } from '../../../hardhat/artifacts/contracts/ProposalManager.sol/ProposalManager.json';
import { abi as RTK_ABI } from '../../../hardhat/artifacts/contracts/RTKCoin.sol/RTKCoin.json';
import { abi as VOTING_SYSTEM_ABI } from '../../../hardhat/artifacts/contracts/VotingSystem.sol/VotingSystem.json';
import { abi as FUND_VAULT_ABI } from '../../../hardhat/artifacts/contracts/FundVault.sol/FundVault.json';
import { abi as ERC20_ABI } from '../../../hardhat/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

const Web3Context = createContext<any>(null);

export const Web3Provider = ({ children }: { children: any }) => {
    const [state, setState] = useState<any>({
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
    });

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

            const governorContract = new ethers.Contract(CONFIG.FUND_GOVERNOR, FUND_GOVERNOR_ABI, provider);
            const proposalManagerContract = new ethers.Contract(CONFIG.PROPOSAL_MANAGER, PROPOSAL_MANAGER_ABI, provider);
            const profiTokenContract = new ethers.Contract(CONFIG.PROFI_TOKEN, ERC20_ABI, provider);
            const rtkTokenContract = new ethers.Contract(CONFIG.RTK_TOKEN, RTK_ABI, provider);
            const votingSystemContract = new ethers.Contract(CONFIG.VOTING_SYSTEM, VOTING_SYSTEM_ABI, provider);
            const fundVaultContract = new ethers.Contract(CONFIG.FUND_VAULT, FUND_VAULT_ABI, provider);

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

    return (
        <Web3Context.Provider value={{ ...state, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    
    if (!context) throw new Error('useWeb3 must be used within Web3Provider');
    
    return context;
};