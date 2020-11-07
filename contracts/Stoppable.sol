// SPDX-License-Identifier: Unlicense

//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Stoppable <<<
//
//Last update: 07.11.2020

pragma solidity 0.6.12;

import "./Owned.sol";

/**
 * @title Stoppable
 *  Pause and resume contracts
 */
contract Stoppable is Owned{
    //Variable declaration
    enum State{
        paused,
        running,
        destroyed
    }
    State private state;

    //Event
    event LogStoppable(address indexed sender, State state);

    //Modifier
    modifier onlyIfRunning{
        require(state == State.running, "Stoppable: Contract is not running");
        _;
    }

    modifier onlyIfPaused{
        require(state == State.paused, "Stoppable: Contract is not paused");
        _;
    }

    //Initial function
    constructor(State initialState) public{
        require(uint8(initialState) <= 1, "Stoppable: Initial contract state can be 0 (paused) or 1 (running)");
        state = initialState;
    }

    //Pause contract: No more interactions
    function pauseContract() public onlyOwner onlyIfRunning returns(bool success){
        state = State.paused;

        emit LogStoppable(msg.sender, state);
        return true;
    }

    //Resume contract: All interactions are allowed again
    function resumeContract() public onlyOwner onlyIfPaused returns(bool success){
        state = State.running;

        emit LogStoppable(msg.sender, state);
        return true;
    }

    //Kill switch for the whole contract, only if contract was deactivated at first
    function destroyContract() public onlyOwner onlyIfPaused returns(bool success){
        state = State.destroyed;

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    //Retrieve contract state
    function getState() public view returns(State contractState){
        return state;
    }
}