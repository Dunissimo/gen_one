# Smart Contracts - Структура и примеры кода

## 📝 Иерархия контрактов

```
GovernanceEcosystem
├── Professional (ERC20 + ERC20Votes)
├── RTKCoin (ERC20)
├── FundVault (хранилище ETH)
├── FundGovernor (основной Governor)
│   ├── ProposalManager (управление proposals)
│   ├── VotingSystem (логика голосования)
│   └── QuorumCalculator (расчет кворумов)
└── AccessControl (контроль доступа)
```

---

## 1. Professional.sol - PROFI токен (ERC20 + ERC20Votes)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Professional Token (PROFI)
 * @notice Системный токен DAO, НЕ передаваемый, только для голосования
 * @dev ERC20Votes для поддержки делегирования голосов
 */
contract Professional is 
    ERC20, 
    ERC20Permit, 
    ERC20Votes, 
    Ownable
{
    // Флаг для запрета передачи между пользователями
    mapping(address => bool) public isDAOMember;
    
    // История распределения токенов
    address[] public daoMembers;

    event DAOMemberAdded(address indexed member, uint256 amount);
    event DAOMemberRemoved(address indexed member);

    constructor() 
        ERC20("Professional", "PROFI") 
        ERC20Permit("Professional")
    {}

    /**
     * @notice Инициализирует систему токенов при развертывании
     * @param members Адреса участников DAO
     * @param amount Количество токенов для каждого
     */
    function initializeDAOMembers(
        address[] calldata members, 
        uint256 amount
    ) 
        external 
        onlyOwner 
    {
        require(members.length > 0, "Members array is empty");
        require(totalSupply() == 0, "Already initialized");
        
        for (uint i = 0; i < members.length; i++) {
            require(members[i] != address(0), "Invalid member address");
            isDAOMember[members[i]] = true;
            daoMembers.push(members[i]);
            _mint(members[i], amount);
            emit DAOMemberAdded(members[i], amount);
        }
    }

    /**
     * @notice Переопределение transfer - полностью ЗАПРЕЩЕН
     */
    function transfer(address, uint256) 
        public 
        override(ERC20) 
        pure 
        returns (bool) 
    {
        revert("PROFI tokens are not transferable");
    }

    /**
     * @notice Переопределение transferFrom - полностью ЗАПРЕЩЕН
     */
    function transferFrom(address, address, uint256) 
        public 
        override(ERC20) 
        pure 
        returns (bool) 
    {
        revert("PROFI tokens are not transferable");
    }

    /**
     * @notice Получить список всех членов DAO
     */
    function getDAOMembers() external view returns (address[] memory) {
        return daoMembers;
    }

    /**
     * @notice Получить голоса (для совместимости с Governor)
     */
    function getVotes(address account) 
        public 
        view 
        override(ERC20Votes) 
        returns (uint256) 
    {
        return super.getVotes(account);
    }

    /**
     * @notice Получить голоса на конкретном блоке
     */
    function getPriorVotes(address account, uint256 blockNumber) 
        public 
        view 
        returns (uint256) 
    {
        return getPastVotes(account, blockNumber);
    }

    // Необходимые переопределения для множественного наследования
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, amount);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
```

---

## 2. RTKCoin.sol - RTK токен (простой ERC20)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RTKCoin - Wrap-токен для делегирования
 * @notice Токен, который можно купить за ETH и делегировать для голоса
 */
contract RTKCoin is ERC20, Ownable {
    
    // 1 ETH = 1 RTK
    uint256 public constant PRICE_PER_TOKEN = 1 ether;
    
    // Адрес контракта Governor (для управления делегированием)
    address public governorContract;
    
    // Где хранятся поступившие ETH
    address public treasury;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethSpent);
    event TokensBurned(address indexed account, uint256 amount);

    constructor() ERC20("RTKCoin", "RTK") {
        // Начальный выпуск 20,000,000 RTK
        _mint(msg.sender, 20_000_000 * 10**12);
    }

    /**
     * @notice Установить адрес Governor контракта
     */
    function setGovernor(address _governor) external onlyOwner {
        governorContract = _governor;
    }

    /**
     * @notice Установить адрес казны
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Купить RTK токены за ETH
     * @param amount Количество RTK, которое хочет купить
     */
    function purchaseTokens(uint256 amount) 
        external 
        payable 
    {
        require(amount > 0, "Amount must be > 0");
        uint256 requiredETH = amount * PRICE_PER_TOKEN / (10**12);
        require(msg.value >= requiredETH, "Insufficient ETH sent");
        
        // Перенести токены покупателю
        require(transfer(msg.sender, amount), "Transfer failed");
        
        // Перенести ETH в казну
        if (treasury != address(0)) {
            (bool success, ) = treasury.call{value: msg.value}("");
            require(success, "ETH transfer failed");
        }
        
        emit TokensPurchased(msg.sender, amount, msg.value);
    }

    /**
     * @notice Получить цену в ETH за N токенов
     */
    function getPriceInETH(uint256 rtkAmount) 
        external 
        pure 
        returns (uint256) 
    {
        return rtkAmount * PRICE_PER_TOKEN / (10**12);
    }

    /**
     * @notice Сжечь токены (для платежей за услуги, если нужно)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Получить баланс в "голосах" (RTK/6 = 1 голос)
     */
    function balanceInVotes(address account) 
        external 
        view 
        returns (uint256) 
    {
        return balanceOf(account) / (6 * 10**12);
    }

    // Fallback для принятия ETH
    receive() external payable {}
}
```

