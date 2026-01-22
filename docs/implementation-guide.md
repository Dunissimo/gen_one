# Рекомендации по реализации и важные замечания

## 🚀 План реализации (7 часов)

### Этап 1: Настройка проекта (30 минут)
```bash
# Инициализировать Hardhat проект
npx hardhat init

# Установить зависимости
npm install --save-dev hardhat @openzeppelin/contracts @nomiclabs/hardhat-ethers ethers

# Структура папок
contracts/
  ├── Professional.sol
  ├── RTKCoin.sol
  ├── FundVault.sol
  ├── ProposalManager.sol
  ├── VotingSystem.sol
  ├── QuorumCalculator.sol
  └── FundGovernor.sol (основной контракт)

test/
  ├── setup.js
  ├── test.professional.js
  ├── test.voting.js
  └── test.scenarios.js

scripts/
  ├── deploy.js
  └── init-system.js
```

### Этап 2: Реализация базовых токенов (1 час)
- [ ] Professional.sol с ERC20Votes
- [ ] RTKCoin.sol простой ERC20
- [ ] Базовые тесты для каждого

### Этап 3: Система управления (1.5 часа)
- [ ] ProposalManager.sol
- [ ] VotingSystem.sol
- [ ] QuorumCalculator.sol
- [ ] Интеграционные тесты

### Этап 4: Governor контракт (2 часа)
- [ ] Основной FundGovernor.sol
- [ ] Интеграция с другими контрактами
- [ ] FundVault.sol
- [ ] Тесты жизненного цикла proposals

### Этап 5: Полное тестирование (1.5 часа)
- [ ] Все 6 типов proposals
- [ ] Все механизмы кворума
- [ ] Edge cases
- [ ] Deploy скрипты

### Этап 6: Документация и polish (0.5 часа)
- [ ] Комментарии в коде
- [ ] README
- [ ] Примеры использования

---

## ⚠️ Критические замечания

### 1️⃣ PROFI токен НЕ может передаваться

**ОБЯЗАТЕЛЬНО:** Переопределить функции `transfer` и `transferFrom` с `revert()`

```solidity
function transfer(address, uint256) public override pure returns (bool) {
    revert("PROFI tokens are not transferable");
}

function transferFrom(address, address, uint256) public override pure returns (bool) {
    revert("PROFI tokens are not transferable");
}
```

**Почему:**
- PROFI это не товар, это право голоса
- Если будут передаваться, люди будут торговать голосами
- Нарушится вся система управления

---

### 2️⃣ RTK токены НЕ создают долю в инвестициях

**ВАЖНО:**
- RTK это НЕ акции стартапа
- RTK это НЕ долг фонда перед держателем
- RTK это ВРЕМЕННЫЙ инструмент для голосования на одно голосование
- После завершения голосования RTK возвращаются владельцу

**Структура:**
```
RTK используется ДЛЯ:
✅ Временного увеличения голоса в конкретном голосовании
✅ Делегирования голосов участнику DAO
❌ НЕ для получения доли в прибыли
❌ НЕ для получения дивидендов
❌ НЕ для прав собственности
```

**Блокировка:**
- RTK блокируются в контракте во время голосования
- Нельзя передать заблокированный RTK
- После завершения голосования можно забрать

---

### 3️⃣ Конверсия голосов - будьте точны

```solidity
// ❌ НЕПРАВИЛЬНО - потеря точности
function convertProfiToVotes(uint256 profiAmount) external view returns (uint256) {
    return profiAmount / 3;  // Потеря decimals!
}

// ✅ ПРАВИЛЬНО - с учетом decimals
function convertProfiToVotes(uint256 profiAmount) public pure returns (uint256) {
    // profiAmount уже содержит decimals (12)
    // 1 голос = 3 * 10^12 токенов
    return profiAmount / (3 * 10**12);
}
```

**Примеры:**
```
PROFI (decimals = 12):
- 25,000 PROFI = 25,000 * 10^12 = 25000000000000000000000

RTK (decimals = 12):
- 6 RTK = 6 * 10^12 = 6000000000000000000

Голоса (не имеют decimals):
- 1 голос = целое число
- Tom (25000 * 10^12) / (3 * 10^12) = 8333 голоса
- Jack (6 * 10^12) / (6 * 10^12) = 1 голос
```

---

### 4️⃣ Механизм кворума зависит от типа proposal

