// @flow
import { Component } from 'react';
import type { Node } from 'react';
import { observer } from 'mobx-react';
import styles from './LoadingGif.scss';

function getBgUrl(el) {
  let bg = '';
  // $FlowExpectedError[prop-missing] flow doesn't work that well for HTML access
  if (el.currentStyle != null) { // IE
    // $FlowExpectedError[incompatible-use] flow doesn't work that well for HTML access
    bg = el.currentStyle.backgroundImage;
  } else if (document.defaultView && document.defaultView.getComputedStyle) { // Firefox
    bg = document.defaultView.getComputedStyle(el, '').backgroundImage;
  } else { // try and get inline style
    bg = el.style.backgroundImage;
  }
  return bg.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
}

type State = {|
  isLoaded: boolean,
  image: HTMLImageElement,
|};

@observer
export default class LoadingGif extends Component<{||}, State> {
  state: State = {
    isLoaded: false,
    image: document.createElement('img'),
  };

  componentDidMount(): void {
    const loadingImg = getBgUrl(document.getElementsByClassName(styles.component)[0]);
    this.setState(prevState => {
      prevState.image.src = loadingImg;
      prevState.image.onload = () => {
        this.setState({ isLoaded: true, });
      };
      return prevState;
    });
  }

  componentWillUnmount(): void {
    this.setState(prevState => {
      prevState.image.onload = null;
    });
  }

  render(): Node {
    return (
      <div className={styles.component}>
        {!this.state.isLoaded && <div className={styles.spinner} />}
      </div>
    );
  }
}
