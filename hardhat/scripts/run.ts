
import { ethers } from 'hardhat';
import { time, mine } from '@nomicfoundation/hardhat-toolbox/network-helpers';

import { governor, profi, proposals, quorum, rtk, vault, voting } from '../../frontend/conf.json';
import { FundGovernor, Professional, RTKCoin } from "../typechain-types";

async function main() {
    const [deployer, tom, ben, rick, jack, startupA] = await ethers.getSigners();
    const balanceTom = await ethers.provider.getBalance(tom.address);
    
    const governorContract = await ethers.getContractAt("FundGovernor", governor);
    const profiContract = await ethers.getContractAt("Professional", profi);
    const proposalsContract = await ethers.getContractAt("ProposalManager", proposals);
    const quorumContract = await ethers.getContractAt("QuorumCalculator", quorum);
    const rtkContract = await ethers.getContractAt("RTKCoin", rtk);
    const vaultContract = await ethers.getContractAt("FundVault", vault);
    const votingContract = await ethers.getContractAt("VotingSystem", voting);
 
    // console.log("Deployer balance: ", await getETHBalance(deployer.address));
    // console.log("Tom balance: ", await getETHBalance(tom.address));

    // await createProposalTypeA(governorContract, tom, startupA, "1000", "First propose");

    // await governorContract.connect(tom).startVoting(1, 2);

    // await governorContract.connect(ben).castVote(1, 1, ethers.parseUnits("300", 12));

    // const proposal = await proposalsContract.getProposal(1);
    // console.log("Proposal: ", proposal.votesAgainst);
    // console.log("Proposal: ", proposal.votesFor);
    // console.log("Proposal: ", proposal.votesAbstain);
    
    // await time.increaseTo(proposal.votingEndTime + 1n);

    // console.log("Latest: ", await time.latest());
    // console.log((await proposalsContract.getProposal(1)).votingEndTime);

    // await governorContract.connect(tom).finalizeVote(1);

    // console.log((await proposalsContract.getProposal(1)));

    // console.log("Startup balance: ", await getETHBalance(startupA.address));
    // console.log("Vault balance: ", await getETHBalance(await vaultContract.getAddress()));

    // await governorContract.executeProposal(1);

    // console.log("Startup balance: ", await getETHBalance(startupA.address));
    // console.log("Vault balance: ", await getETHBalance(await vaultContract.getAddress()));
}

const createProposalTypeA = async (_governor: FundGovernor, signer: any, startup: any, eth: string, description: string) => {
    await _governor.connect(signer).propose(1, startup.address, ethers.parseUnits(eth, 18), description);
}

const getProfiBalance = async (_profi: Professional, address: string) => {
    const balance = await _profi.balanceOf(address);

    return Intl.NumberFormat("RU-ru").format(Number(ethers.formatUnits(balance, 12))) + " PROFI";
}

const getETHBalance = async (address: string) => {
    const balance = await ethers.provider.getBalance(address);

    return Intl.NumberFormat("RU-ru").format(Number(ethers.formatUnits(balance, 18))) + " ETH";
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});