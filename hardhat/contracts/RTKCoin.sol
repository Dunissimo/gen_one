// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

import "./CustomERC20.sol";

/**
 * @title RTKCoin - Wrap-токен для делегирования
 * @notice Токен, который можно купить за ETH и делегировать для голоса
 */
contract RTKCoin is CustomERC20 {
    // 1 ETH = 1 RTK
    uint256 public constant PRICE_PER_TOKEN = 1 ether;
    
    // Адрес контракта Governor (для управления делегированием)
    address public governorContract;
    
    // Где хранятся поступившие ETH
    address public treasury;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethSpent);
    event TokensBurned(address indexed account, uint256 amount);

    constructor() CustomERC20("RTKCoin", 12, "RTK") {
        balances[address(this)] = 20_000_000 * 10**12;  // 20M RTK на контракте
        totalSupply = 20_000_000 * 10**12;
    }

    /**
     * @notice Установить адрес Governor контракта
     */
    function setGovernor(address _governor) external {
        require(msg.sender == owner, "Only owner"); 
        governorContract = _governor;
    }

    /**
     * @notice Установить адрес казны
     */
    function setTreasury(address _treasury) external {
        require(msg.sender == owner, "Only owner"); 

        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Купить RTK токены за ETH
     * @param humanAmount Количество RTK, которое хочет купить
     */
    function purchaseTokens(uint256 humanAmount) external payable {
        uint256 tokenAmount = humanAmount * (10 ** decimals);
        console.log("Human:", humanAmount);
        console.log("Tokens:", tokenAmount);

        require(tokenAmount > 0, "Amount must be > 0");
        uint256 requiredETH = tokenAmount * PRICE_PER_TOKEN / (10 ** decimals);

        console.log("Required ETH:", requiredETH);

        require(msg.value >= requiredETH, "Insufficient ETH");
        console.log("Checks done");

        console.log(balanceOf(address(this)));

        balances[address(this)] -= tokenAmount;
        balances[msg.sender] += tokenAmount;
        emit Transfer(address(this), msg.sender, tokenAmount);
        
        console.log("Transfer done");

        if (treasury != address(0)) {
            (bool success, ) = treasury.call{value: msg.value}("");
            require(success, "ETH transfer failed");
        }
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }

    /**
     * @notice Получить цену в ETH за N токенов
     */
    function getPriceInETH(uint256 humanAmount) external view returns (uint256) {
        uint256 tokenAmount = humanAmount * (10 ** decimals);
        
        return tokenAmount * PRICE_PER_TOKEN / (10 ** decimals);  // "1" → 1 ETH
    }

    /**
     * @notice Сжечь токены (для платежей за услуги, если нужно)
     */
    function burn(uint256 humanAmount) external {
        uint256 tokenAmount = humanAmount * (10 ** decimals);
        burn(address(this), tokenAmount);  // Использует CustomERC20.burn (но owner-only)
        emit TokensBurned(msg.sender, tokenAmount);
    }

    /**
     * @notice Получить баланс в "голосах" (RTK/6 = 1 голос)
     */
    function balanceInVotes(address account) external view returns (uint256) {
        return balanceOf(account) / (6 * (10 ** decimals));
    }

    // Fallback для принятия ETH
    receive() external payable {}
}