import React, { useState, useEffect } from 'react';
import { Button, Input, CircularProgress, Box, TextField, Snackbar, Alert, Link } from "@mui/material"
import { ethers, constants, utils } from 'ethers'
import SmartSplitterFactoryABI from "../chain-info/contracts/SmartSplitterFactory.json"

const SmartSplitterFactory = () => {

    const smartSplitterFactoryAddress = "0x1c61C23118f410B43676661B826cDf2a252de986"
    const { abi } = SmartSplitterFactoryABI

    const [connButtonText, setConnButtonText] = useState('Connect Wallet');
    const [accountchanging, setAccountChanging] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null);

    const [defaultAccount, setDefaultAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);


    const [walletBalance, setWalletBalance] = useState(null);
    const [processing, setProcessing] = useState(false)


    const updateEthers = () => {
        let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(tempProvider);

        let tempSigner = tempProvider.getSigner();
        setSigner(tempSigner);

        let tempContract = new ethers.Contract(smartSplitterFactoryAddress, abi, tempSigner);
        setContract(tempContract);

    }

    const checkAccountType = (newAccount) => {
        if (Array.isArray(newAccount)) {
            return newAccount[0].toString()
        }
        else {
            return newAccount
        }
    }

    const accountChangedHandler = (newAccount) => {
        if (!accountchanging) {
            setAccountChanging(true)


            console.log("account change happened")
            setDefaultAccount(checkAccountType(newAccount));
            updateEthers();
        }

    }

    const connectWalletHandler = () => {
        if (window.ethereum && window.ethereum.isMetaMask) {
            console.log("CONNECTING TO WALLET")
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(result => {

                    accountChangedHandler(result[0]);
                    setConnButtonText('Wallet Connected');



                })
                .catch(error => {
                    setErrorMessage(error.message);

                });

        } else {
            console.log('Need to install MetaMask');
            setErrorMessage('Please install MetaMask browser extension to interact');
        }
    }

    const chainChangedHandler = () => {
        // reload the page to avoid any errors with chain change mid use of application
        window.location.reload();
    }

    const getWalletBalance = async (provider) => {
        // Look up the balance
        if (provider !== null && !processing) {
            let balance = await provider.getBalance(defaultAccount);
            setWalletBalance(ethers.utils.formatEther(balance))
        }

    }




    useEffect(() => {
        if (accountchanging === false) {
            // listen for account changes
            window.ethereum.on('accountsChanged', accountChangedHandler);
            window.ethereum.on('chainChanged', chainChangedHandler);
        }
        else {
            window.ethereum.removeListener('accountsChanged', accountChangedHandler);
            window.ethereum.removeListener('chainChanged', chainChangedHandler);
        }

    }, [accountchanging])

    useEffect(() => {
        getWalletBalance(provider)

    }, [provider])


    return (
        <>

            <Box>
                <Button onClick={connectWalletHandler} color="error" variant="contained">{connButtonText}</Button>
            </Box>
            {
                defaultAccount ? (
                    <Box>
                        <h3>Address: {defaultAccount}</h3>
                        <h3>Wallet Balance: {walletBalance}</h3>
                    </Box>
                ) :
                    (
                        <div>
                            {errorMessage}
                        </div>
                    )
            }
        </>
    )
};

export default SmartSplitterFactory;
