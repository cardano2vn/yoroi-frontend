// @flow
import { Component } from 'react';
import type { Node } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import styles from './BigButtonForDialogs.scss';

type Props = {|
  +label: string,
  +description: string,
  +onClick: void => void,
  +isDisabled: boolean,
  +className: string,
|};

@observer
export default class BigButtonForDialogs extends Component<Props> {

  render(): Node {
    const { label, description, onClick, isDisabled = false, className } = this.props;
    const componentClasses = classnames([
      className,
      styles.component,
      isDisabled ? styles.disabled : null
    ]);
    return (
      <button
        type="button"
        className={componentClasses}
        onClick={onClick}
        disabled={isDisabled}
      >
        <div className={styles.label}>{label}</div>
        <div className={styles.description}>{description}</div>
      </button>
    );
  }
}
