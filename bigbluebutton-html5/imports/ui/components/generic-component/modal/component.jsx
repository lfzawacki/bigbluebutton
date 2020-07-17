import React, { Component } from 'react';
import { withModalMounter } from '/imports/ui/components/modal/service';
import Modal from '/imports/ui/components/modal/simple/component';
import Button from '/imports/ui/components/button/component';

import { defineMessages, injectIntl } from 'react-intl';

import { styles } from './styles';

const isUrlValid = (url, regex) => {
  return url && url.match(regex);
}

const intlMessages = defineMessages({
  start: {
    id: 'app.genericComponent.start',
  },
  urlError: {
    id: 'app.genericComponent.urlError',
  },
  input: {
    id: 'app.genericComponent.input',
  },
  urlInput: {
    id: 'app.genericComponent.urlInput',
  },
  title: {
    id: 'app.genericComponent.title',
  },
  close: {
    id: 'app.genericComponent.close',
  },
});

class GenericComponentModal extends Component {
  constructor(props) {
    super(props);

    const { url } = props;

    this.state = {
      url,
    };

    this.startSharingHandler = this.startSharingHandler.bind(this);
    this.updateUrlHandler = this.updateUrlHandler.bind(this);
    this.renderUrlError = this.renderUrlError.bind(this);
  }

  startSharingHandler() {
    const {
      startGenericComponent,
      name,
      closeModal,
    } = this.props;

    const { url } = this.state;

    startGenericComponent(name, url.trim());
    closeModal();
  }

  updateUrlHandler(ev) {
    this.setState({ url: ev.target.value });
  }

  renderUrlError() {
    const { intl, regex } = this.props;
    const { url } = this.state;

    const valid = (!url || url.length <= 3) || isUrlValid(url, regex);

    return (
      !valid
        ? (
          <div className={styles.urlError}>
            {intl.formatMessage(intlMessages.urlError)}
          </div>
        )
        : null
    );
  }

  render() {
    const { intl, closeModal, regex } = this.props;
    const { url, sharing } = this.state;

    const startDisabled = !isUrlValid(url, regex);

    return (
      <Modal
        overlayClassName={styles.overlay}
        className={styles.modal}
        onRequestClose={closeModal}
        contentLabel={intl.formatMessage(intlMessages.title)}
        hideBorder
      >
        <header data-test="modalHeader" className={styles.header}>
          <h3 className={styles.title}>{intl.formatMessage(intlMessages.title)}</h3>
        </header>

        <div className={styles.content}>
          <div className={styles.url}>
            <label htmlFor="modal-input" id="modal-input">
              {intl.formatMessage(intlMessages.input)}
              <input
                id="modal-input"
                onChange={this.updateUrlHandler}
                name="modal-input"
                placeholder={intl.formatMessage(intlMessages.urlInput)}
                disabled={sharing}
                aria-describedby="modal-note"
              />
            </label>
          </div>

          <div>
            {this.renderUrlError()}
          </div>

          <Button
            className={styles.startBtn}
            label={intl.formatMessage(intlMessages.start)}
            onClick={this.startSharingHandler}
            disabled={startDisabled}
          />
        </div>
      </Modal>
    );
  }
}

export default injectIntl(withModalMounter(GenericComponentModal));