```solidity
// Таблица разрешенных кворумов
mapping(uint8 proposalType => uint8[] allowedQuorums) public quorumRules;

// Типы A (1) и B (2): ТОЛЬКО WeightVote
allowedQuorums[1] = [2];  // WeightVote
allowedQuorums[2] = [2];  // WeightVote

// Типы C (3), D (4), E (5), F (6): SimpleM или SuperM
allowedQuorums[3] = [0, 1];  // SimpleM или SuperM
allowedQuorums[4] = [0, 1];
allowedQuorums[5] = [0, 1];
allowedQuorums[6] = [0, 1];
```

**Почему разные кворумы?**
- Инвестиции (A, B): зависят от объема средств, не от большинства
- Управление (C, D, E, F): требуют консенсуса большинства

---

### 5️⃣ Делегирование голосов - сложный момент

**Проблема:** Как выполнить делегирование в блокчейне?

**Решение:** Использовать временное хранилище (escrow pattern)

```solidity
// Структура для отслеживания делегирования
struct ActiveDelegation {
    uint256 proposalId;
    address delegator;
    address delegatee;
    uint256 rtkAmount;
    bool returned;
}

mapping(uint256 delegationId => ActiveDelegation) delegations;

// Процесс:
// 1. delegator.rtk → smartContract.escrow (блокируется)
// 2. smartContract добавляет RTK голоса к delegatee
// 3. delegatee голосует с увеличенной силой
// 4. После голосования: escrow.rtk → delegator (возвращается)
```

---

### 6️⃣ Состояние proposal - строгий контроль

```solidity
// Жизненный цикл статусов
Pending 
  → Active (только через startVoting)
  → Canceled (только создатель, только из Pending)
  → Defeated (автоматически из Active после votingEnd)
  → Succeeded (автоматически из Active после votingEnd, если passed)
  → Executed (только из Succeeded)

// ❌ НЕПРАВИЛЬНАЯ последовательность будет отклонена
// Пример: Canceled → Active (невозможно)
// Пример: Defeated → Executed (невозможно)
```

---

### 7️⃣ Проверка вычисления кворума

```javascript
// Тестовый случай для SimpleM
totalVotes = 100;
votesFor = 51;
votesAgainst = 49;

quorumRequired = Math.floor(100 / 2) + 1;  // 50 + 1 = 51
passed = votesFor >= quorumRequired;  // 51 >= 51 → TRUE ✓

// Граничный случай
totalVotes = 99;
votesFor = 50;
votesAgainst = 49;

quorumRequired = Math.floor(99 / 2) + 1;  // 49 + 1 = 50
passed = votesFor >= quorumRequired;  // 50 >= 50 → TRUE ✓

// SuperM
totalVotes = 100;
votesFor = 67;
votesAgainst = 33;

quorumRequired = Math.ceil((100 * 2) / 3);  // 66.67 → 67
passed = votesFor >= quorumRequired;  // 67 >= 67 → TRUE ✓
```

---

## 🛡️ Безопасность

### 1. Проверка reentrancy

```solidity
// При отправке ETH использовать call + проверка
(bool success, ) = payable(recipient).call{value: amount}("");
require(success, "ETH transfer failed");

// НЕ использовать transfer() - может быть недостаточно газа
```

### 2. Проверка двойного голосования

```solidity
// Перед голосованием проверить
require(votes[proposalId][voter].voter == address(0), "Already voted");

// После голосования это условие не позволит голосовать снова
```

### 3. Overflow/Underflow

```solidity
// Solidity 0.8+ автоматически проверяет
// Но проверьте деления!
quorumRequired = (totalVotes * 2) / 3;
// Может быть меньше, чем ожидается, если делится нацело

// Правильнее:
quorumRequired = (totalVotes * 2) / 3;
if ((totalVotes * 2) % 3 != 0) {
    quorumRequired += 1;  // Округлить вверх
}
```

### 4. Проверка нулевых адресов

```solidity
require(startupAddress != address(0), "Invalid startup address");
require(memberAddress != address(0), "Invalid member address");
require(delegatee != address(0), "Invalid delegatee");
```

---

## 📝 Инициализация на тестнете

### Deploy script (scripts/deploy.js)

