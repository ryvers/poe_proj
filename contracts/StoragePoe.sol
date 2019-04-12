pragma solidity ^0.5.0;


/// @title Storage for Proof Of Existence
/// @author Łukasz Korba
contract StoragePoe {
    /// @notice upgradeability variable, indicates the current address of a logic contract
    address public implementation;
    /// @notice circuit breaker variable which defines whether contract has been stopped by the admin
    bool internal stopped = false;
    /// @notice address of an user to UserInfo structure
    mapping(address => UserInfo) public users;
    /// @notice hash of the file to the FileInfo structure
    mapping(bytes32 => FileInfo) public fileDetails;

    /// @notice structure which holds information about user files
    struct UserInfo {
        uint256 totalUserFiles;
        mapping(uint256 => FileInfo) userFiles;
    }

    /// @notice structure which holds information about file details
    struct FileInfo {
        address holder;
        uint256 dateAdded;
        bytes32 fileHash;
        bytes32 tags;
        bytes ipfsHash;
    }
}
