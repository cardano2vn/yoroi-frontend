// @flow
import { Component } from 'react';
import type { Node } from 'react';
import { observer } from 'mobx-react';
import styles from './FlagLabel.scss';

type Props = {|
  +svg: string,
  +label: string,
|};

@observer
export default class FlagLabel extends Component<Props> {

  render(): Node {
    const { svg, label, } = this.props;
    const SvgElem = svg;
    return (

      <div className={styles.wrapper}>
        <span className={styles.flag}><SvgElem /></span>
        <span>{label}</span>
      </div>
    );
  }
}
