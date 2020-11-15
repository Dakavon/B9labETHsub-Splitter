import React, { useState, useEffect } from "react";
import { Container, Button, Alert } from 'react-bootstrap';
import Navbar from './../Navbar/Navbar';
import getWeb3 from './getWeb3';
import './App.css';

//Ethereum contract JSON (abi, deployed networks, ...)
import SplitterContract from './../../contracts/Splitter.json';

const appTitle = "Splitter";

export default function App() {
  const [web3, setWeb3]         = useState(undefined);
  const [account, setAccount]   = useState([]);
  const [Splitter, setSplitter] = useState();
  const [contractInfo, setContractInfo] = useState({
    networkID: undefined,
    contractTransactionHash: undefined,
    contractAddress: undefined,
    contractDeployer: undefined,
    contractDeployedBlock: 0,
  });
  const [appVariables, setAppVariables] = useState({
    initError: false,
    gotPastEvents: false,
    eventListener: false,
    inputs: {
      addressBalance: "",
      recipient1: "",
      recipient2: "",
      amount: "",
    }
  });
  const [contractVariables, setContractVariables] = useState({
    owner: undefined,
    state: undefined,
    addressBalance: "",
  });

  //Initialise web3
  useEffect(() => {
    const init = async() => {
      try{
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkID = await web3.eth.net.getId();
        const contractNetwork = SplitterContract.networks[networkID];
        const instance = new web3.eth.Contract(
          SplitterContract.abi,
          contractNetwork && contractNetwork.address,
        );

        //Gather information from network
        const contractReceipt = await web3.eth.getTransactionReceipt(contractNetwork.transactionHash);

        // Set web3, accounts, and contract to the state
        setWeb3(web3);
        setAccount(accounts[0]);
        setSplitter(instance);

        setContractInfo({// ...contractInfo,
          networkID: networkID,
          contractTransactionHash: contractNetwork.transactionHash,
          contractAddress: contractReceipt.contractAddress,
          contractDeployer: contractReceipt.from,
        });

      }
      catch(error){
        // Catch any errors for any of the above operations.
        console.error(error);
        setAppVariables({ initError: true });
      };
    };

    init();
  }, []);


  //Owned
  async function getOwner(){
    const splitterOwner = await Splitter.methods.getOwner().call({from: account});
    setContractVariables(_contractVariables => ({
      ..._contractVariables,
      owner: splitterOwner,
    }));
    console.log("owner: ", splitterOwner);
  }

  //Stoppable
  async function getState(){
    let splitterStateString;
    const splitterState = await Splitter.methods.getState().call();
    switch(splitterState){
      case "0": splitterStateString = "paused"; break;
      case "1": splitterStateString = "running"; break;
      case "2": splitterStateString = "destroyed"; break;
      default: splitterStateString = "";
    }
    setContractVariables(_contractVariables => ({
      ..._contractVariables,
      state: splitterStateString,
    }));
    console.log("state: ", splitterStateString);
  }

  async function pauseContract(){
    try{
      await Splitter.methods.pauseContract()
      .send({
        from: account
      })
      .on('transactionHash', (hash) => {
        console.log("transactionHash: ", hash);
      })
      .on('error', (error, receipt) => {
        console.log("receipt: ", receipt);
        console.log("error message: ", error);
      });
      console.log("contract is now paused")
    }
    catch(error){
      console.error(error);
    };
  }

  async function resumeContract(){
    try{
      await Splitter.methods.resumeContract()
      .send({
        from: account
      })
      .on('transactionHash', (hash) => {
        console.log("transactionHash: ", hash);
      })
      .on('error', (error, receipt) => {
        console.log("r: ", receipt);
        console.log("error message: ", error);
      });
    }
    catch(error){
      console.error(error);
    };
  }

  async function destroyContract(){
    try{
      await Splitter.methods.destroyContract()
      .send({
        from: account
      })
      .on('transactionHash', (hash) => {
        console.log("transactionHash: ", hash);
      })
      .on('error', (error, receipt) => {
        console.log("receipt: ", receipt);
        console.log("error message: ", error);
      });
    }
    catch(error){
      console.error(error);
    };
  }

  // Splitter
  async function getBalance(addressToCheck){
    addressToCheck = addressToCheck.replace(/\s+/g, '');
    if(web3.utils.isAddress(addressToCheck)){
      const _addressBalance = await Splitter.methods.balances(addressToCheck).call();
      setContractVariables(_contractVariables => ({
        ..._contractVariables,
        addressBalance: _addressBalance,
      }));
      console.log("addressBalance: ", _addressBalance);
    }
    else{
      console.log("input is not an address");
    }
  }

  async function split(recipient1, recipient2, amount){
    recipient1 = recipient1.replace(/\s+/g, '');
    recipient2 = recipient2.replace(/\s+/g, '');

    if(web3.utils.isAddress(recipient1) && web3.utils.isAddress(recipient2)){
      try{
        await Splitter.methods.split(recipient1, recipient2)
        .send({
          from: account,
          value: amount.toString(10)
        })
        .on('transactionHash', (hash) => {
          console.log("transactionHash: ", hash);
        })
        .on('receipt', (receipt) => {
          console.log("receipt :", receipt);
        })
        .on('error', (error, receipt) => {
          console.log("receipt: ", receipt);
          console.log("error message: ", error);
        });
        console.log("amount was splitted");
      }
      catch(error){
        console.error(error);
      }
    }
    else if (web3.utils.isAddress(recipient1)){
      console.log("recipient1 is not an address");
    }
    else{
      console.log("recipient2 is not an address");
    }
  }

  async function withdraw(){
    try{
      await Splitter.methods.withdraw()
      .send({
        from: account
      })
      .on('transactionHash', (hash) => {
        console.log("transactionHash: ", hash);
      })
      .on('receipt', (receipt) => {
        console.log("receipt :", receipt);
      })
      .on('error', (error, receipt) => {
        console.log("receipt: ", receipt);
        console.log("error message: ", error);
      });
      console.log("amount was withdrawn");
    }
    catch(error){
      console.error(error);
    }
  }

  if(typeof web3 === 'undefined'){
    return(
      <div className="wrapper">
        Loading Web3, accounts, and contract...
      </div>
    )
  }
  else{
    return(
    <div className="page">
      <Navbar title={appTitle} wallet={account.toString()} network={contractInfo.networkID} />
      <div className="errorMessage">{appVariables.error === true && "Failed to load web3, accounts, or contract."}</div>

      <Container><div className="wrapper">
        <div className="contract">
          <Alert variant="primary">
            <Alert.Heading>Contract info</Alert.Heading>
            Transaction hash: {contractInfo.contractTransactionHash}<br/>
            Contract address: {contractInfo.contractAddress}<br/>
            Contract deployer: {contractInfo.contractDeployer}
            <hr />
            <Alert.Heading>Owned</Alert.Heading>
            <div className="functions">
              <Button variant="light" size="sm" onClick={() => getOwner()}>Call getOwner()</Button>{' '}{contractVariables.owner !== 'undefined' && contractVariables.owner}<br/>
              {/* <Button variant="light" size="sm" onClick={() => getOwner()}>Call getOwner()</Button>{' '}{contractVariables.owner !== 'undefined' && contractVariables.owner} */}
            </div>
            <hr />
            <Alert.Heading>Stoppable</Alert.Heading>
            <div className="functions">
              <Button variant="light" size="sm" onClick={() => getState()}>Call getState()</Button>{' '}{contractVariables.state !== 'undefined' && contractVariables.state}<br/>
              <Button variant="info" size="sm" onClick={() => pauseContract()}>Invoke pauseContract()</Button>{' '}
              <Button variant="info" size="sm" onClick={() => resumeContract()}>Invoke resumeContract()</Button>{' '}
              <Button variant="danger" size="sm" onClick={() => destroyContract()}>Invoke destroyContract()</Button>
            </div>
          </Alert>

          <div className="functions">
            <form>
              <input
                type="text"
                placeholder="address"
                value={appVariables.inputs.addressBalance}
                onChange={event => setAppVariables({
                  ...appVariables,
                  inputs: {
                    ...appVariables.inputs,
                    addressBalance: event.target.value,
                  }
                })}
                required
              />
              <Button variant="dark" onClick={() => getBalance(appVariables.inputs.addressBalance)}>
                Check "balances"
              </Button>{' '}{contractVariables.addressBalance !== "" && appVariables.inputs.addressBalance + '  has  ' + contractVariables.addressBalance + '  Wei.'}
            </form>

            <form>
              <input
                type="text"
                placeholder="address recipient1"
                value={appVariables.inputs.recipient1}
                onChange={event => setAppVariables({
                  ...appVariables,
                  inputs: {
                    ...appVariables.inputs,
                    recipient1: event.target.value,
                  }
                })}
                required
              />
              <input
                type="text"
                placeholder="address recipient2"
                value={appVariables.inputs.recipient2}
                onChange={event => setAppVariables({
                  ...appVariables,
                  inputs: {
                    ...appVariables.inputs,
                    recipient2: event.target.value,
                  }
                })}
                required
              />
              <input
                type="text"
                placeholder="uint256 amount"
                value={appVariables.inputs.amount}
                onChange={event => setAppVariables({
                  ...appVariables,
                  inputs: {
                    ...appVariables.inputs,
                    amount: event.target.value,
                  }
                })}
                required
              />
              <Button
                variant="success"
                onClick={() => split(
                                appVariables.inputs.recipient1,
                                appVariables.inputs.recipient2,
                                appVariables.inputs.amount
                        )}>
                  Invoke split()
              </Button>
            </form>

            <Button variant="success" onClick={() => withdraw()}>Invoke withdraw()</Button>
          </div>

        </div>
      </div></Container>
    </div>
    )
  }
}