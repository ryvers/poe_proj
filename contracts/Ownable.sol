pragma solidity ^0.5.0;


/// @title Ownable
/// @author community
/// @notice Ownership contract, which can limit access or define owner
/// @dev contract community checked, no issues known.
contract Ownable {
    /// @notice address of an owner
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice initializes contract with owners
    /// @dev sets msg.sender as an owner
    constructor() public {
        owner = msg.sender;
    }

    /// @dev limits access by checking whether msg.sender is an owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Access Denied");
        _;
    }

    /// @notice changing owner of the contract
    /// @dev new owner will be set only if request is made by the old owner
    /// @param newOwner address of the new owner
    /// @return none
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