---

## 3. FundVault.sol - Хранилище средств

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FundVault
 * @notice Хранилище ETH для венчурного фонда
 * @dev Управляется FundGovernor через одобренные proposals
 */
contract FundVault is Ownable, ReentrancyGuard {
    
    // Адрес Governor контракта (единственный, кто может инициировать платежи)
    address public governorContract;
    
    // История инвестиций
    mapping(address => uint256) public startupInvestments;
    address[] public investedStartups;
    
    // Ограничение на одну инвестицию
    uint256 public maxInvestmentAmount = 10_000 ether;

    event FundsReceived(address indexed from, uint256 amount);
    event InvestmentMade(address indexed startup, uint256 amount);
    event MaxInvestmentUpdated(uint256 newMax);

    constructor() {}

    /**
     * @notice Установить адрес Governor (может вызвать только на инициализацию)
     */
    function setGovernor(address _governor) external onlyOwner {
        require(_governor != address(0), "Invalid governor");
        governorContract = _governor;
    }

    /**
     * @notice Инвестировать в стартап (вызывается только из Governor)
     */
    function investInStartup(address startupAddress, uint256 amount) 
        external 
        nonReentrant 
    {
        require(msg.sender == governorContract, "Only governor can invest");
        require(startupAddress != address(0), "Invalid startup address");
        require(amount > 0, "Amount must be > 0");
        require(amount <= maxInvestmentAmount, "Amount exceeds maximum");
        require(address(this).balance >= amount, "Insufficient balance");

        // Отправить средства стартапу
        (bool success, ) = payable(startupAddress).call{value: amount}("");
        require(success, "Investment transfer failed");

        // Записать инвестицию
        if (startupInvestments[startupAddress] == 0) {
            investedStartups.push(startupAddress);
        }
        startupInvestments[startupAddress] += amount;

        emit InvestmentMade(startupAddress, amount);
    }

    /**
     * @notice Обновить максимальный размер инвестиции
     */
    function setMaxInvestment(uint256 newMax) 
        external 
        onlyOwner 
    {
        maxInvestmentAmount = newMax;
        emit MaxInvestmentUpdated(newMax);
    }

    /**
     * @notice Получить список всех стартапов, в которые инвестировали
     */
    function getInvestedStartups() 
        external 
        view 
        returns (address[] memory) 
    {
        return investedStartups;
    }

    /**
     * @notice Получить общий объем инвестиций в стартап
     */
    function getTotalInvestmentInStartup(address startup) 
        external 
        view 
        returns (uint256) 
    {
        return startupInvestments[startup];
    }

    /**
     * @notice Получить текущий баланс казны
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Fallback для принятия ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
```

---

## 4. ProposalManager.sol - Управление предложениями

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProposalManager
 * @notice Управление жизненным циклом предложений
 */
contract ProposalManager is Ownable {

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
        
        for (uint i = 3; i < 6; i++) {
            allowedQuorumTypes[i] = new uint8[](2);
            allowedQuorumTypes[i][0] = 0;
            allowedQuorumTypes[i][1] = 1;
        }
    }

    /**
     * @notice Создать новое предложение
     */
    function createProposal(
        ProposalType proposeType,
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
        proposal.proposer = msg.sender;
        proposal.proposeType = proposeType;
        proposal.createdAt = block.timestamp;
        proposal.status = ProposalStatus.Pending;
        proposal.targetAddress = targetAddress;
        proposal.amount = amount;
        proposal.proposalData = proposalData;
        proposal.description = description;
        
        proposalIds.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, proposeType);
        
        return proposalId;
    }

    /**
     * @notice Получить предложение по ID
     */
    function getProposal(uint256 proposalId) 
        external 
        view 
        returns (Proposal memory) 
    {
        require(proposals[proposalId].proposalId != 0, "Proposal not found");
        return proposals[proposalId];
    }

    /**
     * @notice Начать голосование
     */
    function startVoting(
        uint256 proposalId,
        uint8 quorumType,
        uint256 votingPeriod
    ) 
        external 
    {
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
    function cancelProposal(uint256 proposalId) 
        external 
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer == msg.sender, "Only proposer can cancel");
        require(proposal.status == ProposalStatus.Pending, "Can only cancel pending");
        
        proposal.status = ProposalStatus.Canceled;
        
        emit ProposalCanceled(proposalId, msg.sender);
    }

    /**
     * @notice Получить все ID предложений
     */
    function getAllProposalIds() 
        external 
        view 
        returns (uint256[] memory) 
    {
        return proposalIds;
    }

    /**
     * @notice Получить активные предложения
     */
    function getActiveProposals() 
        external 
        view 
        returns (uint256[] memory) 
    {
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
}
```

---

## 5. VotingSystem.sol - Логика голосования

```solidity
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
    function convertProfiToVotes(uint256 profiAmount) 
        public 
        pure 
        returns (uint256) 
    {
        return profiAmount / PROFI_PER_VOTE;
    }

    /**
     * @notice Преобразовать RTK в голоса
     * @param rtkAmount Количество RTK
     * @return Количество голосов
     */
    function convertRtkToVotes(uint256 rtkAmount) 
        public 
        pure 
        returns (uint256) 
    {
        return rtkAmount / RTK_PER_VOTE;
    }

    /**
     * @notice Проголосовать по предложению
     */
    function castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        uint256 profiAmount,
        uint256 rtkAmount
    ) 
        external 
    {
        require(support <= 2, "Invalid support option");
        require(profiAmount > 0 || rtkAmount > 0, "No voting power");
        
        // Проверить, что еще не голосовал
        require(votes[proposalId][voter].voter == address(0), "Already voted");

        uint256 totalVotingPower = convertProfiToVotes(profiAmount) + 
                                   convertRtkToVotes(rtkAmount);
        
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
    function getVote(uint256 proposalId, address voter) 
        external 
        view 
        returns (Vote memory) 
    {
        return votes[proposalId][voter];
    }

    /**
     * @notice Получить всех голосующих по предложению
     */
    function getVoters(uint256 proposalId) 
        external 
        view 
        returns (address[] memory) 
    {
        return votersPerProposal[proposalId];
    }

    /**
     * @notice Регистрировать делегирование
     */
    function registerDelegation(
        uint256 proposalId,
        address delegator,
        address delegatee,
        uint256 rtkAmount
    ) 
        external 
    {
        require(delegator != delegatee, "Cannot delegate to self");
        
        emit DelegationCreated(proposalId, delegator, delegatee, rtkAmount);
    }
}
```

---

## 6. QuorumCalculator.sol - Расчет кворумов

```solidity
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
    function checkQuorumPassed(
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        uint8 quorumType
    ) 
        external 
        pure 
        returns (bool) 
    {
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
    function checkSimpleMajority(uint256 votesFor, uint256 votesAgainst) 
        public 
        pure 
        returns (bool) 
    {
        uint256 totalVotes = votesFor + votesAgainst;
        if (totalVotes == 0) return false;
        
        uint256 quorumRequired = (totalVotes / 2) + 1;
        return votesFor >= quorumRequired;
    }

    /**
     * @notice Супербольшинство: 2/3
     */
    function checkSuperMajority(uint256 votesFor, uint256 votesAgainst) 
        public 
        pure 
        returns (bool) 
    {
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
    function checkWeightVote(uint256 votesFor, uint256 votesAgainst) 
        public 
        pure 
        returns (bool) 
    {
        return votesFor > votesAgainst;
    }

    /**
     * @notice Получить дружественное имя типа кворума
     */
    function getQuorumTypeName(uint8 quorumType) 
        external 
        pure 
        returns (string memory) 
    {
        if (quorumType == 0) return "Simple Majority (50% + 1)";
        if (quorumType == 1) return "Super Majority (2/3)";
        if (quorumType == 2) return "Weight Voting (Most votes)";
        return "Unknown";
    }
}
```

---

## 🔄 Порядок развертывания контрактов

```bash
# 1. Развернуть токены
PROFI = deploy(Professional.sol)
RTK = deploy(RTKCoin.sol)
VAULT = deploy(FundVault.sol)

# 2. Развернуть систему управления
PROPOSALS = deploy(ProposalManager.sol)
VOTING = deploy(VotingSystem.sol)
QUORUM = deploy(QuorumCalculator.sol)

# 3. Развернуть Governor
GOVERNOR = deploy(FundGovernor.sol, 
    PROFI.address,
    PROPOSALS.address,
    VOTING.address,
    QUORUM.address,
    VAULT.address
)

# 4. Инициализировать
PROFI.initializeDAOMembers([Tom, Ben, Rick], 25_000 * 10^12)
VAULT.setGovernor(GOVERNOR.address)
RTK.setGovernor(GOVERNOR.address)

# 5. Зафондировать казну
VAULT.receive() with 1_000_000 ETH
```

---

## 📋 Резюме структуры

| Контракт | Размер (примерно) | Ключевые функции |
|----------|-------------------|------------------|
| Professional.sol | ~400 строк | initializeDAOMembers, getVotes |
| RTKCoin.sol | ~250 строк | purchaseTokens, setPrices |
| FundVault.sol | ~200 строк | investInStartup, getBalance |
| ProposalManager.sol | ~350 строк | createProposal, startVoting |
| VotingSystem.sol | ~250 строк | castVote, registerDelegation |
| QuorumCalculator.sol | ~200 строк | checkQuorumPassed |
| FundGovernor.sol | ~600 строк | execute(), propose() wrapper |

**Всего ~2400 строк Solidity кода** (для блокчейн части)
