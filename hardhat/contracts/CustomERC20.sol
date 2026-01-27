// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface Token {
    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value)  external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender  , uint256 _value) external returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract CustomERC20 is Token {
    uint256 constant private MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;
    uint256 public totalSupply;
    
    address public owner;
    string public name;
    uint8 public decimals;
    string public symbol;

    constructor(string memory _tokenName, uint8 _decimalUnits, string  memory _tokenSymbol) {
        name = _tokenName;
        decimals = _decimalUnits;
        symbol = _tokenSymbol;
        owner = msg.sender;
    }

    function transfer(address _to, uint256 _value) public virtual override returns (bool success) {
        require(balances[msg.sender] >= _value, "token balance is lower than the value requested");
        
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public virtual override returns (bool success) {
        uint256 _allowance = allowed[_from][msg.sender];
        
        require(balances[_from] >= _value && _allowance >= _value, "token balance or _allowance is lower than amount requested");
        
        balances[_to] += _value;
        
        balances[_from] -= _value;
        
        if (_allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }

        emit Transfer(_from, _to, _value);
        
        return true;
    }

    function balanceOf(address _owner) public override view returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public override returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public override view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function mint(address addressToMint, uint256 amount) public {
        require(msg.sender == owner, "Only owner can do this");
     
        balances[addressToMint] += amount;
        totalSupply += amount;
    }

    function burn(address addressFrom, uint256 amount) public {
        require(msg.sender == owner, "Only owner can do this");

        balances[addressFrom] -= amount;
        totalSupply -= amount;
    }
}