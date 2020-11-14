// SPDX-License-Identifier: Unlicense

//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> LogMeStuff <<<
//
//Last update: 14.11.2020

pragma solidity 0.6.12;

import "./Splitter.sol";

/**
 * @title LogMeStuff
 *  LogMeStuff as a CA in combination with the test file the correct order of events is checked
 */
contract LogMeStuff {
    Splitter public mySplitter;

    event LogFundsReceived(address indexed sender, uint amount);
    event LogSplitInvoked(address indexed sender, uint amount);
    event LogWithdrawInvoked(address indexed sender);

    constructor() public {
        mySplitter = new Splitter(Stoppable.State.running);
    }

    receive() external payable {
        emit LogFundsReceived(msg.sender, msg.value);
    }

    function invokeSplit(address A, address B) public payable returns(bool success){
        emit LogSplitInvoked(msg.sender, msg.value);
        success = mySplitter.split{value: msg.value}(A, B);
    }

    function invokeWithdraw() public returns(bool success){
        emit LogWithdrawInvoked(msg.sender);
        success = mySplitter.withdraw();
    }
}