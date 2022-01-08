// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
// pragma experimental ABIEncoderV2;

// Allows anyone to claim a token if they exist in a merkle root.
interface IAirdropSender{
    // Returns the address of the token distributed by this contract.
    function token() external view returns (address);

    // Returns the merkle root of the merkle tree containing account balances available to claim.
    function merkleRoot() external view returns (bytes32);

    // Returns true if the index has been marked claimed.
    // function isClaimed(uint256 index) external view returns (bool);

    // This event is triggered whenever a call to #send succeeds.
    event AirdropSent(uint256 index, address account, uint256 amount);

    // This event is triggered whenever a call to #sendToMany succeeds.
    event AirdropSentToMany(address[]  accounts, uint256[]  amounts);

    event MerkleChanged(bytes32 newMerkle);
}