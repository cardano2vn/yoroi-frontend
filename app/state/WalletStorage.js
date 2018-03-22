import {
  serializeWallet, deserializeWallet
} from '../utils/serializer';

const WalletStorage = {};
const WALLET_STORAGE_SK_KEY = 'WALLET_STORAGE_SK_KEY';

WalletStorage.initWallet = function () {
  // localStorage.removeItem(WALLET_STORAGE_SK_KEY); // This line is for debugging purposes
  if (!this.sk) {
    if (window.localStorage) {
      try {
        this.sk = deserializeWallet(localStorage.getItem(WALLET_STORAGE_SK_KEY));
      } catch (e) {
        console.warn('[WalletStorage - initWallet] Unable to return Wallet info');
      }
    } else {
      console.warn('[WalletStorage - initWallet] The browser doesn\'t support local storage');
    }
  }
};

WalletStorage.hasWallet = function () {
  return !!this.sk;
};

WalletStorage.getWallet = function () {
  return this.sk;
};

WalletStorage.setWallet = function (wallet) {
  this.sk = wallet;
  if (window.localStorage) {
    console.log('[WalletStorage - SetWallet] saving wallet..');
    const walletJson = serializeWallet(wallet);
    localStorage.setItem(WALLET_STORAGE_SK_KEY, walletJson);
  } else {
    console.warn('[WalletStorage - SetWallet] The browser doesn\'t support local storage');
  }
};

// Always initWallet, before use WalletStorage.
export default WalletStorage;
