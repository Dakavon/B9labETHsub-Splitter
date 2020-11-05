//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Splitter <<< - Test file
//
//Last update: 05.11.2020

const Splitter = artifacts.require('Splitter');
const truffleAssert = require('truffle-assertions');

contract("Splitter", (accounts) => {

    //Prerequirement
    it("should be minimum five accounts available", function(){
        assert.isAtLeast(accounts.length, 5, "should have at least 5 accounts");
    });

    //Initialise
    let instance = null;
    const [owner, sender, recipient1, recipient2, attacker] = accounts;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    beforeEach(async () => {
        instance = await Splitter.new({from: owner});
    });


    it("should have the initial balance of zero", async () => {
        let contractBalance = await web3.eth.getBalance(instance.address);
        assert.strictEqual(contractBalance.toString(10), "0", "is anything but zero");
    });

    describe("function split()", async () => {
        let evenAmountToSplit = 1000;
        let oddAmountToSplit = 1001;


        it("should not be invokable if contract is paused", async () => {
            await instance.pauseContract({from: owner});

            truffleAssert.reverts(
                instance.split(recipient1, recipient2, {from: sender, value: evenAmountToSplit}),
                "Stoppable: Contract is not running"
            );
        });

        it("should not be possible to split without msg.value", async () => {
            truffleAssert.reverts(
                instance.split(recipient1, recipient2, {from: sender, value: 0}),
                "Nothing to split"
            );
        });

        it("should not be allowed to transfer to 0x0", async () => {
            truffleAssert.reverts(
                instance.split(zeroAddress, recipient2, {from: sender, value: evenAmountToSplit}),
                "Not allowed to transfer to 0x0"
            );

            truffleAssert.reverts(
                instance.split(recipient1, zeroAddress, {from: sender, value: evenAmountToSplit}),
                "Not allowed to transfer to 0x0"
            );
        });

        it("should be possible to split an even amount", async () => {
            let returned = await instance.split.call(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
            assert.strictEqual(returned, true, "it is not possible to split an even amount");

            let txObj = await instance.split(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
            truffleAssert.eventEmitted(txObj, 'LogSplit');

            let logSender = txObj.receipt.logs[0].args.sender;
            let logRecipient1 = txObj.receipt.logs[0].args.recipient1;
            let logRecipient2 = txObj.receipt.logs[0].args.recipient2;
            let logAmount = txObj.receipt.logs[0].args.amount.toString(10);

            assert.strictEqual(logSender, sender, "sender was not logged correcly");
            assert.strictEqual(logRecipient1, recipient1, "recipient1 was not logged correcly");
            assert.strictEqual(logRecipient2, recipient2, "recipient2 was not logged correcly");
            assert.strictEqual(logAmount, evenAmountToSplit.toString(10), "amount was not logged correcly");

            let amountOfRecipeint1 = await instance.balances(recipient1);
            let amountOfRecipeint2 = await instance.balances(recipient2);
            let amountOfSender = await instance.balances(sender);

            assert.strictEqual(amountOfRecipeint1.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfRecipeint2.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfSender.toString(10), '0', "there should not be a remainder");
        });

        it("should be possible to split an odd amount", async () => {
            let returned = await instance.split.call(recipient1, recipient2, {from: sender, value: oddAmountToSplit});
            assert.strictEqual(returned, true, "it is not possible to split an odd amount");

            let txObj = await instance.split(recipient1, recipient2, {from: sender, value: oddAmountToSplit});
            let logAmount = txObj.receipt.logs[0].args.amount.toString(10);

            assert.strictEqual(logAmount, oddAmountToSplit.toString(10), "amount was not logged correctly");

            let amountOfRecipeint1 = await instance.balances(recipient1);
            let amountOfRecipeint2 = await instance.balances(recipient2);
            let amountOfSender = await instance.balances(sender);

            assert.strictEqual(amountOfRecipeint1.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfRecipeint2.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfSender.toString(10), '1', "there should be remainder of '1'");
        });
    });


    describe("function withdraw()", async () => {
        let evenAmountToSplit = 1000;
        let oddAmountToSplit = 1001;

        beforeEach(async () => {
            await instance.split(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
        });


        it("should have the initial balance of '1000'", async () => {
            let contractBalance = await web3.eth.getBalance(instance.address);
            assert.strictEqual(contractBalance.toString(10), "1000", "is anything but zero");
        });

        it("should not be possible to withdraw when contract is paused", async () => {
            await instance.pauseContract({from: owner});

            truffleAssert.reverts(
                instance.withdraw({from: recipient1}),
                "Stoppable: Contract is not running"
            );
        });

        it("should not be possible to withdraw funds which do not belong", async () => {
            truffleAssert.reverts(
                instance.withdraw({from: attacker}),
                "No value to retrieve"
            );
        });

        it("should be possible to withdraw funds", async () => {
            let returned = await instance.withdraw.call({from: recipient1});
            assert.strictEqual(returned, true, "it is not possible to withdraw funds");

            let amountBefore = await instance.balances(recipient1);
            assert.strictEqual(amountBefore.toString(10), '500', "amount to withdraw is not correct")

            let txObj = await instance.withdraw({from: recipient1});
            truffleAssert.eventEmitted(txObj, 'LogWithdraw');

            let logRecipient = txObj.receipt.logs[0].args.recipient;
            let logAmount = txObj.receipt.logs[0].args.amount.toString(10);
            assert.strictEqual(logRecipient, recipient1, "recipient was not logged correcly");
            assert.strictEqual(logAmount, (evenAmountToSplit/2).toString(10), "amount was not logged correcly");

            let amountAfter = await instance.balances(recipient1);
            assert.strictEqual(amountAfter.toString(10), '0', "amount after invoking withdraw() is not correct");
        });

    });
});