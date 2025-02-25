// @flow

import { WebDriver } from 'selenium-webdriver';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { bytesToHex, getTtl, hexToBytes } from '../support/helpers/dapp-helpers';
import { MultiAsset, TransactionBuilder } from '@emurgo/cardano-serialization-lib-nodejs';

class MockDAppWebpageError extends Error {}

type AccessCallBack = {|
  success: boolean,
  errMsg?: string,
|};

type ReducedAsset = {|
  policyId: any | string,
  name: any | string,
  amount: string,
  assetId: string,
|};

type Utxo = {|
  utxo_id: string, // concat tx_hash and tx_index
  tx_hash: string,
  tx_index: number,
  block_num?: number, // NOTE: not slot_no
  receiver: string,
  amount: string,
  dataHash?: string,
  assets: Array<ReducedAsset | any>,
|};

export class MockDAppWebpage {
  driver: WebDriver;
  logger: Object;

  constructor(driver: WebDriver, logger: Object) {
    this.driver = driver;
    this.logger = logger;
  }

  _transactionBuilder(): TransactionBuilder {
    this.logger.info('MockDApp: Calling the transaction builder');
    const transactionBuilder = CardanoWasm.TransactionBuilder.new(
      CardanoWasm.TransactionBuilderConfigBuilder.new()
        // all of these are taken from the mainnet genesis settings
        // linear fee parameters (a*size + b)
        .fee_algo(
          CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str('44'),
            CardanoWasm.BigNum.from_str('155381')
          )
        )
        .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
        .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
        .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
        .max_value_size(5000)
        .max_tx_size(16384)
        .build()
    );
    this.logger.info('MockDApp: -> The transaction builder is created');
    return transactionBuilder;
  }

  async _requestAccess(auth: boolean = false) {
    this.logger.info(`MockDApp: Requesting the access ${auth ? 'with' : 'without'} authentication`);
    const scriptString = `window.accessRequestPromise = cardano.yoroi.enable(${
      auth ? '{requestIdentification: true}' : ''
    })`;
    await this.driver.executeScript(scriptString);
  }

  _addressesFromCborIfNeeded(addresses: Array<string>): Array<string> {
    this.logger.info(`MockDApp: Converting the addresses "${JSON.stringify(addresses)}" from CBOR`);
    const resultOfConverting = addresses.map(a =>
      CardanoWasm.Address.from_bytes(hexToBytes(a)).to_bech32()
    );
    this.logger.info(`MockDApp: -> Result of converting ${JSON.stringify(resultOfConverting)}`);
    return resultOfConverting;
  }

  _reduceWasmMultiAsset(
    multiAsset: MultiAsset | void,
    reducer: any,
    initValue: Array<any>
  ): Array<ReducedAsset | any> {
    this.logger.info(`MockDApp: Reduce multiAsset`);
    let result = initValue;
    if (multiAsset) {
      const policyIds = multiAsset.keys();
      for (let i = 0; i < policyIds.len(); i++) {
        const policyId = policyIds.get(i);
        const assets = multiAsset.get(policyId);
        if (assets) {
          const assetNames = assets.keys();
          for (let j = 0; j < assetNames.len(); j++) {
            const name = assetNames.get(j);
            const amount = assets.get(name);
            const policyIdHex = bytesToHex(policyId.to_bytes());
            const encodedName = bytesToHex(name.name());
            result = reducer(result, {
              policyId: policyIdHex,
              name: encodedName,
              amount: amount?.to_str(),
              assetId: `${policyIdHex}.${encodedName}`,
            });
          }
        }
      }
    }
    this.logger.info(`MockDApp: -> Reduced multiAsset ${JSON.stringify(result)}`);
    return result;
  }

  _mapCborUtxos(cborUtxos: Array<string>): Array<Utxo> {
    this.logger.info(`MockDApp: Mapping cborUTXOs "${JSON.stringify(cborUtxos)}" to UTXOs`);
    const mappedUtxos = cborUtxos.map(hex => {
      const u = CardanoWasm.TransactionUnspentOutput.from_bytes(hexToBytes(hex));
      const input = u.input();
      const output = u.output();
      const txHash = bytesToHex(input.transaction_id().to_bytes());
      const txIndex = input.index();
      const value = output.amount();
      return {
        utxo_id: `${txHash}${txIndex}`,
        tx_hash: txHash,
        tx_index: txIndex,
        receiver: output.address().to_bech32(),
        amount: value.coin().to_str(),
        assets: this._reduceWasmMultiAsset(
          value.multiasset(),
          (res, asset) => {
            res.push(asset);
            return res;
          },
          []
        ),
      };
    });
    this.logger.info(`MockDApp: -> Mapped UTXOs "${JSON.stringify(mappedUtxos)}"`);
    return mappedUtxos;
  }

  async _getChangeAddress(): Promise<string> {
    this.logger.info(`MockDApp: Getting the change address`);
    const changeAddresses = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.api
        .getChangeAddress()
        .then(addresses => {
          // eslint-disable-next-line promise/always-return
          if (addresses.length === 0) {
            callback({ success: false, errMsg: 'No change addresses' });
          }
          callback({ success: true, retValue: addresses });
        })
        .catch(error => {
          callback({ success: false, errMsg: error.message });
        });
    });
    if (changeAddresses.success) {
      const changeAddress = this._addressesFromCborIfNeeded([changeAddresses.retValue])[0];
      this.logger.info(`MockDApp: -> The change address is ${changeAddress}`);
      return changeAddress;
    }
    this.logger.error(`MockDApp: -> The error is received: ${changeAddresses.errMsg}`);
    throw new MockDAppWebpageError(changeAddresses.errMsg);
  }

  async _getUTXOs(): Promise<Array<Utxo>> {
    this.logger.info(`MockDApp: Getting UTXOs`);
    const walletUTXOsResponse = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.api
        .getUtxos()
        .then(utxosResponse => {
          // eslint-disable-next-line promise/always-return
          if (utxosResponse.length === 0) {
            callback({ success: false, errMsg: 'NO UTXOS' });
          } else {
            callback({ success: true, retValue: utxosResponse });
          }
        })
        .catch(error => {
          callback({ success: false, errMsg: JSON.stringify(error) });
        });
    });
    this.logger.info(
      `MockDApp: -> The walletUTXOsResponse: ${JSON.stringify(walletUTXOsResponse)}`
    );
    if (walletUTXOsResponse.success) {
      return this._mapCborUtxos(walletUTXOsResponse.retValue);
    }
    this.logger.error(`MockDApp: -> The error is received: ${walletUTXOsResponse.errMsg}`);
    throw new MockDAppWebpageError(walletUTXOsResponse.errMsg);
  }

  async requestNonAuthAccess() {
    await this._requestAccess();
  }

  async requestAuthAccess() {
    await this._requestAccess(true);
  }

  async checkAccessRequest(): Promise<AccessCallBack> {
    this.logger.info(`MockDApp: Checking the access request`);
    const accessResponse = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.accessRequestPromise
        .then(
          // eslint-disable-next-line promise/always-return
          api => {
            window.api = api;
            callback({ success: true });
          },
          error => {
            callback({ success: false, errMsg: error.message });
          }
        )
        .catch(error => {
          callback({ success: false, errMsg: error.message });
        });
    });
    this.logger.info(`MockDApp: -> The access response: ${JSON.stringify(accessResponse)}`);

    await this.driver.executeScript(accResp => {
      if (accResp.success) {
        window.walletConnected = true;
      } else {
        window.walletConnected = null;
      }
    }, accessResponse);

    if (accessResponse.success) {
      this.logger.info(`MockDApp: -> window.walletConnected = true is set`);
    } else {
      this.logger.info(`MockDApp: -> window.walletConnected = null is set`);
    }

    return accessResponse;
  }

  async addOnDisconnect() {
    this.logger.info(`MockDApp: Setting the onDisconnect hook`);
    await this.driver.executeScript(() => {
      window.api.experimental.onDisconnect(() => {
        window.walletConnected = false;
      });
    });
  }

  async isEnabled(): Promise<boolean> {
    this.logger.info(`MockDApp: Checking is a wallet enabled`);
    const isEnabled = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.cardano.yoroi
        .isEnabled().then(
        // eslint-disable-next-line promise/always-return
          onSuccess => {
            callback({ success: true, retValue: onSuccess })
          },
          onReject => {
            callback({ success: false, errMsg: onReject.message })
          }
        )
        .catch(error => {
          callback({ success: false, errMsg: error.message });
        });
    });
    if (isEnabled.success) {
      this.logger.info(`MockDApp: -> The wallet is enabled`);
      return isEnabled.retValue;
    }
    this.logger.error(
      `MockDApp: -> The wallet is disabled. Error message: ${JSON.stringify(isEnabled)}`
    );
    throw new MockDAppWebpageError(isEnabled.errMsg);
  }

  async getConnectionState(): Promise<boolean> {
    this.logger.info(`MockDApp: Getting the connection state`);
    const walletConnectedState = await this.driver.executeScript(() => window.walletConnected);
    this.logger.info(`MockDApp: -> The connection state is ${walletConnectedState}`);
    return walletConnectedState;
  }

  async getBalance(): Promise<string> {
    this.logger.info(`MockDApp: Getting the balance`);
    const balanceCborHex = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.api
        .getBalance()
        // eslint-disable-next-line promise/always-return
        .then(balance => {
          callback({ success: true, retValue: balance });
        })
        .catch(error => {
          callback({ success: false, errMsg: error.message });
        });
    });
    if (balanceCborHex.success) {
      const value = CardanoWasm.Value.from_bytes(Buffer.from(balanceCborHex.retValue, 'hex'));
      const valueStr = value.coin().to_str();
      this.logger.info(`MockDApp: -> The balance is ${valueStr}`);
      return valueStr;
    }
    this.logger.error(
      `MockDApp: -> The error is received while getting the balance. Error: ${JSON.stringify(
        balanceCborHex
      )}`
    );
    throw new MockDAppWebpageError(balanceCborHex.errMsg);
  }

  async requestSigningTx(amount: string, toAddress: string) {
    this.logger.info(
      `MockDApp: Requesting signing the transaction: amount="${amount}", toAddress="${toAddress}"`
    );
    const UTXOs = await this._getUTXOs();
    const changeAddress = await this._getChangeAddress();
    const txBuilder = this._transactionBuilder();
    const utxo = UTXOs[0];

    const addr = CardanoWasm.Address.from_bech32(utxo.receiver);
    const baseAddr = CardanoWasm.BaseAddress.from_address(addr);
    if (!baseAddr) {
      this.logger.error(`MockDApp: -> The error is received: No baseAddr`);
      throw new MockDAppWebpageError('No baseAddr');
    }
    const keyHash = baseAddr.payment_cred().to_keyhash();
    if (!keyHash) {
      this.logger.error(`MockDApp: -> The error is received: No keyHash`);
      throw new MockDAppWebpageError('No keyHash');
    }

    txBuilder.add_key_input(
      keyHash,
      CardanoWasm.TransactionInput.new(
        CardanoWasm.TransactionHash.from_bytes(hexToBytes(utxo.tx_hash)), // tx hash
        utxo.tx_index // index
      ),
      CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(utxo.amount))
    );

    const shelleyOutputAddress = CardanoWasm.Address.from_bech32(toAddress);
    const shelleyChangeAddress = CardanoWasm.Address.from_bech32(changeAddress);

    // add output to the tx
    txBuilder.add_output(
      CardanoWasm.TransactionOutput.new(
        shelleyOutputAddress,
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(amount))
      )
    );
    const ttl = getTtl();
    txBuilder.set_ttl(ttl);
    // calculate the min fee required and send any change to an address
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    const unsignedTransactionHex = bytesToHex(txBuilder.build_tx().to_bytes());
    this.logger.info(`MockDApp: -> unsignedTransactionHex: ${unsignedTransactionHex}`);

    this.driver.executeScript(unsignedTxHex => {
      window.signTxPromise = window.api.signTx({ tx: unsignedTxHex });
    }, unsignedTransactionHex);
  }

  async getSigningTxResult(): Promise<string | {| code: number, info: string |}> {
    this.logger.info(`MockDApp: Getting signing result`);
    const signingResult = await this.driver.executeAsyncScript((...args) => {
      const callback = args[args.length - 1];
      window.signTxPromise
        .then(
          // eslint-disable-next-line promise/always-return
          onSuccess => {
            callback(onSuccess);
          },
          onReject => {
            callback(onReject);
          }
        )
        .catch(callback);
    });
    this.logger.info(`MockDApp: -> Signing result: ${JSON.stringify(signingResult)}`);
    return signingResult;
  }
}
