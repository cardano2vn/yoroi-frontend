// @flow
import { Component } from 'react';
import type { Node } from 'react'
import styles from './SingleTokenRow.scss'
import NoAssetLogo from '../../../../assets/images/assets-page/asset-no.inline.svg';
import { truncateAddressShort } from '../../../../utils/formatters';
import BigNumber from 'bignumber.js';
import { defineMessages, intlShape } from 'react-intl';
import { AmountInputRevamp } from '../../../common/NumericInputRP';
import {
  MultiToken,
} from '../../../../api/common/lib/MultiToken';
import CloseIcon from '../../../../assets/images/forms/close.inline.svg';
import type { FormattedTokenDisplay } from '../../../../utils/wallet'
import type {
  TokenLookupKey,
  TokenEntry
} from '../../../../api/common/lib/MultiToken';
import type { TokenRow } from '../../../../api/ada/lib/storage/database/primitives/tables';
import type { UriParams } from '../../../../utils/URIHandling';
import type { $npm$ReactIntl$IntlFormat } from 'react-intl';
import LocalizableError from '../../../../i18n/LocalizableError';

type Props = {|
    +token: FormattedTokenDisplay,
    +addOrRemoveToken: (tokenId: string, status: boolean) => void,
    +classicTheme: boolean,
    +updateAmount: (?BigNumber) => void,
    +uriParams: ?UriParams,
    +selectedToken: void | $ReadOnly<TokenRow>,
    +validateAmount: (
      amountInNaturalUnits: BigNumber,
      tokenRow: $ReadOnly<TokenRow>,
    ) => Promise<[boolean, void | string]>,
    +defaultToken: $ReadOnly<TokenRow>,
    +getTokenInfo: $ReadOnly<Inexact<TokenLookupKey>> => $ReadOnly<TokenRow>,
    +fee: ?MultiToken,
    +isCalculatingFee: boolean,
    +error: ?LocalizableError,
    +totalInput: ?MultiToken,
|}

const messages = defineMessages({
    calculatingFee: {
        id: 'wallet.send.form.calculatingFee',
        defaultMessage: '!!!Calculating fee...',
    },
})
export default class SingleTokenRow extends Component<Props> {

  static contextTypes: {|intl: $npm$ReactIntl$IntlFormat|} = {
    intl: intlShape.isRequired,
  };

  getNumDecimals(): number {
    return this.props.token.info.Metadata.numberOfDecimals;
  }

  getTokenEntry: MultiToken => TokenEntry = (tokens) => {
    return this.props.selectedToken == null
      ? tokens.getDefaultEntry()
      : tokens.values.find(
        entry => entry.identifier === this.props.selectedToken?.Identifier
      ) ?? tokens.getDefaultEntry();
  }

  render(): Node {
    const { token } = this.props

    let transactionFeeError = null;
    if (this.props.isCalculatingFee) {
      transactionFeeError = this.context.intl.formatMessage(messages.calculatingFee);
    }
    if (this.props.error) {
      transactionFeeError = this.context.intl.formatMessage(
        this.props.error,
        this.props.error.values
      );
    }



    const amountInputError = transactionFeeError
    return (
      <div className={styles.component}>
        {!this.props.isTokenIncluded(token.info) ? (
          <button type='button' className={styles.token} onClick={() => this.props.onAddToken(token.info)}>
            <div className={styles.name}>
              <div className={styles.logo}><NoAssetLogo /></div>
              <p className={styles.label}>{token.label}</p>
            </div>
            <p className={styles.id}>{truncateAddressShort(token.id, 14)}</p>
            <p className={styles.amount}>{token.amount}</p>
          </button>
        ): (
          <div className={styles.amountWrapper}>
            <div className={styles.amountTokenName}>
              <div className={styles.logo}><NoAssetLogo /></div>
              <p className={styles.label}>{token.label}</p>
            </div>
            <div className={styles.amountInput}>
              <AmountInputRevamp
                value={this.props.getTokenAmount(token.info)}
                onChange={value => {
                  const amount = new BigNumber(value)
                  this.props.updateAmount(amount)
                }}
                onFocus={() => this.props.onAddToken(token.info)}
                amountFieldRevamp
              />

            </div>
            <button type='button' onClick={() => this.props.onRemoveToken(token.info)} className={styles.close}> <CloseIcon /> </button>
            <p className={styles.error}>
              {token.info.Identifier === this.props.selectedToken?.Identifier && amountInputError}
            </p>
          </div>
           )}
      </div>
    )
  }
}