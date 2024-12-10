import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserInfo } from '../../app/userSlice';
import ChainConfig from '../../constant/ChainConfig';
import styles from './WalletConnect.module.css';

const WalletConnect = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.userInfo);

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const connectWallet = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            // Check if Keplr is installed
            if (!window.keplr) {
                throw new Error("Please install Keplr extension");
            }

            // Enable the chain
            await window.keplr.enable(ChainConfig.chainId);
            
            // Get the offlineSigner for this chainId
            const offlineSigner = window.keplr.getOfflineSigner(ChainConfig.chainId);
            
            // Get user address
            const accounts = await offlineSigner.getAccounts();
            const address = accounts[0].address;

            // Store in Redux
            dispatch(setUserInfo({
                address,
                chainId: ChainConfig.chainId,
                connected: true
            }));

        } catch (err) {
            setError(err.message);
            console.error("Error connecting wallet:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        dispatch(setUserInfo({
            address: '',
            chainId: '',
            connected: false
        }));
        setError('');
    };

    // Add Humans Chain to Keplr
    useEffect(() => {
        if (window.keplr) {
            window.keplr.experimentalSuggestChain({
                chainId: ChainConfig.chainId,
                chainName: ChainConfig.chainName,
                rpc: ChainConfig.rpcEndpoint,
                rest: ChainConfig.restEndpoint,
                bip44: {
                    coinType: 118,
                },
                bech32Config: {
                    bech32PrefixAccAddr: ChainConfig.addressPrefix,
                    bech32PrefixAccPub: `${ChainConfig.addressPrefix}pub`,
                    bech32PrefixValAddr: `${ChainConfig.addressPrefix}valoper`,
                    bech32PrefixValPub: `${ChainConfig.addressPrefix}valoperpub`,
                    bech32PrefixConsAddr: `${ChainConfig.addressPrefix}valcons`,
                    bech32PrefixConsPub: `${ChainConfig.addressPrefix}valconspub`,
                },
                currencies: [
                    {
                        coinDenom: "HEART",
                        coinMinimalDenom: ChainConfig.microDenom,
                        coinDecimals: parseInt(ChainConfig.coinDecimals),
                    },
                ],
                feeCurrencies: [
                    {
                        coinDenom: "HEART",
                        coinMinimalDenom: ChainConfig.microDenom,
                        coinDecimals: parseInt(ChainConfig.coinDecimals),
                        gasPriceStep: {
                            low: 0.025,
                            average: 0.03,
                            high: 0.04,
                        },
                    },
                ],
                stakeCurrency: {
                    coinDenom: "HEART",
                    coinMinimalDenom: ChainConfig.microDenom,
                    coinDecimals: parseInt(ChainConfig.coinDecimals),
                },
            }).catch(console.error);
        }
    }, []);

    return (
        <div className={styles['wallet-connect-container']}>
            {!userInfo.connected ? (
                <button 
                    onClick={connectWallet}
                    className={styles['connect-button']}
                    disabled={isLoading}
                >
                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div className={styles['wallet-info']}>
                    <span className={styles['address']}>
                        {formatAddress(userInfo.address)}
                    </span>
                    <button 
                        onClick={disconnectWallet}
                        className={styles['disconnect-button']}
                    >
                        Disconnect
                    </button>
                </div>
            )}
            {error && <p className={styles['error-message']}>{error}</p>}
        </div>
    );
};

export default WalletConnect;
