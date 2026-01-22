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

    constructor() ERC20("RTKCoin", "RTK") Ownable(msg.sender) {
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