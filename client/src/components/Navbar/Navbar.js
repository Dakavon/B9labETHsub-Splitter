import React from "react";
import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import logo from "./logo.svg";
import './Navbar.css';


export default function Navbar({title, wallet, network}) {

    const networkName = (networkID) => {
        const networks = [
            "Olympic",  //0
            "Mainnet",  //1
            "Morden",   //2
            "Ropsten",  //3
            "Rinkeby",  //4
            "Goerli",   //5
        ];

        if(0 <= networkID && networkID < networks.length){
            return networks[networkID];
        }else{
            return "unknown";
        }
    }

    return(
        <nav>
            <div className="row align-items-center">
                <div className="col-5 ">
                    <img src={logo} width="40" height="40" alt="logo" />
                    {title}
                </div>
                <div className="col-7 text-right small ml-auto">
                    Your wallet:  {wallet}<br />
                    Network: {network} <Badge pill variant="info">{networkName(network)}</Badge>
                </div>
            </div>
        </nav>
    )

}

Navbar.propTypes = {
    title:  PropTypes.string,
    wallet: PropTypes.string.isRequired,
}

//export default Navbar;