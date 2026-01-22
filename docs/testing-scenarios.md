# Практические примеры и тестовые сценарии

## 🎯 Сценарий 1: Инвестирование в новый стартап (Тип A)

### Начальное состояние
```
Участники DAO:
- Tom: 25,000 PROFI = 8,333 голосов
- Ben: 25,000 PROFI = 8,333 голосов
- Rick: 25,000 PROFI = 8,334 голосов
- Всего в системе: 24,999 голосов DAO

Неучастники:
- Jack: 0 PROFI, 20 ETH на счете

Казна фонда:
- FundVault: 1,000,000 ETH
```

### Шаги выполнения

#### Шаг 1: Tom создает proposal инвестировать в Startup A

```javascript
// Frontend JavaScript
const proposalData = {
    proposalType: 1,            // Type A: Invest in new startup
    startupAddress: "0xStartupA",
    amount: ethers.parseEther("100"),
    description: "Invest 100 ETH in Startup A - AI Infrastructure"
};

// Вызов контракта
const tx = await fundGovernor.propose(
    proposalData.proposalType,
    proposalData.startupAddress,
    proposalData.amount,
    "0x",  // proposalData для типов E, F
    proposalData.description
);

const receipt = await tx.wait();
const proposalId = receipt.events.find(e => e.event === 'ProposalCreated').args.proposalId;
// proposalId = 1
```

#### Шаг 2: Tom инициирует голосование

```javascript
// Выбирает кворум "Вес голосов" (только тип 2 разрешен для типа A)
const votingPeriod = 50_400; // ~7 дней в блоках

const tx = await fundGovernor.startVoting(
    proposalId,
    2,  // quorumType: WeightVote
    votingPeriod
);

// Система устанавливает:
// proposal.votingStartTime = block.timestamp (например, 1000)
// proposal.votingEndTime = block.timestamp + 50_400 (например, 51400)
// proposal.status = Active
```

#### Шаг 3: Jack (неучастник) хочет помочь инвестировать

```javascript
// Jack покупает RTK токены за ETH
// 1 голос = 6 RTK
// Jack хочет добавить 1 голос, значит нужно 6 RTK
// 1 RTK = 1 ETH, значит 6 ETH

// Покупка RTK
const rtkAmount = ethers.parseUnits("6", 12);
const ethCost = ethers.parseEther("6");

const tx = await rtkToken.purchaseTokens(rtkAmount, {
    value: ethCost
});

// Jack теперь имеет 6 RTK (в его кошельке)
```

#### Шаг 4: Jack делегирует свой голос Ben

```javascript
// Jack решает дать свой голос Ben (participates in voting on behalf)
// Это не передача токенов, это временная привязка голосов

const tx = await fundGovernor.delegateVotingPower(
    proposalId,
    "0xBen",  // delegatee
    rtkAmount  // 6 RTK = 1 голос
);

// RTK токены переводятся в смарт-контракт (блокируются)
// Голоса добавляются к Ben для этого proposal
```

#### Шаг 5: Голосование

```javascript
// Tom голосует "За" (For)
const tx1 = await fundGovernor.castVote(
    proposalId,
    1,  // support: For
    ethers.parseUnits("25000", 12),  // profiAmount
    0   // rtkAmount (Tom может голосовать только PROFI)
);

// Вычисление голосов Tom:
// - PROFI: 25,000 / 3 = 8,333 голоса
// - RTK: 0 / 6 = 0 голосов
// - Всего: 8,333 голоса
// Эвент: VoteCast(proposalId=1, voter=Tom, support=1, votingPower=8333)

// Ben голосует "За" (For) со своим PROFI + делегированными RTK
const tx2 = await fundGovernor.castVote(
    proposalId,
    1,  // support: For
    ethers.parseUnits("25000", 12),  // profiAmount
    rtkAmount  // 6 RTK от Jack
);

// Вычисление голосов Ben:
// - PROFI: 25,000 / 3 = 8,333 голоса
// - RTK: 6 / 6 = 1 голос
// - Всего: 8,334 голоса
// Эвент: VoteCast(proposalId=1, voter=Ben, support=1, votingPower=8334)

// Rick голосует "Против" (Against)
const tx3 = await fundGovernor.castVote(
    proposalId,
    0,  // support: Against
    ethers.parseUnits("25000", 12),
    0
);

// Вычисление голосов Rick:
// - PROFI: 25,000 / 3 = 8,334 голоса
// - RTK: 0 / 6 = 0 голосов
// - Всего: 8,334 голоса
// Эвент: VoteCast(proposalId=1, voter=Rick, support=0, votingPower=8334)
```

