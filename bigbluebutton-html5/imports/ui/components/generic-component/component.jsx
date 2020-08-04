import React, { Component } from 'react';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import logger from '/imports/startup/client/logger';

const intlMessages = defineMessages({
});

class GenericComponent extends Component {
  constructor(props) {
    super(props);

    const { isPresenter } = props;

    this.state = {

    };

    this.handleResize = this.handleResize.bind(this);
    this.handleOnReady = this.handleOnReady.bind(this);
    this.resizeListener = () => {
      setTimeout(this.handleResize, 0);
    };
    this.onBeforeUnload = this.onBeforeUnload.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  componentDidUpdate(prevProp, prevState) {
    // Detect presenter change and redo the share to switch the presenter
    if (!this.props.isPresenter && prevProp.isPresenter) {
      const { startGenericComponent, stopGenericComponent, url, name } = this.props;
      stopGenericComponent();
      startGenericComponent(name, url);
    }
  }

  onBeforeUnload() {
    const { isPresenter } = this.props;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { isPresenter } = this.props;

    return true;
  }

  handleResize() {
    if (!this.player || !this.playerParent) {
      return;
    }

    const par = this.playerParent.parentElement;
    const w = par.clientWidth;
    const h = par.clientHeight;
    const idealW = h * 16 / 9;

    const style = {};
    if (idealW > w) {
      style.width = w;
      style.height = w * 9 / 16;
    } else {
      style.width = idealW;
      style.height = h;
    }

    const styleStr = `width: ${style.width}px; height: ${style.height}px;`;
    this.player.wrapper.style = styleStr;
    this.playerParent.style = styleStr;
  }

  handleOnReady() {
    // window.postMessage loaded

    // subscribe to onResults

    console.log('Handle ready');
  }

  addParamsToUrl(url, params) {
    // 
    const u = new URL(url);
    const us = u.searchParams;
    for (let k in params) {
      us.append(k, params[k]);
    }

    return u.toString();
  }

  render() {
    const { url } = this.props;
    const style = {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: 'black'
    }
    const { meetingID, userName, isPresenter, } = this.props;

    const params = { meetingID, userName };
    if (isPresenter) {
      params.isPresenter = true;
    }

    return (
      <div
        id="generic-component"
        ref={(ref) => { this.playerParent = ref; }}
        style={style}
      >
        <iframe
          src={this.addParamsToUrl(url, params)}
          onReady={this.handleOnReady}
          allowFullScreen={true}
          frameBorder="0"
          scrolling="0"
          width="100%"
          height="100%"
          ref={(ref) => { this.iframe = ref; }}
        />
      </div>
    );
  }
}

export default injectIntl(injectWbResizeEvent(GenericComponent));
