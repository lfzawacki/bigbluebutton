import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { createContainer } from 'meteor/react-meteor-data';
import VideoWindow from './component.jsx';
import { shareWebCam } from './service.js';

class VideoWindowContainer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <VideoWindow {...this.props}>
        {this.props.children}
      </VideoWindow>
    );
  }
}

export default injectIntl(createContainer(({ params, intl }) => {

  return {
    actions: {
      handleShareWebcam: message => {

        shareWebcam(message.videoId, () => {
          Meteor.call('userShareWebcam', message);
        });

      },

      handleUnshareWebcam: messaged => {
      }
    },
  };
}, VideoWindowContainer));
