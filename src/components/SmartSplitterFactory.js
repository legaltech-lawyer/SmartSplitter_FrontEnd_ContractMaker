import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Button, CircularProgress, Box, TextField, Snackbar, Alert, Link, Typography, Card, CardContent, TableContainer, TableHead, Table, TableRow, TableCell, TableBody } from "@mui/material"
import { ethers } from 'ethers'
import SmartSplitterFactoryABI from "../chain-info/contracts/SmartSplitterFactory.json"

const SmartSplitterFactory = () => {

    const smartSplitterFactoryAddress = "0xD9bA3054EA49c9cA48143bFf078Cbd2105224422"
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
            console.log("there")
            return newAccount[0].toString()
        }
        else {

            console.log(newAccount)
            console.log("within")
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
        if (provider !== null && !processing && defaultAccount !== null) {
            let balance = await provider.getBalance(defaultAccount);
            setWalletBalance(ethers.utils.formatEther(balance))
        }

    }

    const getContractsMade = async () => {
        if (contract != null) {
            const contractsMade = await contract.contractsStored()

            const stringContractsMade = contractsMade.toString()
            const stringContractsMadeNum = parseInt(contractsMade)
            setContractsMade(stringContractsMade)
            const mostRecentContractAddress = await contract.getAddressFromIndex(stringContractsMadeNum - 1)
            console.log("Most Recent SmartSplitter Contract At:" + mostRecentContractAddress)
            setMostRecentContract(mostRecentContractAddress)
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

    useEffect(() => {
        if (contract !== null) {
            if (mostrecentcontract !== null) {
                getContractsMade()
            }
            setAccountChanging(false)

        }
    }, [contract])


    const handleAddressChange = (event) => {
        // setPayees(event.target.value)
        const result = processPayeeAddressText(event.target.value)
        console.log(result)
        setPayees(result)
        
    }

    const processPayeeAddressText = (payeeText) => {
        
        let temp = payeeText.split(",")
        let output = []
        for (let i = 0; i<temp.length; i++){
            let current = temp[i]
            let trimmedval = current.trim()
            output.push(trimmedval)
        }
       return output
    }

    const handleRatioChange = (event) => {
        event.preventDefault()
        let payeeRatioBoxes = document.querySelectorAll("#setPayRatio")
        let payeeRatioArray = []
        for (let i = 0; i < payeeRatioBoxes.length; i++) {
            payeeRatioArray.push(parseInt(payeeRatioBoxes[i].value))
        }
        setPayeeRatio(payeeRatioArray)
    }

    const previewContract = (event) => {
        event.preventDefault()
        setPreviewContract(true)
    }
    const handlePreviewContractClose = (event) => {
        event.preventDefault()
        setPreviewContract(false)
        setPayees(null)
        setPayeeRatio(null)
    }

    const createContract = async () => {
        setProcessing(true)

        try {
            console.log("attempt")
            console.log(payees)
            const tx = await contract.createSmartSplitterContract(payees, payeeratio)
            let hash = tx.hash
            setTxHash(hash.toString())
            isTransactionMined(hash.toString())

        }
        catch {
            console.log("catch initiated")
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
                console.log("COMPLETED BLOCK: " + tx.blockNumber.toString())

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
        event.preventDefault()
        console.log("creating contract")
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
            <Box>


                <Card variant="outlined" sx={{ display: 'inline-block', backgroundColor: "lightgoldenrodyellow" }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 600 }} variant="h1">Contract Summary:</Typography>
                    <List >
                        {
                            formatted.map((item) => {
                                itemCount++;
                                return (
                                    <ListItem key={itemCount} >
                                        <ListItemText > {item}</ListItemText>
                                    </ListItem>
                                )
                            })
                        }
                    </List>

                    {
                        !processing ? (
                            <Box>
                                <Box p={1}>
                                    <Button color="success" variant="contained" onClick={createContractEvent}>Create Contract</Button>
                                </Box>

                                <Box p={1}>
                                    <Button color="error" variant="contained" onClick={handlePreviewContractClose}>Cancel Contract</Button>
                                </Box>

                            </Box>

                        ) :

                            (<CircularProgress size={26} color="error" />)
                    }



                </Card>
            </Box>

        )
    }

    const handleCloseSnack = () => {
        setTransactionPosted(false)
    }


    let itemCount = 0;

    return (
        <>
            <Box>
                <Button onClick={connectWalletHandler} color="primary" variant="contained" sx={{ margin: 2 }}>{connButtonText}</Button>
            </Box>

            <Snackbar open={transactionPosted} autoHideDuration={8000} onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity="success">
                    <Link target="_blank" rel="noopener noreferrer" href={`https://kovan.etherscan.io/tx/${txhash}`}> Transaction Complete. Contract at: {mostrecentcontract} </Link>
                </Alert>
            </Snackbar>

            {
                defaultAccount ? (

                    <>
                        <Card variant="outlined" sx={{ display: 'inline-block', backgroundColor: "beige" }}>
                            <CardContent>
                                <Typography variant="h3" sx={{ fontSize: 15 }}>Address: {defaultAccount}</Typography>
                                <Typography variant="h3" sx={{ fontSize: 15 }}>Wallet Balance: {walletBalance}</Typography>
                                {
                                    mostrecentcontract ? (<Typography variant="h3" sx={{ fontSize: 15 }} color="red">Most Recent SmartSplitter: {mostrecentcontract}</Typography>) : (null)
                                }
                            </CardContent>
                        </Card>

                    </>

                ) :
                    (
                        <Typography>
                            {errorMessage}
                        </Typography>
                    )
            }

            {
                contract && !previewcontract ? (
                    <Box>
                        <Card variant="outlined" sx={{ display: 'inline-block', backgroundColor: "lightgoldenrodyellow" }}>
                            <Typography variant="h1" sx={{ fontSize: 20, fontWeight: 600 }}>Create SmartSplitter Contract:</Typography>

                            <Box >
                                <Typography variant="h3" sx={{ fontSize: 15 }}>Payee Addresses (comma seperated):</Typography>
                                <TextField fullWidth id="setAddress" variant="filled" onChange={handleAddressChange} ></TextField>
                            </Box>
                            <TableContainer>
                                <Table sx={{ border: 2 }}>
                                    <TableHead>
                                        <TableRow sx={{ border: 2 }}>
                                            <TableCell> <Typography>Payee Addresses</Typography></TableCell>
                                            <TableCell><Typography>Shares Allocated</Typography> </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>

                                        {payees ? (payees.map((item) => {
                                            itemCount++;
                                            return (

                                                <TableRow key={itemCount} >
                                                    <TableCell >{item}</TableCell>
                                                    <TableCell><TextField id="setPayRatio" variant="filled" onChange={handleRatioChange}></TextField></TableCell>
                                                </TableRow>


                                            )
                                        })) : (
                                            null
                                        )
                                        }

                                    </TableBody>
                                </Table>
                            </TableContainer>


                            {
                                payeeratio !== null && payees !== null ?
                                    (<Box p={2}><Button onClick={previewContract} color="error" variant="contained">Preview Contract</Button></Box>) :
                                    (null)
                            }



                        </Card>

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