#### Шаг 6: Завершение голосования и подсчет

```javascript
// После истечения votingEndTime (51400 блок)
// Любой может вызвать finalize

const tx = await fundGovernor.finalizeVote(proposalId);

// Подсчет:
// votesFor = 8333 + 8334 = 16667
// votesAgainst = 8334
// votesAbstain = 0

// Проверка кворума (type WeightVote):
// WeightVote просто проверяет: votesFor > votesAgainst
// 16667 > 8334 → TRUE

// Результат: PASSED ✓
// proposal.status = Succeeded
// Эвент: ProposalPassed(proposalId=1, votesFor=16667, votesAgainst=8334)
```

#### Шаг 7: Исполнение решения

```javascript
// Любой может исполнить решение
const tx = await fundGovernor.executeProposal(proposalId);

// Система проверит:
// 1. proposal.status == Succeeded ✓
// 2. proposal.votingEndTime <= block.timestamp ✓
// 3. !proposal.executed ✓

// Выполнение для типа A (инвестирование):
// 1. Перевести 100 ETH из FundVault в адрес Startup A
const transferTx = await fundVault.investInStartup(
    "0xStartupA",
    ethers.parseEther("100")
);

// 2. Разблокировать RTK токены (вернуть Jack'у)
const rtk = await fundGovernor.returnDelegatedRTK(proposalId, "0xJack");

// 3. Обновить статус
// proposal.executed = true
// proposal.status = Executed
// Эвент: ProposalExecuted(proposalId=1, eventType=1)

// После этого:
// - Startup A получил 100 ETH
// - Jack получил свой 6 RTK обратно
// - FundVault.startupInvestments[0xStartupA] = 100 ETH
// - Все в блокчейне записано
```

---

## 🎯 Сценарий 2: Добавить нового участника (Тип C)

### Начальное состояние
```
Участники DAO (3): Tom, Ben, Rick
Кандидат: Jack (в Ethereum сети есть, но не в DAO)
```

### Шаги выполнения

#### Шаг 1: Tom создает proposal добавить Jack

```javascript
const proposalData = {
    proposalType: 3,            // Type C: Add new member
    memberAddress: "0xJack",
    description: "Add Jack as DAO member - Fund Manager"
};

const tx = await fundGovernor.propose(
    proposalData.proposalType,
    proposalData.memberAddress,
    0,  // amount (не используется для типа C)
    "0x",
    proposalData.description
);

const proposalId = 2;  // Новый proposal
```

#### Шаг 2: Инициирование голосования

```javascript
// Для типа C разрешены два кворума:
// - SimpleM (50% + 1)
// - SuperM (2/3)
// Инициатор выбирает

// Tom выбирает SimpleM
const tx = await fundGovernor.startVoting(proposalId, 0, 50_400);
// quorumType = 0 (SimpleM)
```

#### Шаг 3: Голосование

```javascript
// Tom голосует "За"
await fundGovernor.castVote(proposalId, 1, ethers.parseUnits("25000", 12), 0);
// votesFor += 8,333

// Ben голосует "За"
await fundGovernor.castVote(proposalId, 1, ethers.parseUnits("25000", 12), 0);
// votesFor += 8,333

// Rick голосует "Против"
await fundGovernor.castVote(proposalId, 0, ethers.parseUnits("25000", 12), 0);
// votesAgainst += 8,334

// Итого:
// votesFor = 16,666
// votesAgainst = 8,334
```

#### Шаг 4: Проверка кворума (SimpleM)

```javascript
const totalVotes = 16666 + 8334;    // 25,000
const quorumRequired = (25000 / 2) + 1;  // 12,501

// Проверка: votesFor >= quorumRequired
// 16,666 >= 12,501 → TRUE

// Результат: PASSED ✓
```

#### Шаг 5: Исполнение

```javascript
const tx = await fundGovernor.executeProposal(proposalId);

// Система выполняет для типа C:
// 1. Проверить, что адрес не уже в DAO
// 2. Выдать 25,000 PROFI новому члену
// 3. Добавить в mapping isDAOMember[0xJack] = true
// 4. Добавить в массив daoMembers

// После этого Jack становится полноправным членом DAO
// и может создавать proposals и голосовать
```

