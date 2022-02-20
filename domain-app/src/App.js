import React, { useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import config from './config.js';
import { ethers } from 'ethers';
import { networks } from './utils/networks';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const tld = '.jinja';
const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
const CONTRACT_ABI = config.CONTRACT_ABI;

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	const [network, setNetwork] = useState('');
	const [editing, setEditing] = useState('');
	const [mints, setMints] = useState('');

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert('Get MetaMask -> https://metamask.io/');
				return;
			}

			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
			console.log('Connected', accounts[0]);
			setCurrentAccount(accounts[0]);
		}
		catch (err) {
			console.log(err);
		}
	}

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have MetaMask!');
			return;
		}
		else {
			console.log('We have the ethereum object', ethereum);
		}

		// Check for an authorized account
		const accounts = await ethereum.request({ method: 'eth_accounts' });
		const account = accounts.length !== 0 ? accounts[0] : null;

		if (!!account) {
			console.log('Found an authorized account: ', account)
			setCurrentAccount(account);
		}
		else {
			console.log('No authorized account found :(');
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);

		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	const mintDomain = async () => {
		if (!domain) { return };
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}

		// Calculate price based on length of domain
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
		console.log(`Minting domain ${domain} with price ${price}`);

		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					CONTRACT_ABI,
					signer
				);

				console.log('Going to pop wallet now to pay gas...');
				let tx = await contract.register(domain, { value: ethers.utils.parseEther(price) });
				const receipt = await tx.wait();

				if (receipt.status === 1) {
					console.log(`Domain minted! https://mumbai.polygonscan.com/tx/${tx.hash}`);

					tx = await contract.setRecord(domain, record);
					await tx.wait();

					console.log(`Record set! https://mumbai.polygonscan.com/tx/${tx.hash}`);

					// Call fetchMints after 2 seconds
					setTimeout(() => {
						fetchMints();
					}, 2000);

					setRecord('');
					setDomain('');
				}
				else {
					alert('Transaction failed! Please try again.');
				}
			}
		}
		catch (err) {
			console.log(err);
		}
	}

	const switchNetwork = async () => {
		const { ethereum } = window;
		if (ethereum) {
			try {
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }],
				});
			}
			catch (err) {
				if (err.code === 4902) {
					try {
						await ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18
									},
									blockExplorerUrls: ["http://mumbai.polygonscan.com/"]
								},
							],
						});
					}
					catch (err) {
						console.log(err);
					}
				}
				else {
					alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
				};
			};
		};
	}

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setEditing(true);
		console.log(`Updating domain ${domain} with record ${record}`);

		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					CONTRACT_ABI,
					signer
				);

				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log(`Record set https://mumbai.polyscan.com/tx/${tx.hash}`);

				fetchMints();
				setRecord('');
				setDomain('');
			}
		}
		catch (err) {
			console.log(err);
		}
		setEditing(false);
	}

	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					CONTRACT_ABI,
					signer
				);

				const names = await contract.getAllNames();
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);

					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner,
					};
				}));

				console.log("MINTS FETCHED: ", mintRecords);
				setMints(mintRecords);
			}
		}
		catch (err) {
			console.log(err);
		}
	}

	// This will run any time currentAccount or network are changed
	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}
	}, [currentAccount, network])

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="Ninja gif" />
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>
				Connect Wallet
			</button>
		</div>
	);

	const renderInputForm = () => {
		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<button className='cta-button network-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}

		return (
			<div className='form-container'>
				<div className='first-row'>
					<input
						type='text'
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type='text'
					value={record}
					placeholder='whats ur jinja flower'
					onChange={e => setRecord(e.target.value)}
				/>

				{editing ? (
					<div className='button-container'>
						<button className='cta-button mint-button' disabled={editing} onClick={updateDomain}>
							Set record
						</button>
						<button className='cta-button mint-button' onClick={() => { setEditing(false) }}>
							Cancel
						</button>
					</div>
				) : (
					<button className='cta-button mint-button' disabled={editing} onClick={mintDomain}>
						Mint
					</button>
				)}

			</div>
		)
	}

	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className='mint-container'>
					<p className='subtitle'>Recently minted domains!</p>
					<div className='mint-list'>
						{mints.map((mint, index) => {
							return (
								<div className='mint-item' key={index}>
									<div className='mint-row'>
										<a className='link' href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target='_blank' rel='noopener noreferrer'>
											<p className='underlined'>{' '}{mint.name}{tld}{' '}</p>
										</a>
										{mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
											<button className='edit-button' onClick={() => editRecord(mint.name)}>
												<img className='edit-icon' src='https://img.icons8.com/metro/26/000000/pencil.png' alt='Edit button' />
											</button>
											:
											null
										}
									</div>
									<p> {mint.record} </p>
								</div>
							)
						})}
					</div>
				</div>
			);
		}
	};

	const editRecord = (name) => {
		console.log('Editing record for', name);
		setEditing(true);
		setDomain(name);
	}

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
						<div className="left">
							<p className="title">🐱‍👤 Jinja Name Service</p>
							<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
						<div className="right">
							<img alt="Network logo" className="logo" src={network.includes("Polygon") ? polygonLogo : ethLogo} />
							{currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p>}
						</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}

				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
