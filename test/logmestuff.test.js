//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> LogMeStuff <<< - Test file
//
//Last update: 14.11.2020

const LogMeStuff = artifacts.require('LogMeStuff');
const truffleAssert = require('truffle-assertions');

contract("LogMeStuff", (accounts) => {

    let instance = null;
    const [owner, sender, recipient1, recipient2] = accounts;

    beforeEach(async () => {
        instance = await LogMeStuff.new({from: owner});
    });

    it("should be the correct order of events for invokeSplit()", async () => {
        const evenAmountToSplit = 1000;

        const txObj = await instance.invokeSplit(recipient1, recipient2, {from: sender, value: evenAmountToSplit});
        truffleAssert.eventEmitted(txObj, 'LogSplitInvoked');

        rawLogs0 = txObj.receipt.rawLogs[0];
        rawLogs1 = txObj.receipt.rawLogs[1];

        //same result with
        //const txReceipt = await web3.eth.getTransactionReceipt(txObj.tx);
        //console.log("txReceipt.logs: ", txReceipt.logs[0]);

        //same transaction
        assert.strictEqual(rawLogs0.transactionHash, rawLogs1.transactionHash, "transactionHash is not equal");

        //order of logs
        assert.strictEqual(rawLogs0.logIndex, 0, "logIndex is not correct");
        assert.strictEqual(rawLogs1.logIndex, 1, "logIndex is not correct");

        assert.operator(rawLogs0.logIndex, '<', rawLogs1.logIndex, "logs are not in the correct order");

        //canonical signature
        const log0CanonicalSignature = rawLogs0.topics[0];
        const createCanonicalSignature0 = web3.utils.soliditySha3('LogSplitInvoked(address,uint256)');
        const log1CanonicalSignature = rawLogs1.topics[0];
        const createCanonicalSignature1 = web3.utils.soliditySha3('LogSplit(address,address,address,uint256)');

        assert.strictEqual(log0CanonicalSignature, createCanonicalSignature0, "canonical signature of log0 is not correct");
        assert.strictEqual(log1CanonicalSignature, createCanonicalSignature1, "canonical signature of log1 is not correct");
    });

    it("should be the correct order of events for invokeWithdraw()", async () => {
        const evenAmountToSplit = 1000;

        await instance.invokeSplit(instance.address, recipient2, {from: sender, value: evenAmountToSplit});
        const txObj = await instance.invokeWithdraw({from: recipient1});
        truffleAssert.eventEmitted(txObj, 'LogWithdrawInvoked');

        rawLogs0 = txObj.receipt.rawLogs[0];
        rawLogs1 = txObj.receipt.rawLogs[1];
        rawLogs2 = txObj.receipt.rawLogs[2];

        //same transaction
        assert.strictEqual(rawLogs0.transactionHash, rawLogs1.transactionHash, "transactionHash is not equal");
        assert.strictEqual(rawLogs0.transactionHash, rawLogs2.transactionHash, "transactionHash is not equal");

        //order of logs
        assert.strictEqual(rawLogs0.logIndex, 0, "logIndex is not correct");
        assert.strictEqual(rawLogs1.logIndex, 1, "logIndex is not correct");
        assert.strictEqual(rawLogs2.logIndex, 2, "logIndex is not correct");

        assert.operator(rawLogs0.logIndex, '<', rawLogs1.logIndex, "logs are not in the correct order");
        assert.operator(rawLogs1.logIndex, '<', rawLogs2.logIndex, "logs are not in the correct order");

        //canonical signature
        const log0CanonicalSignature = rawLogs0.topics[0];
        const createCanonicalSignature0 = web3.utils.soliditySha3('LogWithdrawInvoked(address)');
        const log1CanonicalSignature = rawLogs1.topics[0];
        const createCanonicalSignature1 = web3.utils.soliditySha3('LogWithdraw(address,uint256)');
        const log2CanonicalSignature = rawLogs2.topics[0];
        const createCanonicalSignature2 = web3.utils.soliditySha3('LogFundsReceived(address,uint256)');

        assert.strictEqual(log0CanonicalSignature, createCanonicalSignature0, "canonical signature of log0 is not correct");
        assert.strictEqual(log1CanonicalSignature, createCanonicalSignature1, "canonical signature of log1 is not correct");
        assert.strictEqual(log2CanonicalSignature, createCanonicalSignature2, "canonical signature of log2 is not correct");
    });
});