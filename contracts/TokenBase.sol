// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenBase is ERC20, AccessControl {
    bytes32 public constant OWNER = keccak256(abi.encodePacked("OWNER"));

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address _to, uint _amount)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _mint(_to, _amount);
    }

    function burn(address _from, uint _amount)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _burn(_from, _amount);
    }
}
