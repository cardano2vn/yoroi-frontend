// @flow

import { When, Then, } from 'cucumber';
import { testWallets } from '../mock-chain/TestWallets';
import { truncateAddress, } from '../../app/utils/formatters';

When(/^I select a Byron-era Ledger device$/, async function () {
  await this.click({ locator: '.WalletAdd_btnConnectHW', method: 'css' });

  await this.waitForElement({ locator: '.PickCurrencyOptionDialog', method: 'css' });
  await this.click({ locator: '.PickCurrencyOptionDialog_cardano', method: 'css' });

  await this.waitForElement({ locator: '.WalletConnectHWOptionDialog', method: 'css' });

  await this.click({ locator: '.WalletConnectHWOptionDialog_connectLedger', method: 'css' });
  await this.click({ locator: '.WalletEraOptionDialog_bgByronMainnet', method: 'css' });
});
When(/^I select a Shelley-era Ledger device$/, async function () {
  await this.click({ locator: '.WalletAdd_btnConnectHW', method: 'css' });

  await this.waitForElement({ locator: '.PickCurrencyOptionDialog', method: 'css' });
  await this.click({ locator: '.PickCurrencyOptionDialog_cardano', method: 'css' });

  await this.waitForElement({ locator: '.WalletConnectHWOptionDialog', method: 'css' });

  await this.click({ locator: '.WalletConnectHWOptionDialog_connectLedger', method: 'css' });
  await this.click({ locator: '.WalletEraOptionDialog_bgShelleyMainnet', method: 'css' });
});
When(/^I restore the Ledger device$/, async function () {
  await this.waitForElement({ locator: '.CheckDialog_component', method: 'css' });
  await this.click({ locator: '.primary', method: 'css' });
  await this.click({ locator: '.primary', method: 'css' });

  // between these is where the tab & iframe gets opened

  await this.waitForElement({ locator: '.SaveDialog', method: 'css' });
  await this.click({ locator: '.primary', method: 'css' });
});


When(/^I select a Byron-era Trezor device$/, async function () {
  await this.click({ locator: '.WalletAdd_btnConnectHW', method: 'css' });

  await this.waitForElement({ locator: '.PickCurrencyOptionDialog', method: 'css' });
  await this.click({ locator: '.PickCurrencyOptionDialog_cardano', method: 'css' });

  await this.waitForElement({ locator: '.WalletConnectHWOptionDialog', method: 'css' });

  await this.click({ locator: '.WalletConnectHWOptionDialog_connectTrezor', method: 'css' });
  await this.click({ locator: '.WalletEraOptionDialog_bgByronMainnet', method: 'css' });
});
When(/^I select a Shelley-era Trezor device$/, async function () {
  await this.click({ locator: '.WalletAdd_btnConnectHW', method: 'css' });

  await this.waitForElement({ locator: '.PickCurrencyOptionDialog', method: 'css' });
  await this.click({ locator: '.PickCurrencyOptionDialog_cardano', method: 'css' });

  await this.waitForElement({ locator: '.WalletConnectHWOptionDialog', method: 'css' });

  await this.click({ locator: '.WalletConnectHWOptionDialog_connectTrezor', method: 'css' });
  await this.click({ locator: '.WalletEraOptionDialog_bgShelleyMainnet', method: 'css' });
});

When(/^I restore the Trezor device$/, async function () {
  await this.waitForElement({ locator: '.CheckDialog_component', method: 'css' });
  await this.click({ locator: '.primary', method: 'css' });
  await this.click({ locator: '.primary', method: 'css' });

  // between these is where the tab & iframe gets opened

  await this.waitForElement({ locator: '.SaveDialog', method: 'css' });
  await this.input({ locator: "input[name='walletName']", method: 'css' }, testWallets['trezor-wallet'].name);
  await this.click({ locator: '.primary', method: 'css' });
});


When(/^I see the hardware send money confirmation dialog$/, async function () {
  await this.waitForElement({ locator: '.HWSendConfirmationDialog_dialog', method: 'css' });
});

When(/^I click on the verify address button$/, async function () {
  await this.click({ locator: '.WalletReceive_verifyIcon', method: 'css' });
});

When(/^I see the verification address "([^"]*)"$/, async function (address) {
  await this.waitUntilText({ locator: '.verificationAddress', method: 'css' }, truncateAddress(address));
});

When(/^I see the derivation path "([^"]*)"$/, async function (path) {
  await this.waitUntilText({ locator: '.VerifyAddressDialog_derivation', method: 'css' }, path);
});

Then(/^I verify the address on my ledger device$/, async function () {
  await this.click({ locator: '.VerifyAddressDialog_component .primary', method: 'css' });
  await this.waitDisable({ locator: '.VerifyAddressDialog_component .primary', method: 'css' }); // disable when communicating with device
  await this.waitEnable({ locator: '.VerifyAddressDialog_component .primary', method: 'css' }); // enable after it's done
  await this.driver.sleep(1000);
  await this.waitForElementNotPresent({ locator: '.ErrorBlock_component', method: 'css' });
});

Then(/^I verify the address on my trezor device$/, async function () {
  await this.click({ locator: '.Dialog_actions .primary', method: 'css' });
  // we should have this disable while the action is processing, but we don't show a spinner on this
  await this.waitForElementNotPresent({ locator: '.ErrorBlock_component', method: 'css' });
});
