//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Owned <<< - Test file
//
//Last update: 05.11.2020

const Owned = artifacts.require('Owned');
const truffleAssert = require('truffle-assertions');

contract("Owned", (accounts) => {

    //Prerequirement
    it("should be minimum five accounts available", function(){
        assert.isAtLeast(accounts.length, 5, "should have at least 5 accounts");
    });

    //Initialise
    let instance = null;
    const [owner, sender, attacker] = accounts;

    beforeEach(async () => {
        instance = await Owned.new({from: owner});
    });

    it("should be owned by owner", async () => {
        let _owner = await instance.getOwner({from: sender});
        assert.strictEqual(_owner, owner, "contract is not owned by owner");
    });

    it("should not be possible to change the owner by an attacker", async () => {
        await truffleAssert.reverts(
            instance.changeOwner(attacker, {from: attacker}),
            "Owned: Caller is not the owner"
        );

        let _oldOwner = await instance.getOwner({from: attacker});
        assert.strictEqual(_oldOwner, owner, "contract is not owned by the new owner");
    });

    it("should possible to change the owner", async () => {
        let returned = await instance.changeOwner.call(sender, {from: owner});
        assert.strictEqual(returned, true, "contract is not owned by the new owner");

        let txObj = await instance.changeOwner(sender, {from: owner});
        truffleAssert.eventEmitted(txObj, 'LogOwnerChanged');

        let _newOwner = await instance.getOwner({from: owner});
        assert.strictEqual(_newOwner, sender, "contract is not owned by the new owner");
    });

});