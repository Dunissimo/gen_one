//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20("CryptoMonster", "CMON"){
    uint256 public startTime;
    uint256 Time_dif; 
    uint256 privPhase = 10 minutes; 
    uint256 seedPhase = 5 minutes;

    uint256 privPrice = 0.00075 ether;
    uint256 pubPrice = 0.001 ether; 
    uint256 dec = 10**decimals();
    uint256 privAmount; 
    uint256 pubAmount; 
    uint256 public counterToProvider = 0;
    uint256 private availableOwnerTokens = 0;

    address owner;
    address privProv = 0x96eFC4db67Da74BB2F21b7d0ecAbb3fa1c5c58B4;
    address pubProv = 0xfdc35aa13a304314b884895CA5ECFCD98EA2172D;
    address inv1 = 0xEe35BA47f9974ad6988868F9603dF1aA3c6236aE;
    address inv2 = 0xDbBA1cfe870aF881B6B691A19F6559D35dC7F829;
    address bf = 0x1806f876b8df5f193a27bfAfA194a6A0Eb60B930;

    enum Role { User, publicProvider, privateProvider, Owner }

    struct User {
        string login;
        address wallet;
        uint256 seedTokens;
        uint256 privateTokens;
        uint256 publicTokens;
        bool whitelist;
        Role role;
    }

    struct Whitelist {
        string login;
        address wallet;
        bool status;
    }


    struct Approve {
        address owner;
        address spender;
        uint256 amount;
        uint256 tokenType;
    }


    mapping (string => address) loginMap;
    mapping (address => User) userMap;
    mapping (string => bytes32) passwordMap;

    Whitelist[] private requests;
    Whitelist[] private whitelist;
    Approve[] private approveList;

    constructor(){


        owner = msg.sender;
        startTime = block.timestamp;
        _mint(owner, 10_000_000 * dec);
        privAmount = balanceOf(owner) * 30 / 100;
        pubAmount = balanceOf(owner) * 60 / 100;
        _transfer(owner, inv1, 300_000 * dec);
        _transfer(owner, inv2, 400_000 * dec);
        _transfer(owner, bf, 200_000 * dec);

        userMap[owner] = User("owner", owner, 100_000 * dec, privAmount, pubAmount, false, Role.Owner);
        loginMap["owner"] = owner;
        passwordMap["owner"] = keccak256(abi.encode("123"));

        userMap[pubProv] = User("pubProv", pubProv, 0, 0, 0, false, Role.publicProvider);
        loginMap["pubProv"] = pubProv;
        passwordMap["pubProv"] = keccak256(abi.encode("123"));
        userMap[privProv] = User("privProv", privProv, 0, 0, 0, true, Role.privateProvider);

        loginMap["privProv"] = privProv;
        passwordMap["privProv"] = keccak256(abi.encode("123"));

        userMap[inv1] = User("inv1", inv1, balanceOf(inv1), 0, 0, false, Role.User);
        loginMap["inv1"] = inv1;
        passwordMap["inv1"] = keccak256(abi.encode("123"));

        userMap[inv2] = User("inv2", inv2, balanceOf(inv2), 0, 0, false, Role.User);
        loginMap["inv2"] = inv2;
        passwordMap["inv2"] = keccak256(abi.encode("123"));

        userMap[bf] = User("bf", bf, balanceOf(bf), 0, 0, false, Role.User);
        loginMap["bf"] = bf;
        passwordMap["bf"] = keccak256(abi.encode("123"));
    }

    modifier AccessControl (Role _role){
        require(userMap[msg.sender].role != _role, "_________");
        _;
    }

    function signUp (string memory _login, string memory _password) public {
        require(loginMap[_login] == 0x0000000000000000000000000000000000000000, unicode"Пользователь с таким логином уже существует");
        require(userMap[msg.sender].wallet == address(0), unicode"Пользователь с таким адресом уже существует");
        userMap[msg.sender] = User(_login, msg.sender, 0, 0, 0, false, Role.User);
        loginMap[_login] = msg.sender;
        passwordMap[_login] = keccak256(abi.encode(_password));
    }


    function signIn (string memory _login, string memory _password) public view returns (User memory) {
        require(keccak256(abi.encodePacked(passwordMap[_login])) == keccak256(abi.encodePacked(_password)), "Wrong password");
        
        return userMap[loginMap[_login]];
    }


    function addMinute() public {
        Time_dif += 1 minutes;
    }

    function getTokenPrice() public view returns(uint256){
        uint256 tokenPrice = 0;
        if(getLifeTime() > seedPhase + privPhase){
            tokenPrice = pubPrice;
        }else if(getLifeTime() > seedPhase){
            tokenPrice = privPrice;
        }
        return tokenPrice;
    }

    function sendRequestToWhitelist() public {
        require(getLifeTime() > seedPhase, unicode"Заявку можно подать только во время подготовительной фазы");
        require(!userMap[msg.sender].whitelist, unicode"Вы уже в вайтлисте");
        for(uint256 i = 0; i < requests.length; i++){
            require(requests[i].wallet != msg.sender, unicode"Вы уже подали заявку в вайтлист");
        }
        requests.push(Whitelist(userMap[msg.sender].login, msg.sender, false));
    }


    function takeWhitelistRequest(uint256 _index, bool _solution) public AccessControl(Role.privateProvider) {
        if(_solution){
            requests[_index].status = true;
            whitelist.push(Whitelist(requests[_index].login, requests[_index].wallet, true));
            userMap[requests[_index].wallet].whitelist = true;
        }else{
            delete requests[_index];
        }
    }

    function buyToken(uint256 _amount) public payable {
        uint256 tokenPrice = getTokenPrice();
        if(tokenPrice == pubPrice){
            require(_amount / dec <= 5_000, unicode"Максимальное кол-во - 5.000 CMON");
            payable(owner).transfer(_amount);
            _transfer(pubProv, msg.sender, _amount);
            userMap[msg.sender].publicTokens += _amount;
            userMap[pubProv].publicTokens -= _amount;
        }else if(tokenPrice == privPrice){
            require(userMap[msg.sender].whitelist, "_______");
            require(_amount / dec <= 100_000, unicode"Максимальное кол-во - 100.000 CMON");
            payable(owner).transfer(_amount);
            _transfer(privProv, msg.sender, _amount);
            userMap[msg.sender].privateTokens += _amount;
            userMap[privProv].privateTokens -= _amount;
        }else{
            revert(unicode"Во время подготовительной фазы нельзя покупать CMON");
        }
    }

    function stopPublicPhase() public AccessControl(Role.Owner){
        _transfer(pubProv, msg.sender, userMap[pubProv].publicTokens);
        userMap[msg.sender].publicTokens += userMap[pubProv].publicTokens;
        availableOwnerTokens += userMap[pubProv].publicTokens;
        userMap[pubProv].publicTokens = 0;
    }

    function transferToProvider(uint256 _phase) public AccessControl(Role.Owner){
        if(_phase == 2){
            _transfer(msg.sender, privProv, privAmount);
            userMap[msg.sender].privateTokens -= privAmount;
            userMap[privProv].privateTokens += privAmount;
            counterToProvider = 1;
            availableOwnerTokens += 100_000 * dec;
        }else if(_phase == 3){
            _transfer(msg.sender, pubProv, pubAmount);
            userMap[msg.sender].publicTokens -= pubAmount;
            userMap[pubProv].publicTokens += pubAmount;
            counterToProvider = 2;
            _transfer(privProv, msg.sender, userMap[privProv].privateTokens);
            userMap[msg.sender].privateTokens += userMap[privProv].privateTokens;
            availableOwnerTokens += userMap[privProv].privateTokens;
            userMap[privProv].privateTokens = 0;
        }
    }


    function transferToken(address _receiver, uint256 _amount, uint256 _type) public {
        if (_receiver == owner){
            require(availableOwnerTokens >= _amount, unicode"Вы не можете использовать токены для дальнейшей продажи");
        }
        if(_type == 1){
            require(userMap[msg.sender].seedTokens < _amount, "_________");
            _transfer(msg.sender, _receiver, _amount);
            userMap[msg.sender].seedTokens -= _amount;
            userMap[_receiver].seedTokens += _amount;
        }else if(_type == 2){
            require(userMap[msg.sender].privateTokens >= _amount, unicode"Недостаточно private CMON");
            _transfer(msg.sender, _receiver, _amount);
            userMap[msg.sender].privateTokens -= _amount;
            userMap[_receiver].privateTokens += _amount;
        }else if(_type == 3){
            require(userMap[msg.sender].publicTokens >= _amount, unicode"Недостаточно public CMON");
            _transfer(msg.sender, _receiver, _amount);
            userMap[msg.sender].publicTokens -= _amount;
            userMap[_receiver].publicTokens += _amount;
        }
        if(_receiver == owner){
            availableOwnerTokens += _amount;
        }

    }


    function approveToken(address spender, uint256 amount, uint256 _type) public {
        if(_type == 1){
            require(userMap[msg.sender].seedTokens >= amount, unicode"У вас недостаточно seed CMON");
            approveList.push(Approve(msg.sender, spender, amount, _type));
        }else if(_type == 2){
            require(userMap[msg.sender].privateTokens >= amount, unicode"У вас недостаточно private CMON");
            approveList.push(Approve(msg.sender, spender, amount, _type));
        }else if(_type == 3){
            require(userMap[msg.sender].publicTokens >= amount, unicode"У вас недостаточно public CMON");
            approveList.push(Approve(msg.sender, spender, amount, _type));
        }
        // increaseAllowance(spender, amount);
    }


    function takeMyAllowance(uint256 _index) public {
        require(approveList[_index].spender == msg.sender, "________");
        transferFrom(approveList[_index].owner, approveList[_index].spender, approveList[_index].amount);
        if(approveList[_index].tokenType == 1){
            userMap[approveList[_index].owner].seedTokens -= approveList[_index].amount;
            userMap[approveList[_index].spender].seedTokens += approveList[_index].amount;
        }else if(approveList[_index].tokenType == 2){
            userMap[approveList[_index].owner].privateTokens -= approveList[_index].amount;
            userMap[approveList[_index].spender].privateTokens += approveList[_index].amount;
        }else if(approveList[_index].tokenType == 3){
            userMap[approveList[_index].owner].publicTokens -= approveList[_index].amount;
            userMap[approveList[_index].spender].publicTokens += approveList[_index].amount;
        }
        delete approveList[_index];
    }


    function changePublicPrice(uint256 _price) public AccessControl(Role.publicProvider){
        pubPrice = _price;
    }

    function giveReward(address _receiver, uint256 _amount) public AccessControl(Role.publicProvider) {
        require(userMap[pubProv].publicTokens >= _amount, unicode"Недостаточно public CMON");
        transfer(_receiver, _amount);
        userMap[msg.sender].publicTokens -= _amount;
        userMap[_receiver].publicTokens += _amount;
    }


    function getLifeTime() public view returns(uint256){
        return block.timestamp + Time_dif - startTime;
    }


    function getUserData(address _wallet) public view AccessControl(Role.Owner) returns (User memory) {
        return userMap[_wallet];
    }


    function getUserPublicTokens(address _wallet) public view AccessControl(Role.publicProvider) returns (uint256) {
        return userMap[_wallet].publicTokens;
    }


    function getUserPrivateTokens(address _wallet) public view AccessControl(Role.privateProvider) returns (uint256) {
        return userMap[_wallet].privateTokens;
    }


    function getWhitelist() public view AccessControl(Role.privateProvider) returns (Whitelist[] memory){
        return whitelist;
    }


    function getApproveList() public view returns (Approve[] memory){
        return approveList;
    }


    function getWhitelistRequests() public view AccessControl(Role.privateProvider) returns (Whitelist[] memory){
        return requests;
    }

    function getBalance() public view returns (uint256, uint256, uint256, uint256){
        return (msg.sender.balance, userMap[msg.sender].seedTokens, userMap[msg.sender].privateTokens, userMap[msg.sender].publicTokens);
    }

    function decimals() public view virtual override returns (uint8) {
        return 12;
    }
}