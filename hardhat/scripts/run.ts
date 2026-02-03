
import { ethers } from 'hardhat';
import { time, mine } from '@nomicfoundation/hardhat-toolbox/network-helpers';

import { governor, profi, proposals, quorum, rtk, vault, voting } from '../../frontend/conf.json';
import { FundGovernor, FundVault, Professional, ProposalManager, RTKCoin } from "../typechain-types";

async function main() {
    const [deployer, tom, ben, rick, jack, startupA] = await ethers.getSigners();
    
    const governorContract = await ethers.getContractAt("FundGovernor", governor);
    const profiContract = await ethers.getContractAt("Professional", profi);
    const proposalsContract = await ethers.getContractAt("ProposalManager", proposals);
    const quorumContract = await ethers.getContractAt("QuorumCalculator", quorum);
    const rtkContract = await ethers.getContractAt("RTKCoin", rtk);
    const vaultContract = await ethers.getContractAt("FundVault", vault);
    const votingContract = await ethers.getContractAt("VotingSystem", voting);

    // await checkFirst(governorContract, proposalsContract, vaultContract, tom, ben, startupA);

    await checkTwo(governorContract, proposalsContract, profiContract, tom, jack);
}

const checkFirst = async (_governor: FundGovernor, _proposal: ProposalManager, _vault: FundVault, tom: any, ben: any, startup: any) => {
    await createProposalTypeA(_governor, tom, startup, "1000", "Second propose");
    await createProposalTypeB(_governor, tom, startup, "1000", "Second propose");

    await _governor.connect(tom).startVoting(3, 2);

    await _governor.connect(ben).castVote(1, 1, ethers.parseUnits("300", 12));

    const proposal = await _proposal.getProposal(1);
    console.log("Proposal against: ", proposal.votesAgainst);
    console.log("Proposal for: ", proposal.votesFor);
    console.log("Proposal abstain: ", proposal.votesAbstain);
    
    await time.increaseTo(proposal.votingEndTime + 1n);

    console.log("Latest: ", await time.latest());
    console.log((await _proposal.getProposal(1)).votingEndTime);

    console.log(await _proposal.getAllProposalIds());
    await _governor.connect(tom).finalizeVote(3);

    console.log((await _proposal.getProposal(3)).status);

    console.log("Startup balance: ", await getETHBalance(startup.address));
    console.log("Vault balance: ", await getETHBalance(await _vault.getAddress()));

    await _governor.executeProposal(1);

    console.log("Startup balance: ", await getETHBalance(startup.address));
    console.log("Vault balance: ", await getETHBalance(await _vault.getAddress()));
}

const checkTwo = async (_governor: FundGovernor, _proposal: ProposalManager, _profi: Professional, tom: any, jack: any) => {
    await createProposalTypeC(_governor, tom, jack, "Add member propose");

    await _governor.connect(tom).startVoting(1, 0);

    await _governor.connect(tom).castVote(1, 1, ethers.parseUnits("300", 12));

    const proposal = await _proposal.getProposal(1);
    console.log("Proposal against: ", proposal.votesAgainst);
    console.log("Proposal for: ", proposal.votesFor);
    console.log("Proposal abstain: ", proposal.votesAbstain);

    await time.increaseTo(proposal.votingEndTime + 1n);

    console.log("Latest: ", await time.latest());
    console.log((await _proposal.getProposal(1)).votingEndTime);

    await _governor.connect(tom).finalizeVote(1);

    console.log((await _proposal.getProposal(1)).status);

    console.log((await _profi.isMember(jack.address)) ? "Jack is a member" : "Jack isnt a member");

    await _governor.executeProposal(1);

    console.log((await _profi.balanceOf(jack.address)));
    
    console.log((await _profi.isMember(jack.address)) ? "Jack is a member" : "Jack isnt a member");
}

const createProposalTypeA = async (_governor: FundGovernor, signer: any, startup: any, eth: string, description: string) => {
    await _governor.connect(signer).propose(1, startup.address, ethers.parseUnits(eth, 18), description);
}

const createProposalTypeB = async (_governor: FundGovernor, signer: any, startup: any, eth: string, description: string) => {
    await _governor.connect(signer).propose(2, startup.address, ethers.parseUnits(eth, 18), description);
}

const createProposalTypeC = async (_governor: FundGovernor, signer: any, futureMember: any, description: string) => {
    await _governor.connect(signer).propose(3, futureMember.address, 0, description);
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