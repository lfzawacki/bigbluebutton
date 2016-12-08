import Video from '/imports/api/video';
import Users from '/imports/api/users';
import Meetings from '/imports/api/meetings';
import kurentoUtils from 'kurento-utils';

import Auth from '/imports/ui/services/auth';

import { callServer } from '/imports/ui/services/api';

export default shareWebcam = (id, callback) => {

  let video = new HTML5Video(id);

  video.start(callback);
}

const shareWebcamResponse = (message, video) => {

  console.log('SDP answer received from server. Processing ...');

  video.webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
    if (error) {
      return console.error(error);
    }
  });

};


const startWebcam = (userId) => {

}

class HTML5Video {

  constructor(id) {
    this.id = id;
    this.video = document.getElementById(id);

    this.webRtcPeer = null;
  }

  start(callback) {

    console.log('Creating WebRtcPeer and generating local sdp offer ...');

    let userMediaConstraints = {
      audio : true,
      video : true
    };

    let options = {
      remoteVideo : this.video,
      mediaConstraints : userMediaConstraints,
      onicecandidate : this.onIceCandidate
    };

    console.info('User media constraints' + userMediaConstraints);

    this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, (error) => {
      if (error) {
        return console.error(error);
      }

      this.webRtcPeer.generateOffer(this.onOffer);
    });

  }

  onOffer(error, offerSdp) {
    if (error) {
      return console.error('Error generating the offer');
    }

    console.info('Invoking SDP offer callback function ' + location.host);

    let message = {
      offerSdp,
      id: this.id
    }

    // Callback the server sending id and sdpOffer
    callServer('userShareWebcam', message, (error, result) => {
      console.log('Something happened');

      console.log(result);
      console.log(error);
    });
  };

  onIceCandidate(candidate) {

    var message = {
      candidate,
      id: this.id
    };

    callServer('userOnIceCandidate', message, (error, _candidate) =>{

      if (!error && _candidate) {
        onIceCandidate(_candidate);
      }

    });
  };

  setFullscreen() {

    // if (video.requestFullscreen) {
    //   video.requestFullscreen();
    // } else if (video.mozRequestFullScreen) {
    //   video.mozRequestFullScreen();
    // } else if (video.webkitRequestFullscreen) {
    //   video.webkitRequestFullscreen();
    // }
  };

  // this.id = id;
  // this.url = url;

  // obj.playEnd = playEnd;
  // obj.showError = showError;
  // obj.showSpinner = showSpinner;
}
