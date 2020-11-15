import React, { useState, useEffect } from "react";
import { Container, Button, Alert, Accordion, Card } from 'react-bootstrap';
import Navbar from '../Navbar/Navbar';
import getWeb3 from './getWeb3';
import './App.css';

//Ethereum contract JSON (abi, deployed networks, ...)
//import NostradamusContract from '../../contracts/Nostradamus.json';
import TheProphecyContract from '../../contracts/TheProphecy.json';

const appTitle = "Nostradamus";

export default function App() {
  const [web3, setWeb3]         = useState(undefined);
  const [account, setAccount]   = useState([]);
  //const [Nostradamus, setNostradamus] = useState();
  const [TheProphecy, setTheProphecy] = useState();
  const [contractInfo, setContractInfo] = useState({
    networkID: undefined,
    // contractTransactionHash: undefined,
    // contractAddress: undefined,
    // contractDeployer: undefined,
    attackerTransactionHash: undefined,
    attackerAddress: undefined,
    attackerDeployer: undefined,
    attackerDeployedBlock: 0,
  });
  // const [propheciseFields, setPropheciseFields] = useState({
  //   exact: "",
  //   braggingRights: "",
  // });
  const [aFewWords, setAFewWords] = useState("");
  const [eventLogs, setEventLogs] = useState([]);
  const [appVariables, setAppVariables] = useState({
    initError: false,
    gotPastEvents: false,
    eventListener: false,
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
        // const contractNetwork = NostradamusContract.networks[networkID];
        const attackerNetwork = TheProphecyContract.networks[networkID];
        // const NostradamusInstance = new web3.eth.Contract(
        //   NostradamusContract.abi,
        //   contractNetwork && contractNetwork.address,
        // );
        const TheProphecyInstance = new web3.eth.Contract(
          TheProphecyContract.abi,
          attackerNetwork && attackerNetwork.address,
        );

        //Gather information from network
        // const contractReceipt = await web3.eth.getTransactionReceipt(contractNetwork.transactionHash);
        const attackerReceipt = await web3.eth.getTransactionReceipt(attackerNetwork.transactionHash);

        // Set web3, accounts, and contract to the state
        setWeb3(web3);
        setAccount(accounts[0]);
        // setNostradamus(NostradamusInstance);
        setTheProphecy(TheProphecyInstance);

        setContractInfo({// ...contractInfo,
          networkID: networkID,
          // contractTransactionHash: contractNetwork.transactionHash,
          // contractAddress: contractReceipt.contractAddress,
          // contractDeployer: contractReceipt.from,
          attackerTransactionHash: attackerNetwork.transactionHash,
          attackerAddress: attackerReceipt.contractAddress,
          attackerDeployer: attackerReceipt.from,
          attackerDeployedBlock: attackerReceipt.blockNumber,
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


  //Collect all past events
  useEffect(() => {
    console.log("useEffect collectEvents");

    const collectPastEvents = async() => {
      if(TheProphecy !== undefined
          && contractInfo.attackerDeployedBlock !== 0
          && appVariables.gotPastEvents === false){

        const pastEventsArray = await TheProphecy.getPastEvents(
          'LogProphesy',
          {
            // filter: {
            //   value: [],
            //   date:
            // }
            fromBlock: contractInfo.attackerDeployedBlock,
            //toBlock: "latest"
          }
        );

        setEventLogs(pastEventsArray);
        console.log("ENDE --> useEffect collectPastEvents.");

        setAppVariables(_oldVariables => ({
          ..._oldVariables,
          gotPastEvents: true
        }));
      }
    }

    collectPastEvents();

  }, [TheProphecy, contractInfo.attackerDeployedBlock, appVariables.gotPastEvents]);

  //Watch out for new events
  useEffect(() => {
    console.log("useEffect addNewEvents.");

    const addNewEvents = async () => {
      if(appVariables.gotPastEvents === true
        && appVariables.eventListener === false){
        console.log("START --> useEffect addNewEvents.");
        await TheProphecy.events.LogProphesy({})
        .on('data', newEvent => {

          setEventLogs(_eventLogs => ([
            ..._eventLogs,
            newEvent
          ]));

          setAppVariables(_appVariables => ({
            ..._appVariables,
            eventListener: true,
          }));
        });
      }
    }

    addNewEvents();
  }, [TheProphecy, appVariables.gotPastEvents, appVariables.eventListener]);


  //Nostradamus
  // async function getInfo(){
  //   const result = await Nostradamus.methods.prophets(contractInfo.attackerAddress).call();
  //   console.log(result);
  // }

  // async function theWord(){
  //   const hash = await Nostradamus.methods.theWord().call({from: account});
  //   console.log(hash);
  // }

  // async function prophecise(exact, braggingRights){
  //   Nostradamus.methods.prophecise(exact, web3.utils.asciiToHex(braggingRights))
  //   .send({
  //     from: account
  //   })
  //     .then(receipt => {
  //       console.log(receipt);
  //     })
  //     .catch(error => {
  //       console.log(error);
  //     });
  // }

  //TheProphecy
  async function getAddress(){
    const nostradamusAddr = await TheProphecy.methods.nostradamusAddress().call();
    console.log(nostradamusAddr);
  }

  async function predictCorrectWord(){
    const correctWord = await TheProphecy.methods.predictCorrectWord().call();
    console.log(correctWord);
  }

  async function prophesy(words){
    TheProphecy.methods.prophesy(words)
    .send({
      from: account
    })
    .on('transactionHash', (hash) => {
      console.log("transactionHash: ", hash);
    })
    .on('receipt', (receipt) => {
      console.log("Receipt :", receipt);
    })
    // .on('confirmation', (confirmationNumber, receipt) => {
    //   console.log("Receipt: ", receipt);
    //   console.log("Confirmation: ", confirmationNumber);
    // })
    .on('error', (error, receipt) => {
      console.log("Receipt: ", receipt);
      console.log("Error message: ", error);
    });
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
        {/*
        <div className="contractInfo">
          <Alert variant="primary">
            <Alert.Heading>Contract info (Nostradamus)</Alert.Heading>
            Transaction hash: {contractInfo.contractTransactionHash}<br/>
            Contract address: {contractInfo.contractAddress}<br/>
            Contract deployer: {contractInfo.contractDeployer}
          </Alert>

          <div className="functions">
            <Button variant="info" onClick={() => getInfo()}>Variable "prophets"</Button>{' '}
            <Button variant="warning" onClick={() => theWord()}>Call "theWord()"</Button>
          </div>

          <div className="functions">
            <form>
              <input
                type="text"
                placeholder="bytes32 exact"
                value={propheciseFields.exact}
                onChange={event => setPropheciseFields({ ...propheciseFields, exact: event.target.value})}
                required
              />
              <input
                type="text"
                placeholder="bytes32 braggingRights"
                value={propheciseFields.braggingRights}
                onChange={event => setPropheciseFields({ ...propheciseFields, braggingRights: event.target.value})}
                required
              />{' '}
              <Button variant="danger" onClick={() => prophecise(propheciseFields.exact, propheciseFields.braggingRights)}>Invoke "prophecise()"</Button>{' '}
            </form>
          </div>
        </div>
        */}

        <div className="functions">
          <Alert variant="secondary">
            <Alert.Heading>Contract info (TheProphecy)</Alert.Heading>
            Transaction hash: {contractInfo.attackerTransactionHash}<br/>
            Contract address: {contractInfo.attackerAddress}<br/>
            Contract deployer: {contractInfo.attackerDeployer}
          </Alert>
          <div className="functions">
            <Button variant="info" onClick={() => getAddress()}>Variable "nostradamusAddress"</Button>{' '}
            <Button variant="warning" onClick={() => predictCorrectWord()}>Call "predictCorrectWord()"</Button>
          </div>
          <div className="functions">
            <form>
              <input
                type="text"
                placeholder="string memory aFewWords"
                value={aFewWords}
                onChange={event => setAFewWords(event.target.value)}
              />{' '}
              <Button variant="danger" onClick={() => prophesy(aFewWords)}>Invoke "prophesy()"</Button>
            </form>
          </div>
        </div>

        <div className="logs">
          <h6>Past events:</h6>
          <Accordion defaultActiveKey="0">
            {eventLogs.map(thisEvent => (
              <Card key={thisEvent.id}>
                <Accordion.Toggle as={Card.Header} eventKey={thisEvent.id}>
                  Block #{thisEvent.blockNumber}
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={thisEvent.id}>
                  <Card.Body>
                    <b>blockHash:</b> {thisEvent.blockHash}<br/>
                    <b>prophet:</b> {thisEvent.returnValues.prophet}<br/>
                    <b>braggingRights:</b> {web3.utils.hexToAscii(thisEvent.returnValues.braggingRights)}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            ))}
          </Accordion>
        </div>
      </div></Container>
    </div>
    )
  }
}