```javascript
async function main() {
    const [deployer, tom, ben, rick, jack, startupA] = await ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // 1. Deploy tokens
    const Professional = await ethers.getContractFactory("Professional");
    const profi = await Professional.deploy();
    console.log("PROFI deployed to:", profi.address);

    const RTKCoin = await ethers.getContractFactory("RTKCoin");
    const rtk = await RTKCoin.deploy();
    console.log("RTK deployed to:", rtk.address);

    // 2. Deploy vault
    const FundVault = await ethers.getContractFactory("FundVault");
    const vault = await FundVault.deploy();
    console.log("FundVault deployed to:", vault.address);

    // 3. Deploy management system
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposals = await ProposalManager.deploy();
    console.log("ProposalManager deployed to:", proposals.address);

    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const voting = await VotingSystem.deploy();
    console.log("VotingSystem deployed to:", voting.address);

    const QuorumCalculator = await ethers.getContractFactory("QuorumCalculator");
    const quorum = await QuorumCalculator.deploy();
    console.log("QuorumCalculator deployed to:", quorum.address);

    // 4. Deploy Governor
    const FundGovernor = await ethers.getContractFactory("FundGovernor");
    const governor = await FundGovernor.deploy(
        profi.address,
        proposals.address,
        voting.address,
        quorum.address,
        vault.address
    );
    console.log("FundGovernor deployed to:", governor.address);

    // 5. Initialize
    const members = [tom.address, ben.address, rick.address];
    const amount = ethers.parseUnits("25000", 12);
    await profi.initializeDAOMembers(members, amount);
    console.log("DAO members initialized");

    // 6. Setup connections
    await vault.setGovernor(governor.address);
    await rtk.setGovernor(governor.address);
    console.log("Contracts linked");

    // 7. Fund vault
    const fundAmount = ethers.parseEther("1000000");
    await deployer.sendTransaction({
        to: vault.address,
        value: fundAmount
    });
    console.log("Vault funded with", fundAmount.toString(), "wei");

    // Save addresses
    const addresses = {
        profi: profi.address,
        rtk: rtk.address,
        vault: vault.address,
        proposals: proposals.address,
        voting: voting.address,
        quorum: quorum.address,
        governor: governor.address
    };

    console.log("\n--- Contract Addresses ---");
    console.log(JSON.stringify(addresses, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## 🧪 Минимальный набор тестов

```bash
# Запуск тестов
npx hardhat test

# Вывод
  Professional
    ✓ Should mint PROFI to DAO members
    ✓ Should prevent PROFI transfer
    ✓ Should track votes

  RTKCoin
    ✓ Should allow purchasing RTK with ETH
    ✓ Should transfer RTK between users
    ✓ Should allow delegation

  Voting
    ✓ Should create proposal (Type A)
    ✓ Should start voting
    ✓ Should cast votes
    ✓ Should finalize vote
    ✓ Should check SimpleM quorum
    ✓ Should check SuperM quorum
    ✓ Should check WeightVote quorum

  Integration
    ✓ Should complete full cycle (propose → vote → execute)
    ✓ Should handle delegation in voting

  28 passing (45s)
```

---

## 📋 Финальный чек-лист перед сдачей

### Контракты
- [ ] Professional.sol компилируется без ошибок
- [ ] RTKCoin.sol компилируется без ошибок
- [ ] FundVault.sol компилируется без ошибок
- [ ] ProposalManager.sol компилируется без ошибок
- [ ] VotingSystem.sol компилируется без ошибок
- [ ] QuorumCalculator.sol компилируется без ошибок
- [ ] FundGovernor.sol компилируется без ошибок

### Функциональность
- [ ] Можно создавать все 6 типов proposals
- [ ] Голосование работает с правильным расчетом голосов
- [ ] Все три механизма кворума работают
- [ ] Делегирование RTK работает
- [ ] Proposal выполняется после голосования
- [ ] PROFI не может быть передано между пользователями

### Тестирование
- [ ] Есть минимум 20 тестов
- [ ] Все тесты проходят
- [ ] Тесты включают edge cases
- [ ] Покрыты все сценарии из документации

### Документация
- [ ] Все контракты имеют комментарии NatSpec
- [ ] Есть README с инструкциями
- [ ] Есть примеры использования
- [ ] Есть диаграммы архитектуры

---

## 💡 Полезные ссылки

- [OpenZeppelin Governance](https://docs.openzeppelin.com/contracts/4.x/governance)
- [ERC20Votes](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Votes)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js API](https://docs.ethers.org/v6/)
- [Solidity Best Practices](https://solidity.readthedocs.io/en/latest/)

---

## 🎯 Итоговое резюме

**Архитектура обеспечивает:**
✅ Полную прозрачность голосования  
✅ Безопасность от манипуляций  
✅ Гибкость в управлении фондом  
✅ Возможность участия без полного членства  
✅ Полную историю всех решений  

**Время развития:** ~7 часов  
**Сложность:** Средняя  
**Требования:** Solidity, JavaScript, Hardhat  

Удачи в разработке! 🚀
