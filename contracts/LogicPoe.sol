pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./StoragePoe.sol";
import "./Ownable.sol";


/// @title Logic for Proof Of  Existence
/// @author Łukasz Korba
/// @notice you can use this contract for various file registry reasons
/// @dev all function calls were implemented without side effects
contract LogicPoe is StoragePoe, Ownable {
    using SafeMath for uint256;

    /// @notice event emitted when circuit breaker has been used
    event StateChanged (address who, uint256 when, bool state);
    /// @notice event emitted when new file has been added to the registry
    event FileAdded(address owner, uint256 dateAdded, bytes32 fileHash, bytes32 tags, bytes ipfsHash);

    /// @dev prevents execution when contract stopped - circuit breaker
    modifier isActive { require(!stopped, "Contract is disabled"); _; }

    /// @notice initalizes contract with contract owner
    /// @dev msg.sender is set as an owner
    constructor() public {
        owner = msg.sender;
    }

    /// @notice admin can stop the contract in emergency
    /// @dev only admin can invoke this function, and it simoply change state to opposit one
    function toggleContractState() external onlyOwner {
        stopped = !stopped;
        emit StateChanged(msg.sender, now, stopped);
    }

    /// @notice adds file to the registry assigning it to invoker address
    /// @dev this method is only a proxy to the logic stored in addFile function
    /// @param dateAdded date and time of addition in unix timestamp
    /// @param filehash hash of the file using soliditysha3
    /// @param tags bytes representation of tags assigned to the file
    /// @param ipfshash ipfs hash which is an address to the file in the system
    function addMyFile(uint256 dateAdded, bytes32 filehash, bytes32 tags, bytes calldata ipfshash) external {
        addFile(msg.sender, dateAdded, filehash, tags, ipfshash);
    }

    /// @notice gets the file of the requester based on the id
    /// @dev it is a proxy to the logic stored in getUserFileById
    /// @param id id of the file which is key in the mapping
    /// @return all the data stored for file in FileInfo structure, and it is date of addition,
    /// hash of the file, tags, and ipfs address
    function getMyFileById(uint256 id) external view returns(uint256, bytes32, bytes32, bytes memory) {
        return getUserFileById(msg.sender, id);
    }

    /// @notice gets count of all the files stored with the requester address
    /// @dev it is a proxy to the logic stored in getCountOfFiles
    /// @return amount of files as uint
    function getCountOfMyfiles() external view returns(uint256) {
        return getCountOfFiles(msg.sender);
    }

    /// @notice adds file to the registry assigning it to the specified address
    /// @dev adds file to two structures one file based and second user based
    /// @param userAddress specific address to which file should be assigned to
    /// @param dateAdded date and time of addition in unix timestamp
    /// @param fileHash hash of the file using soliditysha3
    /// @param tags bytes representation of tags assigned to the file
    /// @param ipfsHash ipfs hash which is an address to the file in the system
    function addFile(address userAddress, uint256 dateAdded, bytes32 fileHash,
        bytes32 tags, bytes memory ipfsHash) public isActive {
        require(userAddress != address(0x0), "User Address cannot be empty");
        require(ipfsHash.length != 0 && ipfsHash.length < 47, "IPFS address is not valid or empty");
        // require(ipfsHash.length < 47, "IPFS address is not valid"); //this is the length of ipfs address
        require(fileHash != "", "File hash cannot be empty");
        require(dateAdded > 0, "Date Added has to be greater than 0");
        require(fileDetails[fileHash].holder == address(0x0), "File hash exists in contract");

        FileInfo memory newFileInfo = FileInfo(userAddress, dateAdded, fileHash, tags, ipfsHash);
        users[userAddress].userFiles[users[userAddress].totalUserFiles] = newFileInfo;
        users[userAddress].totalUserFiles = users[userAddress].totalUserFiles.add(1);

        fileDetails[fileHash] = newFileInfo;

        emit FileAdded(userAddress, dateAdded, fileHash, tags, ipfsHash);
    }

    /// @notice gets count of all the files stored with the specific userAddress
    /// @dev reads value from mapping for a specific address
    /// @param userAddress specific address for whom we are checking values
    /// @return amount of files as uint
    function getCountOfFiles(address userAddress) public view returns (uint256) {
        return users[userAddress].totalUserFiles;
    }

    /// @notice gets the file of the user specific address based on the id
    /// @dev reads from users structure and userFiles structure
    /// @param userAddress user specific address for who checking will be performed
    /// @param id index of the file in the mapping for user specific address
    /// @return all the data stored for file in FileInfo structure, and it is date of addition,
    /// hash of the file, tags, and ipfs address
    function getUserFileById(address userAddress, uint256 id) public view
        returns (uint256, bytes32, bytes32, bytes memory) {
            return (users[userAddress].userFiles[id].dateAdded,
            users[userAddress].userFiles[id].fileHash,
            users[userAddress].userFiles[id].tags,
            users[userAddress].userFiles[id].ipfsHash
        );
        }
}
