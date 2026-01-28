import { ethers } from "hardhat";
import * as path from "node:path";
import * as fs from "node:fs";

// const data = { contractAddress: await contract.getAddress() }

async function main() {
    const [deployer, tom, ben, rick, jack, startupA, fond] = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", balance.toString());

    // 1. Deploy tokens
    const Professional = await ethers.getContractFactory("Professional");
    const profi = await Professional.deploy();
    console.log("PROFI deployed to:", await profi.getAddress());

    const RTKCoin = await ethers.getContractFactory("RTKCoin");
    const rtk = await RTKCoin.deploy();
    console.log("RTK deployed to:", await rtk.getAddress());

    // 2. Deploy vault
    const FundVault = await ethers.getContractFactory("FundVault");
    const vault = await FundVault.deploy();
    console.log("FundVault deployed to:", await vault.getAddress());

    // 3. Deploy management system
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposals = await ProposalManager.deploy();
    console.log("ProposalManager deployed to:", await proposals.getAddress());

    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const voting = await VotingSystem.deploy();
    console.log("VotingSystem deployed to:", await voting.getAddress());

    const QuorumCalculator = await ethers.getContractFactory("QuorumCalculator");
    const quorum = await QuorumCalculator.deploy();
    console.log("QuorumCalculator deployed to:", await quorum.getAddress());

    // 4. Deploy Governor
    const FundGovernor = await ethers.getContractFactory("FundGovernor");
    const governor = await FundGovernor.deploy(
        await profi.getAddress(),     // _profi
        await rtk.getAddress(),       // _rtkCoin  
        await vault.getAddress(),     // _vault
        await proposals.getAddress(), // _proposalManager
        await voting.getAddress(),    // _votingSystem
        await quorum.getAddress()     // _quorumCalculator
    );

    console.log("FundGovernor deployed to:", await governor.getAddress());

    // 5. Initialize
    const members = [tom.address, ben.address, rick.address];
    const amount = ethers.parseUnits("25000", 12);
    await profi.initializeDAOMembers(members, amount);
    console.log("DAO members initialized");

    // 6. Setup connections
    await vault.setGovernor(await governor.getAddress());
    await rtk.setGovernor(await governor.getAddress());
    console.log("Contracts linked");

    // 7. Fund vault
    // const fundAmount = ethers.parseEther("1000000");
    const fundAmount = ethers.parseEther("1");
    await deployer.sendTransaction({
        to: await vault.getAddress(),
        value: fundAmount
    });
    console.log("Vault funded with", fundAmount.toString(), "wei");

    // Save addresses
    const addresses = {
        profi: await profi.getAddress(),
        rtk: await rtk.getAddress(),
        vault: await vault.getAddress(),
        proposals: await proposals.getAddress(),
        voting: await voting.getAddress(),
        quorum: await quorum.getAddress(),
        governor: await governor.getAddress()
    };

    console.log("\n--- Contract Addresses ---");
    console.log(JSON.stringify(addresses, null, 2));

    const frontendDir = path.join(__dirname, "../../frontend/conf.json");
    fs.writeFileSync(frontendDir, JSON.stringify(addresses, null, 4));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});