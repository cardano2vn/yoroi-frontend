// @flow
import type { Node } from 'react';
import { Component } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import { intlShape, defineMessages } from 'react-intl';
import { buildURI } from '../../utils/URIHandling';
import Dialog from '../widgets/Dialog';
import DialogBackButton from '../widgets/DialogBackButton';
import DialogCloseButton from '../widgets/DialogCloseButton';
import QrCodeWrapper from '../widgets/QrCodeWrapper';
import WarningBox from '../widgets/WarningBox';
import CopyableAddress from '../widgets/CopyableAddress';
import type { Notification } from '../../types/notificationType';
import type { $npm$ReactIntl$IntlFormat } from 'react-intl';
import BigNumber from 'bignumber.js';

import styles from './URIDisplayDialog.scss';

const messages = defineMessages({
  uriDisplayDialogTitle: {
    id: 'uri.display.dialog.title',
    defaultMessage: '!!!Generated URL',
  },
  uriDisplayDialogCopyNotification: {
    id: 'uri.display.dialog.copy.notification',
    defaultMessage: '!!!URL successfully copied',
  },
  usabilityWarning: {
    id: 'uri.display.dialog.usabilityWarning',
    defaultMessage: '!!!This link can only be opened by users with Yoroi installed on their browser',
  }
});

type Props = {|
  +onClose: void => void,
  +notification: ?Notification,
  +onCopyAddressTooltip: string => void,
  +onBack: void => void,
  +address: string,
  +amount: BigNumber,
|};

@observer
export default class URIDisplayDialog extends Component<Props> {

  static contextTypes: {|intl: $npm$ReactIntl$IntlFormat|} = {
    intl: intlShape.isRequired,
  };

  render(): Node {
    const {
      onClose,
      onBack,
      notification,
      onCopyAddressTooltip,
      address,
      amount,
    } = this.props;

    const { intl } = this.context;

    const uri = buildURI(address, amount);
    const uriNotificationId = 'uri-copyNotification';

    const uriUsabilityWarning = (
      <WarningBox>
        {intl.formatMessage(messages.usabilityWarning)}
      </WarningBox>
    );

    return (
      <Dialog
        title={intl.formatMessage(messages.uriDisplayDialogTitle)}
        className={classnames([styles.component, 'URIDisplayDialog'])}
        closeOnOverlayClick={false}
        closeButton={<DialogCloseButton />}
        onClose={onClose}
        backButton={<DialogBackButton onBack={onBack} />}
      >
        {uriUsabilityWarning}
        <div className={styles.qrCode}>
          <QrCodeWrapper
            value={uri}
            size={152}
          />
        </div>
        <div className={styles.uriDisplay}>
          <CopyableAddress
            hash={uri}
            elementId={uriNotificationId}
            onCopyAddress={() => onCopyAddressTooltip(uriNotificationId)}
            notification={notification}
            placementTooltip="bottom-start"
          >
            <span className={styles.uri}>{uri}</span>
          </CopyableAddress>
        </div>
      </Dialog>

    );
  }

}