---

## 🎯 Сценарий 3: Исключить участника (Тип D)

### Начальное состояние
```
Участники DAO (4): Tom, Ben, Rick, Jack
Нужно исключить: Jack
```

### Шаги выполнения

```javascript
// Шаг 1: Ben создает proposal исключить Jack
const proposalId = 3;
await fundGovernor.propose(
    4,  // Type D: Remove member
    "0xJack",
    0,
    "0x",
    "Remove Jack from DAO"
);

// Шаг 2: Инициирование голосования с SuperM
await fundGovernor.startVoting(proposalId, 1, 50_400);
// quorumType = 1 (SuperM: 2/3)

// Шаг 3: Голосование
// Tom "За" - 8,333 голоса
// Ben "За" - 8,333 голоса
// Rick "За" - 8,334 голоса
// Jack "Против" - 8,333 голоса

// Итого:
// votesFor = 25,000
// votesAgainst = 8,333

// Шаг 4: Проверка SuperM кворума
const quorumRequired = (25000 * 2) / 3;  // 16,666.67 → 16,667
// 25,000 >= 16,667 → TRUE

// Результат: PASSED ✓

// Шаг 5: Исполнение
// Система выполняет для типа D:
// 1. Сжечь PROFI токены Jack'а
// 2. Установить isDAOMember[0xJack] = false
// 3. Удалить из массива daoMembers
// 4. Заблокировать возможность голосовать
```

---

## 🎯 Сценарий 4: Управление системным токеном (Тип E)

### Пример: Изменение стоимости голоса

```javascript
// Текущее состояние: 1 голос = 3 PROFI

// Шаг 1: Rick создает proposal изменить конверсию
const proposalData = {
    proposalType: 5,  // Type E: Manage PROFI
    description: "Change vote conversion from 3 to 4 PROFI per vote"
};

const newConversion = ethers.parseUnits("4", 12);
const tx = await fundGovernor.propose(
    5,
    ethers.constants.AddressZero,  // не используется
    newConversion,  // новое значение
    encodeAbi("updateVoteConversion", [newConversion]),
    "Update PROFI vote conversion"
);

// Шаг 2: Инициирование с SuperM кворумом
await fundGovernor.startVoting(proposalId, 1, 50_400);

// Шаг 3-4: Голосование и проверка (supermajority)
// Все голосуют "За"
// votesFor = 25,000
// votesAgainst = 0
// 25,000 >= 16,667 → PASSED

// Шаг 5: Исполнение
// После этого: 1 голос = 4 PROFI
// Новые расчеты:
// - Tom (25,000 PROFI): 25,000 / 4 = 6,250 голосов (было 8,333)
// - Влияние уменьшилось
```

---

## 💻 Код для Hardhat тестирования

### setup.js - Инициализация

```javascript
const hre = require("hardhat");
const { ethers } = hre;

async function setup() {
    // Получить тестовые аккаунты
    const [deployer, tom, ben, rick, jack, startupA] = await ethers.getSigners();
    
    // Развернуть токены
    const Professional = await ethers.getContractFactory("Professional");
    const profi = await Professional.deploy();
    
    const RTKCoin = await ethers.getContractFactory("RTKCoin");
    const rtk = await RTKCoin.deploy();
    
    // Развернуть казну
    const FundVault = await ethers.getContractFactory("FundVault");
    const vault = await FundVault.deploy();
    
    // Развернуть систему управления
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposals = await ProposalManager.deploy();
    
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const voting = await VotingSystem.deploy();
    
    const QuorumCalculator = await ethers.getContractFactory("QuorumCalculator");
    const quorum = await QuorumCalculator.deploy();
    
    // Развернуть Governor
    const FundGovernor = await ethers.getContractFactory("FundGovernor");
    const governor = await FundGovernor.deploy(
        profi.address,
        proposals.address,
        voting.address,
        quorum.address,
        vault.address
    );
    
    // Инициализировать
    const members = [tom.address, ben.address, rick.address];
    const amount = ethers.parseUnits("25000", 12);
    await profi.initializeDAOMembers(members, amount);
    
    // Настроить связи
    await vault.setGovernor(governor.address);
    await rtk.setGovernor(governor.address);
    
    // Зафондировать казну
    await deployer.sendTransaction({
        to: vault.address,
        value: ethers.parseEther("1000000")
    });
    
    return {
        profi,
        rtk,
        vault,
        proposals,
        voting,
        quorum,
        governor,
        signers: { deployer, tom, ben, rick, jack, startupA }
    };
}

module.exports = { setup };
```

