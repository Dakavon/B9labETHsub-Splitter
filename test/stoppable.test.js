//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Stoppable <<< - Test file
//
//Last update: 05.11.2020

const Stoppable = artifacts.require('Stoppable');
const truffleAssert = require('truffle-assertions');

contract("Stoppable", (accounts) => {

    //Prerequirement
    it("should be minimum five accounts available", function(){
        assert.isAtLeast(accounts.length, 5, "should have at least 5 accounts");
    });

    //Initialise
    let instance = null;
    const [owner, sender, attacker] = accounts;

    beforeEach(async () => {
        instance = await Stoppable.new({from: owner});
    });

    it("should be pausable by owner", async () => {
        let returned = await instance.pauseContract.call({from: owner});
        assert.strictEqual(returned, true, "contract cannot be paused by owner");

        let txObj = await instance.pauseContract({from: owner});
        truffleAssert.eventEmitted(txObj, 'LogStoppable');

        let state = await instance.getState({from: sender});
        assert.strictEqual(state.toString(10), '0', "contract was not paused by owner");
    });

    it("should be resumeable by owner ", async () => {
        await instance.pauseContract({from: owner});

        let returned = await instance.resumeContract.call({from: owner});
        assert.strictEqual(returned, true, "contract cannot be resumed by owner");

        let txObj = await instance.resumeContract({from: owner});
        truffleAssert.eventEmitted(txObj, 'LogStoppable');

        let state = await instance.getState({from: sender});
        assert.strictEqual(state.toString(10), '1', "contract was not resumed by owner");
    });

    it("should only be destroyable by owner when paused", async () => {
        await instance.pauseContract({from: owner});

        let returned = await instance.destroyContract.call({from: owner});
        assert.strictEqual(returned, true, "contract cannot be destroyed by owner");

        await instance.destroyContract({from: owner});
        let state = await instance.getState({from: sender});
        assert.strictEqual(state.toString(10), '2', "contract was not set to destroyed");
    });

});