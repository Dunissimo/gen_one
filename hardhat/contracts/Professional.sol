// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CustomERC20.sol";

/**
 * @title Professional Token (PROFI)
 * @notice Системный токен DAO, НЕ передаваемый, только для голосования
 */
contract Professional is CustomERC20 {
    // Флаг для запрета передачи между пользователями
    mapping(address => bool) public isDAOMember;
    
    // История распределения токенов
    address[] public daoMembers;

    event DAOMemberAdded(address indexed member, uint256 amount);
    event DAOMemberRemoved(address indexed member);

    // SNAPSHOT голосование (простая реализация)
    struct VoteSnapshot {
        uint256 blockNumber;
        uint256 balance;
    }

    mapping(address => VoteSnapshot[]) private _voteSnapshots;
    uint256 private _totalCheckpoints;
    mapping(address => uint256) private _checkpointsCount;

    constructor() CustomERC20("Professional", 12, "PROFI") {}

    /**
     * @notice Инициализирует систему токенов при развертывании
     * @param members Адреса участников DAO
     * @param amount Количество токенов для каждого
     */
    function initializeDAOMembers(address[] calldata members, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(totalSupply == 0, "Already initialized");
        require(members.length > 0, "Members array is empty");

        for (uint i = 0; i < members.length; i++) {
            address member = members[i];
            require(member != address(0), "Invalid address");
            
            isDAOMember[member] = true;
            daoMembers.push(member);
            
            // Минт через CustomERC20
            balances[member] += amount;
            totalSupply += amount;
            
            // Snapshot для голосования
            _writeCheckpoint(member, amount);
            
            emit DAOMemberAdded(member, amount);
        }
    }

    /**
     * @notice transfer - ЗАПРЕЩЕН
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("PROFI: tokens non-transferable");
    }

    /**
     * @notice transferFrom - ЗАПРЕЩЕН  
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("PROFI: tokens non-transferable");
    }

    /**
     * @notice Добавить члена DAO (owner only)
     */
    function addDAOMember(address member, uint256 amount) external {
        require(member != address(0), "Invalid address");
        
        isDAOMember[member] = true;
        daoMembers.push(member);
        
        balances[member] += amount;
        totalSupply += amount;
        _writeCheckpoint(member, balances[member]);
        
        emit DAOMemberAdded(member, amount);
    }

    /**
     * @notice Удалить члена (owner only)
     */
    function removeDAOMember(address member) external {
        require(msg.sender == owner, "Only owner");
        require(isDAOMember[member], "Not member");
        
        isDAOMember[member] = false;
        
        uint256 amount = balances[member];
        balances[member] = 0;
        totalSupply -= amount;
        
        emit DAOMemberRemoved(member);
    }

    /**
     * @notice Получить членов DAO
     */
    function getDAOMembers() external view returns (address[] memory) {
        return daoMembers;
    }

    /**
     * @notice Проверяет, является ли адрес участником DAO
     * @param account Адрес для проверки
     * @return true если адрес в списке участников
     */
    function isMember(address account) external view returns (bool) {
        return isDAOMember[account];
    }

    /**
     * @notice Текущие голоса = баланс
     */
    function getVotes(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @notice Голоса на блоке (checkpoint)
     */
    function getPriorVotes(address account, uint256 blockNumber) public view returns (uint256) {
        uint256 checkpoints = _checkpointsCount[account];
        if (checkpoints == 0) return 0;

        // Бинарный поиск последнего snapshot <= blockNumber
        uint256 low = 0;
        uint256 high = checkpoints - 1;
        
        while (low < high) {
            uint256 mid = (low + high) / 2;
            VoteSnapshot storage snapshot = _voteSnapshots[account][mid];
            
            if (snapshot.blockNumber <= blockNumber) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        
        return _voteSnapshots[account][low - 1].balance;
    }

    /**
     * @notice Записать snapshot голосов
     */
    function _writeCheckpoint(address account, uint256 newBalance) private {
        uint256 checkpoints = _checkpointsCount[account];
        
        if (checkpoints > 0) {
            VoteSnapshot memory lastSnapshot = _voteSnapshots[account][checkpoints - 1];
            
            if (lastSnapshot.blockNumber == block.number) {
                _voteSnapshots[account][checkpoints - 1].balance = newBalance;
                return;
            }
        }
        
        _voteSnapshots[account].push(VoteSnapshot(block.number, newBalance));
        _checkpointsCount[account]++;
    }
}