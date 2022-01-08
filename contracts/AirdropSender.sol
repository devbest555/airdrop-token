// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "./interfaces/IAirdropSender.sol";

contract AirdropSender is Ownable, IAirdropSender {
    address public override token;
    bytes32 public override merkleRoot;

    mapping(uint256 => uint256) private claimedBitMap;

    constructor(address token_, bytes32 merkleRoot_) public {
        token = token_;
        merkleRoot = merkleRoot_;
    }

    function setTokenMerkleRoot(address token_, bytes32 merkleRoot_) onlyOwner() public {
        require(token_ != address(0), 'AirdropSender: Zero address.');
        token = token_;
        merkleRoot = merkleRoot_;

        emit MerkleChanged(merkleRoot);
    }

    // function isClaimed(uint256 index) public view override returns (bool) {
    //     uint256 claimedWordIndex = index / 256;
    //     uint256 claimedBitIndex = index % 256;
    //     uint256 claimedWord = claimedBitMap[claimedWordIndex];
    //     uint256 mask = (1 << claimedBitIndex);
    //     return claimedWord & mask == mask;
    // }

    // /// @dev set index of user claimed and add to claimedBitMap
    // function _setClaimed(uint256 index) private {
    //     uint256 claimedWordIndex = index / 256;
    //     uint256 claimedBitIndex = index % 256;
    //     claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    // }

    function verify(bytes32[] calldata _proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(msg.sender));
        return MerkleProof.verify(_proof, merkleRoot, leaf);
    } 

    /// @dev helper of send
    function _send(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) private {
        require(amount > 0, 'AirdropSender: Bad Amount.');
        // require(!isClaimed(index), 'AirdropSender: Drop already claimed.');

        bytes32 node = keccak256(abi.encodePacked(account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'AirdropSender: Invalid proof.');

        // _setClaimed(index);
        require(IERC20(token).transfer(account, amount), 'AirdropSender: Transfer failed.');

        emit AirdropSent(index, account, amount);
    }

    /// @dev helper of sendToMany
    function _sendToMany(address[] memory accounts, uint256[] memory amounts, bytes32[][] calldata merkleProofs) private {
        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount = totalAmount + amounts[i];
        }
        
        require(totalAmount <= IERC20(token).balanceOf(address(this)),
            "AirdropSender: total amount should not be greater than balance");

        for(uint256 i = 0; i < amounts.length; i++){
            if(amounts[i] > 0) {
                _send(i, accounts[i], amounts[i], merkleProofs[i]);
            }
        }
    }

    /// @notice send airdrop token to an user
    /// @param index uint
    /// @param account address 
    /// @param amount uint
    /// @param merkleProof bytes[]
    function send(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
    onlyOwner()
    public {
        _send(index, account, amount, merkleProof);
        emit AirdropSent(index, account, amount);
    }

    /// @notice send airdrop token to several users
    /// @param accounts address[]
    /// @param amounts uint[]
    /// @param merkleProofs bytes[][]
    function sendToMany(address[] memory accounts, uint256[] memory amounts, bytes32[][] calldata merkleProofs)
    onlyOwner()
    public {
        _sendToMany(accounts, amounts, merkleProofs);
        emit AirdropSentToMany(accounts, amounts);
    }
}
