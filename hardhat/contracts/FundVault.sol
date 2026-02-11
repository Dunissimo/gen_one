// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FundVault
 * @notice Хранилище ETH для венчурного фонда
 * @dev Управляется FundGovernor через одобренные proposals
 */
contract FundVault is ReentrancyGuard {
    
    // Адрес Governor контракта (единственный, кто может инициировать платежи)
    address public governorContract;
    address public owner;

    // История инвестиций
    mapping(address => uint256) public startupInvestments;
    address[] public investedStartups;
    
    event FundsReceived(address indexed from, uint256 amount);
    event InvestmentMade(address indexed startup, uint256 amount);
    event MaxInvestmentUpdated(uint256 newMax);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Установить адрес Governor (может вызвать только на инициализацию)
     */
    function setGovernor(address _governor) external {
        require(msg.sender == owner, "Only owner can do this");

        require(_governor != address(0), "Invalid governor");
        governorContract = _governor;
    }

    /**
     * @notice Инвестировать в стартап (вызывается только из Governor)
     */
    function investInStartup(address startupAddress, uint256 amount) external nonReentrant {
        require(msg.sender == governorContract, "Only governor can invest");
        require(startupAddress != address(0), "Invalid startup address");
        require(amount > 0, "Amount must be > 0");
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
     * @notice Получить список всех стартапов, в которые инвестировали
     */
    function getInvestedStartups() external view returns (address[] memory) {
        return investedStartups;
    }

    /**
     * @notice Получить общий объем инвестиций в стартап
     */ 
    function getTotalInvestmentInStartup(address startup) external view returns (uint256) {
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