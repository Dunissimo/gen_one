// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

/**
 * @title ProposalManager
 * @notice Управление жизненным циклом предложений
 */
contract ProposalManager {

    // Типы предложений
    enum ProposalType {
        INVEST_NEW_STARTUP,      // Type A
        INVEST_EXISTING_STARTUP, // Type B
        ADD_MEMBER,              // Type C
        REMOVE_MEMBER,           // Type D
        MANAGE_PROFI,            // Type E
        MANAGE_RTK               // Type F
    }

    // Статусы предложений
    enum ProposalStatus {
        Pending,      // Создано, но голосование не начато
        Active,       // Голосование активно
        Canceled,     // Отменено создателем
        Defeated,     // Голосование провалено
        Succeeded,    // Голосование пройдено
        Executed      // Результат выполнен
    }

    // Структура предложения
    struct Proposal {
        uint256 proposalId;
        address proposer;
        ProposalType proposeType;
        uint256 createdAt;
        ProposalStatus status;
        
        // Данные
        address targetAddress;  // Адрес стартапа или пользователя
        uint256 amount;         // Размер инвестиции
        bytes proposalData;     // Для типов E, F
        
        // Голосование
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint8 quorumType;      // 0: SimpleM, 1: SuperM, 2: WeightVote
        
        // Результаты
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        
        // Выполнение
        bool executed;
        string description;
    }

    // Хранилище предложений
    mapping(uint256 => Proposal) public proposals;
    uint256[] public proposalIds;
    uint256 private proposalCounter = 1;

    // Допущенные типы кворума для каждого типа proposal
    mapping(uint8 => uint8[]) public allowedQuorumTypes;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposeType
    );
    
    event ProposalCanceled(
        uint256 indexed proposalId,
        address indexed canceledBy
    );
    
    event ProposalStatusChanged(
        uint256 indexed proposalId,
        ProposalStatus newStatus
    );

    address public owner;

    constructor() {
        // Для типов A, B: только WeightVote
        allowedQuorumTypes[0] = new uint8[](1);
        allowedQuorumTypes[0][0] = 2;
        allowedQuorumTypes[1] = new uint8[](1);
        allowedQuorumTypes[1][0] = 2;
        
        // Для типов C, D, E, F: SimpleM или SuperM
        allowedQuorumTypes[2] = new uint8[](2);
        allowedQuorumTypes[2][0] = 0;
        allowedQuorumTypes[2][1] = 1;
        
        for (uint8 i = 3; i < 6; i++) {
            allowedQuorumTypes[i] = new uint8[](2);
            allowedQuorumTypes[i][0] = 0;
            allowedQuorumTypes[i][1] = 1;
        }

        owner = msg.sender;
    }

    /**
     * @notice Создать новое предложение
     */
    function createProposal(
        ProposalType proposeType,
        address proposer,
        address targetAddress,
        uint256 amount,
        bytes memory proposalData,
        string memory description
    ) 
        external 
        returns (uint256) 
    {
        // Проверки будут в FundGovernor
        uint256 proposalId = proposalCounter++;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = proposer;
        proposal.proposeType = proposeType;
        proposal.createdAt = block.timestamp;
        proposal.status = ProposalStatus.Pending;
        proposal.targetAddress = targetAddress;
        proposal.amount = amount;
        proposal.proposalData = proposalData;
        proposal.description = description;
        
        proposalIds.push(proposalId);
        
        emit ProposalCreated(proposalId, proposer, proposeType);
        
        return proposalId;
    }

    /**
     * @notice Получить предложение по ID
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposals[proposalId].proposalId != 0, "Proposal not found");
        
        return proposals[proposalId];
    }

    /**
     * @notice Начать голосование
     */
    function startVoting(uint256 proposalId, uint8 quorumType, uint256 votingPeriod) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "Not pending");
        
        // Проверить, что кворум разрешен для этого типа
        bool isAllowed = false;
        for (uint i = 0; i < allowedQuorumTypes[uint8(proposal.proposeType)].length; i++) {
            if (allowedQuorumTypes[uint8(proposal.proposeType)][i] == quorumType) {
                isAllowed = true;
                break;
            }
        }
        require(isAllowed, "Quorum type not allowed for this proposal");
        
        proposal.status = ProposalStatus.Active;
        proposal.quorumType = quorumType;
        proposal.votingStartTime = block.timestamp;
        proposal.votingEndTime = block.timestamp + votingPeriod;
        
        emit ProposalStatusChanged(proposalId, ProposalStatus.Active);
    }

    /**
     * @notice Отменить предложение (только создатель, до голосования)
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        console.log("Proposer: ", proposal.proposer);
        console.log("Sender: ", msg.sender);

        require(proposal.proposer == msg.sender, "Only proposer can cancel");
        require(proposal.status == ProposalStatus.Pending, "Can only cancel pending");
        
        proposal.status = ProposalStatus.Canceled;
        
        emit ProposalCanceled(proposalId, msg.sender);
    }

    /**
     * @notice Получить все ID предложений
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposalIds;
    }

    /**
     * @notice Получить активные предложения
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < proposalIds.length; i++) {
            if (proposals[proposalIds[i]].status == ProposalStatus.Active) {
                count++;
            }
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        for (uint i = 0; i < proposalIds.length; i++) {
            if (proposals[proposalIds[i]].status == ProposalStatus.Active) {
                active[index++] = proposalIds[i];
            }
        }
        
        return active;
    }

    function updateVotes(uint256 proposalId, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) external {
        Proposal storage p = proposals[proposalId];
        p.votesFor = forVotes;
        p.votesAgainst = againstVotes;
        p.votesAbstain = abstainVotes;
    }

    function finalize(uint256 proposalId, bool passed) external {
        Proposal storage p = proposals[proposalId];
        
        if (passed) {
            p.status = ProposalManager.ProposalStatus.Succeeded;
        } else {
            p.status = ProposalManager.ProposalStatus.Defeated;
        }
    }
}