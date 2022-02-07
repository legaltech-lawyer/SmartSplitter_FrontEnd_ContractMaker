import React, { useState, useEffect } from 'react';
import { Button, Container, CircularProgress, Box, TextField, Snackbar, Alert, Link } from "@mui/material"
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


    const [contractsMade, setContractsMade] = useState(null);

    const [payees, setPayees] = useState(null);
    const [payeeratio, setPayeeRatio] = useState(null);
    const [previewcontract, setPreviewContract] = useState(false);

    const [processing, setProcessing] = useState(false)
    const [txhash, setTxHash] = useState(null)

    const [transactionPosted, setTransactionPosted] = useState(false)
    const [mostrecentcontract, setMostRecentContract] = useState(null)

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

    const getContractsMade = async () => {
        const contractsMade = await contract.contractsStored()
        // console.log(contractsMade.toString())
        const stringContractsMade = contractsMade.toString()
        const stringContractsMadeNum = parseInt(contractsMade)
        setContractsMade(stringContractsMade)
        const mostRecentContractAddress = await contract.getAddressFromIndex(stringContractsMadeNum - 1)
        console.log(mostRecentContractAddress)
        setMostRecentContract(mostRecentContractAddress)

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

    useEffect(() => {
        if (contract !== null) {

            getContractsMade()
            setAccountChanging(false)

        }
    }, [contract])


    const handleAddressChange = (event) => {
        // setPayees(event.target.value)
        const result = processPayeeAddressText(event.target.value)
        setPayees(result)
    }

    const processPayeeAddressText = (payeeText) => {
        return payeeText.split(",")
    }

    const handleRatioChange = (event) => {
        let payeeRatioBoxes = document.querySelectorAll("#setPayRatio")
        let payeeRatioArray = []
        for (let i = 0; i < payeeRatioBoxes.length; i++) {
            console.log((payeeRatioBoxes[i].value))
            payeeRatioArray.push(parseInt(payeeRatioBoxes[i].value))
        }
        setPayeeRatio(payeeRatioArray)
    }

    const previewContract = (event) => {
        setPreviewContract(true)
    }
    const handlePreviewContractClose = (event) => {
        setPreviewContract(false)
        setPayees(null)
        setPayeeRatio(null)
    }

    const createContract = async () => {
        setProcessing(true)

        try {
            const tx = await contract.createSmartSplitterContract(payees, payeeratio)
            console.log(tx.hash)
            let hash = tx.hash
            setTxHash(hash.toString())
            isTransactionMined(hash.toString())

        }
        catch {
            setProcessing(false)
        }


    }



    const isTransactionMined = async (transactionHash) => {
        let transactionBlockFound = false

        while (transactionBlockFound === false) {
            let tx = await provider.getTransactionReceipt(transactionHash)
            console.log("transaction status check....")
            try {
                await tx.blockNumber
            }
            catch (error) {
                tx = await provider.getTransactionReceipt(transactionHash)
            }
            finally {
                console.log("proceeding")
            }


            if (tx && tx.blockNumber) {
                setProcessing(false)
                setPreviewContract(false)
                console.log("block number assigned.")
                transactionBlockFound = true
                console.log("COMPLETE BLOCK: " + tx.blockNumber.toString())

                //check balance of user wallet

                getWalletBalance(provider)
                getContractsMade()
                setTransactionPosted(true)
                setPayees(null)
                setPayeeRatio(null)

            }
        }


    }

    const createContractEvent = (event) => {
        createContract()
    }

    const RenderPreview = () => {
        let formatted = []
        if (payees !== null) {
            for (let i = 0; i < payees.length; i++) {
                let str = payees[i] + " will be allocated " + payeeratio[i] + " shares"
                formatted.push(str)
            }
        }
        return (
            <div>
                <h1>Contract Summary:</h1>
                {
                    formatted.map((item) => {
                        itemCount++;
                        return (
                            <li key={itemCount}>{item}</li>
                        )
                    })
                }
                <Box p={5}>
                    {
                        !processing ? (
                            <>
                                <Button color="success" variant="contained" onClick={createContractEvent}>Create Contract</Button>
                                <Button color="error" variant="contained" onClick={handlePreviewContractClose}>Edit Contract</Button></>) :
                            (<CircularProgress size={26} color="error" />)
                    }

                </Box>

            </div>

        )
    }

    const handleCloseSnack = () => {
        setTransactionPosted(false)
    }


    let itemCount = 0;

    return (
        <>

            <Box>
                <Button onClick={connectWalletHandler} color="error" variant="contained">{connButtonText}</Button>
            </Box>

            <Snackbar open={transactionPosted} autoHideDuration={8000} onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity="success">
                    <Link target="_blank" rel="noopener noreferrer" href={`https://kovan.etherscan.io/tx/${txhash}`}> Transaction Complete. Contract at: {mostrecentcontract} </Link>
                </Alert>
            </Snackbar>

            {
                defaultAccount ? (

                    <>
                        <Box>
                            <h3>Address: {defaultAccount}</h3>
                            <h3>Wallet Balance: {walletBalance}</h3>
                            <h3>Most Recent Contract Minted: {mostrecentcontract}</h3>
                        </Box>

                    </>

                ) :
                    (
                        <div>
                            {errorMessage}
                        </div>
                    )
            }

            {
                contract && !previewcontract ? (
                    <Box>
                        <h1>Create SmartSplitter Contract:</h1>
                        <form >
                            <Box p={3}>
                                <h3>Payee Addresses (note: comma seperated):</h3>

                                <TextField id="setAddress" variant="filled" onChange={handleAddressChange} ></TextField>



                            </Box>
                        </form>
                        <table>
                            <tbody>
                                <tr>
                                    <th>Payee Addresses</th>
                                    <th>Shares Allocated</th>
                                </tr>
                                {payees ? (payees.map((item) => {
                                    itemCount++;
                                    return (

                                        <tr key={itemCount}>
                                            <td >{item}</td>
                                            <td><TextField id="setPayRatio" variant="filled" onChange={handleRatioChange}></TextField></td>
                                        </tr>


                                    )
                                })) : (
                                    <tr></tr>
                                )
                                }
                            </tbody>
                        </table>

                        {
                            payeeratio !== null && payees !== null ?
                                (<Box p={5}><Button onClick={previewContract} color="error" variant="contained">Preview Contract</Button></Box>) :
                                (null)
                        }



                    </Box>




                ) :
                    (
                        null
                    )

            }
            {
                previewcontract ?
                    (<RenderPreview />) :
                    (null)
            }
        </>
    )
};

export default SmartSplitterFactory;
