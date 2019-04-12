pragma solidity ^0.5.0;

import "./StoragePoe.sol";
import "./Ownable.sol";


/// @title Proxy for Proof Of Existence
/// @author openzeppelin
/// @dev Gives the possibility to delegate any call to a foreign implementation.
contract ProxyPoe is StoragePoe, Ownable {
    event Upgraded(address indexed implementation);
    event Withdrawal(uint256 balance);

    /// @notice initalizes contract with contract owner
    /// @dev msg.sender is set as an owner
    constructor() public {
        owner = msg.sender;
    }

    /**
     * @dev Fallback function allowing to perform a delegatecall
     * to the given implementation.
     * @return This function will return
     * whatever the implementation call returns
     */
    function () external payable {
        address impl = implementation;
        require(impl != address(0));
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, impl, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

    /**
     * @dev Upgrades the implementation address
     * @param newImplementation address of the new implementation
     */
    function upgradeTo(address newImplementation) external onlyOwner
    {
        require(implementation != newImplementation, "New address is required");
        setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
     * @dev Withdraws the ether balance to the owner address
     * Prevents locking ether in contract
     */
    function withdraw() external onlyOwner {
        uint amountEth = address(this).balance;
        emit Withdrawal(amountEth);
        msg.sender.transfer(amountEth);
    }

    /**
     * @dev Sets the address of the current implementation
     * @param newImp address of the new implementation
     */
    function setImplementation(address newImp) internal {
        implementation = newImp;
    }
}
