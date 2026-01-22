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
        Ownable(msg.sender)
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
        override
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