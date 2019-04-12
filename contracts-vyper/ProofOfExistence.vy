# File Info structure
struct FileInfo:
    # address of an owner
    holder: address
    # unix timestamp when file has been added or owned
    dateAdded: timestamp
    # file hash
    fileHash: bytes32
    # tags assigned to the file
    tags: bytes32
    # ipfs address where file is stored
    ipfsHash: bytes[64]

# User Info structure
struct UserInfo:
    # total amount of user files
    totalUserFiles: uint256
    # user files
    userFiles: map(uint256, FileInfo)

# Events
StateChanged: event({_who: address, _when: timestamp, _state: bool})
FileAdded: event({_owner: address, _dateAdded: timestamp, _fileHash: bytes32, _tags: bytes32, _ipfsHash: bytes[64]})
OwnerShipTransferred: event({_owner: address, _newOwner: address})

# Contract parameters
# owner of
owner: public(address)
stopped: public(bool)
users: public(map(address, UserInfo))
fileDetails: public(map(bytes32, FileInfo))


@public
def __init__():
    """
    @author Łukasz Korba
    @notice initializes contract
    @dev msg sender becomes an owner
    """
    self.owner = msg.sender

@public
def toggleContractState():
    """
    @notice toggles state of the contract in case of emergency - circuit breaker
    @dev only owner can change the state
    """
    assert msg.sender == self.owner
    self.stopped = not self.stopped
    log.StateChanged(msg.sender, block.timestamp ,self.stopped)

@public
def transferOwnership(newOwner: address):
    """
    @notice transfers ownership of the contract to the new owner
    @dev only owner can execute this function
    """
    assert msg.sender == self.owner
    assert newOwner != ZERO_ADDRESS
    log.OwnerShipTransferred(self.owner, newOwner)
    self.owner = newOwner

@public
def addFile(userAddress: address, dateAdded: timestamp, fileHash: bytes32, tags: bytes32, ipfsHash: bytes[64]):
    """
    @notice adds file to the registry assigning it to the provided userAddress
    @dev file can be added only when contract is not stopped, two structures are updated
    @param userAddress specific address to which file should be assigned to
    @param dateAdded date and time of addition in unix timestamp
    @param filehash hash of the file using soliditysha3
    @param tags bytes representation of tags assigned to the file
    @param ipfshash ipfs hash which is an address to the file in the system
    """
    assert self.stopped != True
    assert userAddress != ZERO_ADDRESS
    assert len(ipfsHash) != 0 and len(ipfsHash) < 47
    assert fileHash != EMPTY_BYTES32
    assert dateAdded > 0
    assert self.fileDetails[fileHash].holder == ZERO_ADDRESS

    self.users[userAddress].userFiles[self.users[userAddress].totalUserFiles] = FileInfo({holder: userAddress, dateAdded: dateAdded, fileHash: fileHash, tags: tags, ipfsHash: ipfsHash})
    self.users[userAddress].totalUserFiles = self.users[userAddress].totalUserFiles + 1

    self.fileDetails[fileHash] = FileInfo({holder: userAddress, dateAdded: dateAdded, fileHash: fileHash, tags: tags, ipfsHash: ipfsHash})

    log.FileAdded(userAddress, dateAdded, fileHash, tags, ipfsHash)

@public
def addMyFile(dateAdded: timestamp, fileHash: bytes32, tags: bytes32, ipfsHash: bytes[64]):
    """
    @notice adds file to the registry assigning it to the message sender
    @dev its only proxy to the addFile function
    @param dateAdded date and time of addition in unix timestamp
    @param filehash hash of the file using soliditysha3
    @param tags bytes representation of tags assigned to the file
    @param ipfshash ipfs hash which is an address to the file in the system
    """
    self.addFile(msg.sender, dateAdded, fileHash, tags, ipfsHash)

@public
@constant
def getCountOfFiles(userAddress: address) -> uint256:
    """
    @notice gets the count of files assigned to the user specific address
    @dev gets the information from the users mapping
    @param userAddress specific address for which function will perform check
    @return amount of the files stored for specific address
    """
    return self.users[userAddress].totalUserFiles

@public
@constant
def getUserFileById(userAddress: address, id: uint256) -> (timestamp, bytes32, bytes32, bytes[64]):
    """
    @notice gets the users' file details by id
    @dev gets the information from the users mapping
    @param userAddress specific address for which function will perform check
    @param id index of a file
    @return all the data stored for file in FileInfo structure, and it is date of addition, hash of the file, tags, and ipfs address
    """
    return (self.users[userAddress].userFiles[id].dateAdded, self.users[userAddress].userFiles[id].fileHash, self.users[userAddress].userFiles[id].tags, self.users[userAddress].userFiles[id].ipfsHash)

@public
@constant
def getMyFileById(id: uint256) -> (timestamp, bytes32, bytes32, bytes[64]):
    """
    @notice Gets the sender file details by id
    @dev its only a proxy function to the logic written in getUserFileById
    @param id index of a file
    @return all the data stored for file in FileInfo structure, and it is date of addition, hash of the file, tags, and ipfs address
    """
    return self.getUserFileById(msg.sender, id)

@public
@constant
def getCountOfMyFiles() -> uint256:
    """
    @notice gets the count of files assigned to the sender address
    @dev gets the information from the users mapping
    @return amount of the files stored for sender address
    """
    return self.getCountOfFiles(msg.sender)
