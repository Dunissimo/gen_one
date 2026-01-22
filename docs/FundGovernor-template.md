# FundGovernor.sol - Основной контракт (базовая структура)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Professional.sol";
import "./RTKCoin.sol";
import "./FundVault.sol";
import "./ProposalManager.sol";
import "./VotingSystem.sol";
import "./QuorumCalculator.sol";

/**
 * @title FundGovernor
 * @notice Главный контракт управления венчурным фондом DAO
 * @dev Оркестрирует все компоненты системы
 */
contract FundGovernor is Ownable, ReentrancyGuard {
    
    // Контракты, с которыми работаем
    Professional public profiToken;
    RTKCoin public rtkToken;
    FundVault public fundVault;
    ProposalManager public proposalManager;
    VotingSystem public votingSystem;
    QuorumCalculator public quorumCalculator;

    // Временные параметры
    uint256 public votingDelay = 1;           // 1 блок
    uint256 public votingPeriod = 50_400;     // ~7 дней
    uint256 public proposalThreshold = 1e12;  // 1 PROFI

    // Отслеживание делегирования
    mapping(uint256 proposalId => mapping(address delegator => bool claimed)) 
        public delegationClaimed;
    
    mapping(uint256 proposalId => mapping(address delegator => uint256 rtk)) 
        public delegatedRTK;

    event ProposalCreatedEvent(
        uint256 indexed proposalId,
        address indexed proposer,
        uint8 proposalType
    );

    event VotingStartedEvent(
        uint256 indexed proposalId,
        uint256 startTime,
        uint256 endTime
    );

    event VotesCounted(
        uint256 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        bool passed
    );

    constructor(
        address _profi,
        address _rtkCoin,
        address _vault,
        address _proposalManager,
        address _votingSystem,
        address _quorumCalculator
    ) {
        require(_profi != address(0), "Invalid PROFI address");
        require(_rtkCoin != address(0), "Invalid RTK address");
        require(_vault != address(0), "Invalid vault address");
        require(_proposalManager != address(0), "Invalid proposal manager");
        require(_votingSystem != address(0), "Invalid voting system");
        require(_quorumCalculator != address(0), "Invalid quorum calculator");

        profiToken = Professional(_profi);
        rtkToken = RTKCoin(_rtkCoin);
        fundVault = FundVault(_vault);
        proposalManager = ProposalManager(_proposalManager);
        votingSystem = VotingSystem(_votingSystem);
        quorumCalculator = QuorumCalculator(_quorumCalculator);
    }

    /**
     * @notice Создать новое предложение
     * @param proposeType Тип предложения (1-6)
     * @param targetAddress Адрес (стартап, участник, и т.д.)
     * @param amount Сумма (для инвестиций)
     * @param description Описание
     */
    function propose(
        uint8 proposeType,
        address targetAddress,
        uint256 amount,
        string memory description
    ) 
        external 
        returns (uint256 proposalId) 
    {
        // Проверка: только участники DAO могут создавать proposals
        require(profiToken.balanceOf(msg.sender) > 0, "Not a DAO member");
        
        // Проверка пороговых значений в зависимости от типа
        if (proposeType == 1 || proposeType == 2) {
            // Типы A, B: инвестирования
            require(amount > 0, "Investment amount must be > 0");
            require(targetAddress != address(0), "Invalid startup address");
        } else if (proposeType == 3 || proposeType == 4) {
            // Типы C, D: добавить/удалить участника
            require(targetAddress != address(0), "Invalid member address");
        }

        // Создать proposal через ProposalManager
        proposalId = proposalManager.createProposal(
            ProposalManager.ProposalType(proposeType - 1),  // 0-indexed
            targetAddress,
            amount,
            "",  // proposalData
            description
        );

        emit ProposalCreatedEvent(proposalId, msg.sender, proposeType);
    }

    /**
     * @notice Начать голосование по proposal
     * @param proposalId ID предложения
     * @param quorumType Тип кворума (0: SimpleM, 1: SuperM, 2: WeightVote)
     */
    function startVoting(
        uint256 proposalId,
        uint8 quorumType
    ) 
        external 
        nonReentrant 
    {
        ProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        require(proposal.proposer != address(0), "Proposal not found");
        require(proposal.status == ProposalManager.ProposalStatus.Pending, 
                "Proposal not pending");

        // Проверить, что кворум разрешен для этого типа
        uint8 expectedProposalType = uint8(proposal.proposeType);
        
        if (expectedProposalType <= 1) {
            // Типы A, B: только WeightVote
            require(quorumType == 2, "Investment proposals need WeightVote");
        } else {
            // Типы C, D, E, F: SimpleM или SuperM
            require(quorumType == 0 || quorumType == 1, 
                    "Management proposals need SimpleM or SuperM");
        }

        // Запустить голосование
        proposalManager.startVoting(proposalId, quorumType, votingPeriod);

        emit VotingStartedEvent(
            proposalId,
            block.timestamp,
            block.timestamp + votingPeriod
        );
    }

    /**
     * @notice Проголосовать по предложению
     * @param proposalId ID предложения
     * @param support 0: Against, 1: For, 2: Abstain
     */
    function castVote(
        uint256 proposalId,
        uint8 support
    ) 
        external 
        nonReentrant 
    {
        ProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        require(proposal.status == ProposalManager.ProposalStatus.Active, 
                "Voting not active");
        require(block.timestamp <= proposal.votingEndTime, "Voting ended");
        require(support <= 2, "Invalid support value");

        // Получить баланс PROFI голосующего
        uint256 profiBalance = profiToken.balanceOf(msg.sender);
        require(profiBalance > 0, "No voting power");

        // Преобразовать PROFI в голоса
        uint256 votingPower = votingSystem.convertProfiToVotes(profiBalance);
        
        // Записать голос
        votingSystem.castVote(
            proposalId,
            msg.sender,
            support,
            profiBalance,
            0  // Нет делегированных RTK в базовом голосовании
        );

        // Обновить счетчики в proposal
        if (support == 0) {
            proposalManager.proposals[proposalId].votesAgainst += votingPower;
        } else if (support == 1) {
            proposalManager.proposals[proposalId].votesFor += votingPower;
        } else {
            proposalManager.proposals[proposalId].votesAbstain += votingPower;
        }
    }

    /**
     * @notice Делегировать RTK голоса участнику DAO
     * @param proposalId ID предложения
     * @param delegatee Участник DAO, которому делегируем
     * @param rtkAmount Количество RTK
     */
    function delegateVotingPower(
        uint256 proposalId,
        address delegatee,
        uint256 rtkAmount
    ) 
        external 
        nonReentrant 
    {
        ProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        require(proposal.status == ProposalManager.ProposalStatus.Active, 
                "Voting not active");
        require(delegatee != msg.sender, "Cannot delegate to self");
        require(rtkAmount > 0, "Invalid RTK amount");

        // Проверить баланс RTK
        require(rtkToken.balanceOf(msg.sender) >= rtkAmount, 
                "Insufficient RTK balance");

        // Проверить, что delegatee - участник DAO
        require(profiToken.balanceOf(delegatee) > 0, "Delegatee not DAO member");

        // Перевести RTK в escrow (этот контракт)
        rtkToken.transferFrom(msg.sender, address(this), rtkAmount);

        // Записать делегирование
        delegatedRTK[proposalId][msg.sender] = rtkAmount;
        votingSystem.registerDelegation(proposalId, msg.sender, delegatee, rtkAmount);

        // Добавить голоса к delegatee
        uint256 delegatedVotes = votingSystem.convertRtkToVotes(rtkAmount);
        proposalManager.proposals[proposalId].votesFor += delegatedVotes;

        emit VotingDelegated(proposalId, msg.sender, delegatee, rtkAmount);
    }

    /**
     * @notice Завершить голосование и подсчитать голоса
     * @param proposalId ID предложения
     */
    function finalizeVote(uint256 proposalId) 
        external 
    {
        ProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        require(proposal.status == ProposalManager.ProposalStatus.Active, 
                "Voting not active");
        require(block.timestamp > proposal.votingEndTime, "Voting still active");

        bool passed = quorumCalculator.checkQuorumPassed(
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.votesAbstain,
            proposal.quorumType
        );

        // Обновить статус
        if (passed) {
            proposalManager.proposals[proposalId].status = 
                ProposalManager.ProposalStatus.Succeeded;
        } else {
            proposalManager.proposals[proposalId].status = 
                ProposalManager.ProposalStatus.Defeated;
        }

        emit VotesCounted(proposalId, proposal.votesFor, proposal.votesAgainst, passed);
    }

    /**
     * @notice Исполнить успешное предложение
     * @param proposalId ID предложения
     */
    function executeProposal(uint256 proposalId) 
        external 
        nonReentrant 
    {
        ProposalManager.Proposal storage proposal = proposalManager.proposals[proposalId];
        require(proposal.status == ProposalManager.ProposalStatus.Succeeded, 
                "Proposal not succeeded");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;

        // Выполнить в зависимости от типа
        if (proposal.proposeType == ProposalManager.ProposalType.INVEST_NEW_STARTUP) {
            // Тип A: инвестировать в новый стартап
            fundVault.investInStartup(proposal.targetAddress, proposal.amount);
        } 
        else if (proposal.proposeType == ProposalManager.ProposalType.INVEST_EXISTING_STARTUP) {
            // Тип B: доинвестировать
            fundVault.investInStartup(proposal.targetAddress, proposal.amount);
        }
        else if (proposal.proposeType == ProposalManager.ProposalType.ADD_MEMBER) {
            // Тип C: добавить участника
            // Выдать PROFI токены
            // (нужна mint функция в Professional)
            uint256 memberAllocation = 25_000 * 10**12;
            // profiToken.mint(proposal.targetAddress, memberAllocation);
        }
        else if (proposal.proposeType == ProposalManager.ProposalType.REMOVE_MEMBER) {
            // Тип D: исключить участника
            // Сжечь PROFI
            // (нужна burn функция)
        }
        // Типы E, F обрабатываются отдельно через proposal.proposalData

        // Освободить делегированные RTK
        address[] memory voters = votingSystem.getVoters(proposalId);
        for (uint i = 0; i < voters.length; i++) {
            uint256 delegated = delegatedRTK[proposalId][voters[i]];
            if (delegated > 0 && !delegationClaimed[proposalId][voters[i]]) {
                rtkToken.transfer(voters[i], delegated);
                delegationClaimed[proposalId][voters[i]] = true;
            }
        }

        proposal.status = ProposalManager.ProposalStatus.Executed;
        emit ProposalExecuted(proposalId);
    }

    // События
    event VotingDelegated(
        uint256 indexed proposalId,
        address indexed delegator,
        address indexed delegatee,
        uint256 rtkAmount
    );

    event ProposalExecuted(uint256 indexed proposalId);
}
```

---

## ✅ Следующие шаги:

1. **Скопировать эту структуру FundGovernor.sol**
2. **Реализовать остальные контракты** (с документации smartcontracts.md)
3. **Написать тесты** (примеры в testing-scenarios.md)
4. **Развернуть и тестировать**

---

## 📌 Важные функции, которые нужно добавить в Professional.sol:

```solidity
// Для добавления участников (тип C)
function mint(address account, uint256 amount) external onlyOwner {
    _mint(account, amount);
    isDAOMember[account] = true;
    daoMembers.push(account);
    emit DAOMemberAdded(account, amount);
}

// Для исключения участников (тип D)
function burn(address account, uint256 amount) external onlyOwner {
    _burn(account, amount);
    isDAOMember[account] = false;
    emit DAOMemberRemoved(account);
}
```

Теперь у вас есть ВСЕ необходимое для реализации! 🎉
