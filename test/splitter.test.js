//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Splitter <<< - Test file
//
//Last update: 14.11.2020

const Splitter = artifacts.require('Splitter');
const truffleAssert = require('truffle-assertions');

contract("Splitter", (accounts) => {

    const toBN = web3.utils.toBN;

    let instance = null;
    const [owner, sender, recipient1, recipient2, attacker] = accounts;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const contractState = {
        paused: 0,
        running: 1,
        destroyed: 2,
    };

    before("should be five accounts available: ", async () => {
        console.log("\n    There are five accounts available:");
        for(let i=0; i<5; i++){
            console.log(`\t#${i}: ${accounts[i]}`);
        }
        console.log("\n");
    });

    beforeEach(async () => {
        instance = await Splitter.new(contractState.running, {from: owner});
    });

    it("should have the initial balance of zero", async () => {
        const contractBalance = await web3.eth.getBalance(instance.address);
        assert.strictEqual(contractBalance.toString(10), "0", "is anything but zero");
    });

    describe("function split()", async () => {
        const evenAmountToSplit = 1000;
        const oddAmountToSplit = 1001;


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
            const returned = await instance.split.call(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
            assert.strictEqual(returned, true, "it is not possible to split an even amount");

            const senderBalanceBefore = await web3.eth.getBalance(sender);

            const txObj = await instance.split(recipient1, recipient2, {from: sender, value: evenAmountToSplit});

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));
            const senderBalanceAfter = await web3.eth.getBalance(sender);

            assert.strictEqual(
                toBN(senderBalanceBefore).sub(toBN(evenAmountToSplit)).sub(toBN(txFee)).toString(10),
                senderBalanceAfter.toString(10),
                "senders balance is not correct after split()"
            );

            truffleAssert.eventEmitted(txObj, 'LogSplit');
            const logSender = txObj.receipt.logs[0].args.sender;
            const logRecipient1 = txObj.receipt.logs[0].args.recipient1;
            const logRecipient2 = txObj.receipt.logs[0].args.recipient2;
            const logAmount = txObj.receipt.logs[0].args.amount.toString(10);

            assert.strictEqual(logSender, sender, "sender was not logged correcly");
            assert.strictEqual(logRecipient1, recipient1, "recipient1 was not logged correcly");
            assert.strictEqual(logRecipient2, recipient2, "recipient2 was not logged correcly");
            assert.strictEqual(logAmount, evenAmountToSplit.toString(10), "amount was not logged correcly");

            const amountOfRecipeint1 = await instance.balances(recipient1);
            const amountOfRecipeint2 = await instance.balances(recipient2);
            const amountOfSender = await instance.balances(sender);

            assert.strictEqual(amountOfRecipeint1.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfRecipeint2.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfSender.toString(10), '0', "there should not be a remainder");
        });

        it("should be possible to split an odd amount", async () => {
            const returned = await instance.split.call(recipient1, recipient2, {from: sender, value: oddAmountToSplit});
            assert.strictEqual(returned, true, "it is not possible to split an odd amount");

            const senderBalanceBefore = await web3.eth.getBalance(sender);

            const txObj = await instance.split(recipient1, recipient2, {from: sender, value: oddAmountToSplit});

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));
            const senderBalanceAfter = await web3.eth.getBalance(sender);

            assert.strictEqual(
                toBN(senderBalanceBefore).sub(toBN(oddAmountToSplit)).sub(toBN(txFee)).toString(10),
                senderBalanceAfter.toString(10),
                "senders balance is not correct after split()"
            );

            const logAmount = txObj.receipt.logs[0].args.amount.toString(10);
            assert.strictEqual(logAmount, oddAmountToSplit.toString(10), "amount was not logged correctly");

            const amountOfRecipeint1 = await instance.balances(recipient1);
            const amountOfRecipeint2 = await instance.balances(recipient2);
            const amountOfSender = await instance.balances(sender);

            assert.strictEqual(amountOfRecipeint1.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfRecipeint2.toString(10), '500', "amount was not splitted correctly");
            assert.strictEqual(amountOfSender.toString(10), '1', "there should be remainder of '1'");
        });
    });


    describe("function withdraw()", async () => {
        const evenAmountToSplit = 1000;

        beforeEach(async () => {
            await instance.split(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
        });


        it("should have the initial balance of '1000'", async () => {
            const contractBalance = await web3.eth.getBalance(instance.address);
            assert.strictEqual(contractBalance.toString(10), evenAmountToSplit.toString(10), "is anything but zero");
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
            const amount = evenAmountToSplit/2;

            const returned = await instance.withdraw.call({from: recipient1});
            assert.strictEqual(returned, true, "it is not possible to withdraw funds");

            const amountOfRecipientBefore = await instance.balances(recipient1);
            assert.strictEqual(amountOfRecipientBefore.toString(10), amount.toString(10), "amount to withdraw is not correct")

            const recipientBalanceBefore = await web3.eth.getBalance(recipient1);

            const txObj = await instance.withdraw({from: recipient1});

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));
            const recipientBalanceAfter = await web3.eth.getBalance(recipient1);

            assert.strictEqual(
                toBN(recipientBalanceBefore).add(toBN(amount)).sub(toBN(txFee)).toString(10),
                recipientBalanceAfter.toString(10),
                "recipients balance is not correct after withdraw()"
            );

            truffleAssert.eventEmitted(txObj, 'LogWithdraw');
            const logRecipient = txObj.receipt.logs[0].args.recipient;
            const logAmount = txObj.receipt.logs[0].args.amount.toString(10);

            assert.strictEqual(logRecipient, recipient1, "recipient was not logged correcly");
            assert.strictEqual(logAmount, amount.toString(10), "amount was not logged correcly");

            const amountAfter = await instance.balances(recipient1);
            assert.strictEqual(amountAfter.toString(10), '0', "amount after invoking withdraw() is not correct");
        });

    });
});