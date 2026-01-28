// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuorumCalculator
 * @notice Вычисление результатов голосования в зависимости от типа кворума
 */
contract QuorumCalculator {

    // Типы кворума
    enum QuorumType {
        SimpleM,      // 50% + 1
        SuperM,       // 2/3
        WeightVote    // Просто большинство голосов
    }

    /**
     * @notice Проверить, пройдено ли голосование для типа кворума
     * @param votesFor Голосов за
     * @param votesAgainst Голосов против
     * @param votesAbstain Голосов воздержалось (не используется)
     * @param quorumType Тип кворума
     * @return true если предложение прошло
     */
    function checkQuorumPassed(uint256 votesFor, uint256 votesAgainst, uint256 votesAbstain, uint8 quorumType) external pure returns (bool) {
        if (quorumType == 0) {
            // Простое большинство: 50% + 1
            return checkSimpleMajority(votesFor, votesAgainst);
        } else if (quorumType == 1) {
            // Супербольшинство: 2/3
            return checkSuperMajority(votesFor, votesAgainst);
        } else if (quorumType == 2) {
            // Вес голосов: просто больше 'за' чем 'против'
            return checkWeightVote(votesFor, votesAgainst);
        }
        revert("Unknown quorum type");
    }

    /**
     * @notice Простое большинство: 50% + 1
     */
    function checkSimpleMajority(uint256 votesFor, uint256 votesAgainst) public pure returns (bool) {
        uint256 totalVotes = votesFor + votesAgainst;
        if (totalVotes == 0) return false;
        
        uint256 quorumRequired = (totalVotes / 2) + 1;
        return votesFor >= quorumRequired;
    }

    /**
     * @notice Супербольшинство: 2/3
     */
    function checkSuperMajority(uint256 votesFor, uint256 votesAgainst) public pure returns (bool) {
        uint256 totalVotes = votesFor + votesAgainst;
        if (totalVotes == 0) return false;
        
        // 2/3 = (totalVotes * 2) / 3
        uint256 quorumRequired = (totalVotes * 2) / 3;
        if ((totalVotes * 2) % 3 != 0) {
            quorumRequired += 1; // Округлить вверх
        }
        
        return votesFor >= quorumRequired;
    }

    /**
     * @notice Вес голосов: просто большинство
     */
    function checkWeightVote(uint256 votesFor, uint256 votesAgainst) public pure returns (bool) {
        return votesFor > votesAgainst;
    }

    /**
     * @notice Получить дружественное имя типа кворума
     */
    function getQuorumTypeName(uint8 quorumType) external pure returns (string memory) {
        if (quorumType == 0) return "Simple Majority (50% + 1)";
        if (quorumType == 1) return "Super Majority (2/3)";
        if (quorumType == 2) return "Weight Voting (Most votes)";
        return "Unknown";
    }
}