// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VotingSystem
 * @notice Логика голосования и кворума
 */
contract VotingSystem {

    // Структура голоса
    struct Vote {
        uint256 proposalId;
        address voter;
        uint8 support;      // 0: Against, 1: For, 2: Abstain
        uint256 votingPower;
        uint256 profiAmount;
        uint256 rtkAmount;
        uint256 votedAt;
    }

    // Хранение голосов
    mapping(uint256 proposalId => mapping(address => Vote)) public votes;
    mapping(uint256 proposalId => address[]) public votersPerProposal;

    // Конверсия: 1 голос = 3 PROFI, 1 голос = 6 RTK
    uint256 public constant PROFI_PER_VOTE = 3 * 10**12;
    uint256 public constant RTK_PER_VOTE = 6 * 10**12;

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votingPower
    );

    event DelegationCreated(
        uint256 indexed proposalId,
        address indexed delegator,
        address indexed delegatee,
        uint256 rtkAmount
    );

    /**
     * @notice Преобразовать PROFI в голоса
     * @param profiAmount Количество PROFI
     * @return Количество голосов
     */
    function convertProfiToVotes(uint256 profiAmount) public pure returns (uint256) {
        return profiAmount / PROFI_PER_VOTE;
    }

    /**
     * @notice Преобразовать RTK в голоса
     * @param rtkAmount Количество RTK
     * @return Количество голосов
     */
    function convertRtkToVotes(uint256 rtkAmount) public pure returns (uint256) {
        return rtkAmount / RTK_PER_VOTE;
    }

    /**
     * @notice Проголосовать по предложению
     */
    function castVote(uint256 proposalId, address voter, uint8 support, uint256 profiAmount, uint256 rtkAmount) external {
        require(support <= 2, "Invalid support option");
        require(profiAmount > 0 || rtkAmount > 0, "No voting power");
        
        // Проверить, что еще не голосовал
        require(votes[proposalId][voter].voter == address(0), "Already voted");

        uint256 totalVotingPower = convertProfiToVotes(profiAmount) + convertRtkToVotes(rtkAmount);
        
        require(totalVotingPower > 0, "Insufficient voting power");

        // Записать голос
        Vote storage vote = votes[proposalId][voter];
        vote.proposalId = proposalId;
        vote.voter = voter;
        vote.support = support;
        vote.votingPower = totalVotingPower;
        vote.profiAmount = profiAmount;
        vote.rtkAmount = rtkAmount;
        vote.votedAt = block.timestamp;

        votersPerProposal[proposalId].push(voter);

        emit VoteCast(proposalId, voter, support, totalVotingPower);
    }

    /**
     * @notice Получить голос конкретного избирателя
     */
    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }

    /**
     * @notice Получить всех голосующих по предложению
     */
    function getVoters(uint256 proposalId) external view returns (address[] memory) {
        return votersPerProposal[proposalId];
    }

    /**
     * @notice Регистрировать делегирование
     */
    function registerDelegation(uint256 proposalId, address delegator, address delegatee, uint256 rtkAmount) external {
        require(delegator != delegatee, "Cannot delegate to self");
        
        emit DelegationCreated(proposalId, delegator, delegatee, rtkAmount);
    }
}