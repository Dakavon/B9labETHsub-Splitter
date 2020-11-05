// SPDX-License-Identifier: Unlicense

//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Splitter <<<
//
//Last update: 05.11.2020

pragma solidity 0.6.12;

import "./Stoppable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title Splitter
 *  Splitter is a contract where amounts sent to this contract are split between two recipients
 */
contract Splitter is Stoppable{
    using SafeMath for uint;

    mapping (address => uint) public balances;

    event LogSplit(address indexed sender, address indexed recipient1, address indexed recipient2, uint amount);
    event LogWithdraw(address indexed recipient, uint amount);

    /**
     * @dev Amount attached to the transaction are splitted between recipient1 and recipient2
     *      Any remaining amount remains with the sender
     *
     * @param recipient1 The address of the first recipient
     * @param recipient2 The address of the second recipient
     */
    function split(address recipient1, address recipient2) public payable onlyIfRunning returns(bool success){
        require(msg.value > 0, "Nothing to split");
        require(recipient1 != address(0x0), "Not allowed to transfer to 0x0");
        require(recipient2 != address(0x0), "Not allowed to transfer to 0x0");

        uint amount = msg.value.div(2);
        uint remainder = msg.value.mod(2);

        balances[recipient1] = balances[recipient1].add(amount);
        balances[recipient2] = balances[recipient2].add(amount);

        if(remainder > 0){
            balances[msg.sender] = balances[msg.sender].add(remainder);
        }

        emit LogSplit(msg.sender, recipient1, recipient2, msg.value);
        return true;
    }

    /**
     * @dev Recipients can withdraw their amount locked in the contract
     */
    function withdraw() public onlyIfRunning returns(bool success){
        require(balances[msg.sender] > 0, "No value to retrieve");

        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (bool transferSuccessful, ) = msg.sender.call{value: amount}("");
        require(transferSuccessful, "Transfer failed.");

        emit LogWithdraw(msg.sender, amount);
        return true;
    }
}