### test.investment.js - Тестирование инвестирования

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setup } = require("./setup");

describe("Investment Proposal (Type A)", function () {
    let contracts;
    let signers;

    beforeEach(async function () {
        contracts = await setup();
        signers = contracts.signers;
    });

    it("Should create and pass investment proposal", async function () {
        const { governor, vault, rtk } = contracts;
        const { tom, ben, rick, jack, startupA } = signers;

        // 1. Create proposal
        const investAmount = ethers.parseEther("100");
        const tx = await governor.connect(tom).propose(
            1,  // Type A: Invest in new startup
            startupA.address,
            investAmount,
            "0x",
            "Invest in StartupA"
        );

        const receipt = await tx.wait();
        const proposalId = receipt.events.find(
            e => e.event === 'ProposalCreated'
        ).args.proposalId;

        // 2. Start voting with weight voting
        await governor.connect(tom).startVoting(proposalId, 2, 50400);

        // 3. Jack delegates RTK to Ben
        const rtkAmount = ethers.parseUnits("6", 12);  // 1 vote
        await rtk.connect(jack).purchaseTokens(rtkAmount, {
            value: ethers.parseEther("6")
        });
        
        await governor.connect(jack).delegateVotingPower(
            proposalId,
            ben.address,
            rtkAmount
        );

        // 4. Cast votes
        const profiAmount = ethers.parseUnits("25000", 12);
        
        await governor.connect(tom).castVote(proposalId, 1, profiAmount, 0);
        await governor.connect(ben).castVote(proposalId, 1, profiAmount, rtkAmount);
        await governor.connect(rick).castVote(proposalId, 0, profiAmount, 0);

        // 5. Mine blocks to end voting period
        await ethers.provider.send("hardhat_mine", ["0xc510"]);  // 50,400 blocks

        // 6. Finalize vote
        await governor.finalizeVote(proposalId);

        // 7. Execute
        const vaultBalanceBefore = await ethers.provider.getBalance(vault.address);
        await governor.executeProposal(proposalId);
        const vaultBalanceAfter = await ethers.provider.getBalance(vault.address);

        // Проверки
        expect(vaultBalanceBefore - vaultBalanceAfter).to.equal(investAmount);
        expect(await vault.getTotalInvestmentInStartup(startupA.address))
            .to.equal(investAmount);
    });
});
```

---

## 📊 Расчеты для проверки

### Конвертация голосов

```javascript
// Константы системы
PROFI_PER_VOTE = 3 * 10^12
RTK_PER_VOTE = 6 * 10^12

// Пример 1: участник с 25,000 PROFI
votingPower = 25000 * 10^12 / (3 * 10^12)
           = 25000 / 3
           = 8,333.33
           = 8,333 голоса (integer)

// Пример 2: неучастник с 6 RTK (6 * 10^12 токенов)
votingPower = 6 * 10^12 / (6 * 10^12)
           = 1 голос

// Пример 3: Ben (PROFI + делегированный RTK)
beenProfiVotes = 25000 / 3 = 8,333
benRtkVotes = 6 / 6 = 1
benTotalVotes = 8,333 + 1 = 8,334
```

### Проверка кворумов

```javascript
// SimpleM: 50% + 1
totalVotes = 25,000
quorumRequired = (25000 / 2) + 1 = 12,501
requiredPercentage = 12501 / 25000 = 50.04%

// SuperM: 2/3
quorumRequired = (25000 * 2) / 3 = 16,666.67 → 16,667
requiredPercentage = 16667 / 25000 = 66.67%

// WeightVote: просто votesFor > votesAgainst (no minimum)
```

---

## ✅ Чек-лист архитектуры

- [x] Два токена (PROFI + RTK) с правильной конверсией
- [x] Три типа пользователей с разными правами
- [x] Шесть типов proposals
- [x] Три механизма кворума
- [x] Система делегирования для неучастников
- [x] Жизненный цикл proposal (create → vote → execute)
- [x] Хранилище инвестиций
- [x] Все события для UI
- [x] Проверка безопасности (reentrancy, double voting)
- [x] Примеры тестирования

Архитектура готова к развертыванию! 🚀
