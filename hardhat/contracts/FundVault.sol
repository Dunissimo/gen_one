// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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

    constructor() Ownable(msg.sender) {}

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