var isFirefox = typeof window.InstallTrigger !== 'undefined';
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !isOpera;
var kurentoHandler = null;

Kurento = function (
    tag,
    voiceBridge,
    conferenceUsername,
    internalMeetingId,
    onFail = null,
    chromeExtension = null
    ) {

  this.ws = null; // Meteor.settings.public.kurento.wsUrl)
  this.video;
  this.screen;
  this.webRtcPeer;
  this.extensionInstalled = false;
  this.screenConstraints = {};
  this.mediaCallback = null;

  this.voiceBridge = voiceBridge + '-SCREENSHARE';
  this.internalMeetingId = internalMeetingId;

  this.vid_width = window.screen.width;
  this.vid_height = window.screen.height;

  // TODO properly generate a uuid
  this.sessid = Math.random().toString();

  this.renderTag = 'remote-media';

  this.caller_id_name = conferenceUsername;
  this.caller_id_number = conferenceUsername;
  this.pingInterval;

  this.kurentoPort = "kurento-screenshare";
  this.hostName = window.location.hostname;
  this.socketUrl = 'wss://' + this.hostName + '/' + this.kurentoPort;

  this.iceServers = null;

  if (chromeExtension != null) {
    this.chromeExtension = chromeExtension;
  }

  if (onFail != null) {
    this.onFail = Kurento.normalizeCallback(onFail);
  } else {
    var _this = this;
    this.onFail = function () {
      _this.logError('Default error handler');
    };
  }
};

this.KurentoManager= function () {
  this.kurentoVideo = null;
  this.kurentoScreenShare = null;
};

Kurento.prototype.sendMessage = function(message) {
  var jsonMessage = JSON.stringify(message);
  console.log('Sending message: ' + jsonMessage);
  this.ws.send(jsonMessage);
}

Kurento.prototype.logger = function (obj) {
  console.log(obj);
};

Kurento.prototype.logError = function (obj) {
  console.error(obj);
};

KurentoManager.prototype.exitVideo = function () {
  // TODO exitVideo
};

KurentoManager.prototype.joinWatchVideo = function (tag) {
  this.exitVideo();
  var obj = Object.create(Kurento.prototype);
  Kurento.apply(obj, arguments);
  this.kurentoVideo = obj;
  kurentoHandler = obj;
  this.kurentoVideo.setWatchVideo(tag);
};

Kurento.prototype.create = function (tag) {
  this.setRenderTag(tag);
  this.iceServers = true;
  this.init();
};

Kurento.prototype.init = function () {
  var self = this;
  if("WebSocket" in window) {
    console.log("this browser supports websockets");
    this.ws = new ReconnectingWebSocket(this.socketUrl);

    this.ws.onmessage = this.onWSMessage;
    this.ws.onclose = function (close) {
      kurentoManager.exitScreenShare();
      self.onFail("Websocket connection closed");
    };
    this.ws.onerror = function (error) {
      kurentoManager.exitScreenShare();
      self.onFail("Websocket connection error");
    };
    this.ws.onopen = function() {
      self.mediaCallback();
    };
  }
  else
    console.log("this browser does not support websockets");
};

Kurento.prototype.onWSMessage = function (message) {
  var parsedMessage = JSON.parse(message.data);
  switch (parsedMessage.id) {

    case 'presenterResponse':
      kurentoHandler.presenterResponse(parsedMessage);
      break;
    case 'viewerResponse':
      kurentoHandler.viewerResponse(parsedMessage);
      break;
    case 'stopSharing':
      kurentoManager.exitScreenShare();
      break;
    case 'iceCandidate':
      kurentoHandler.webRtcPeer.addIceCandidate(parsedMessage.candidate);
      break;
    case 'pong':
      break;
    default:
      console.error('Unrecognized message', parsedMessage);
  }
};

Kurento.prototype.setRenderTag = function (tag) {
  this.renderTag = tag;
};

Kurento.prototype.presenterResponse = function (message) {
  if (message.response != 'accepted') {
    var errorMsg = message.message ? message.message : 'Unknow error';
    console.warn('Call not accepted for the following reason: ' + errorMsg);
    kurentoManager.exitScreenShare();
    kurentoHandler.onFail(errorMessage);
  } else {
    console.log("Presenter call was accepted with SDP => " + message.sdpAnswer);
    this.webRtcPeer.processAnswer(message.sdpAnswer);
  }
}

Kurento.prototype.viewerResponse = function (message) {
  if (message.response != 'accepted') {
    var errorMsg = message.message ? message.message : 'Unknown error';
    console.warn('Call not accepted for the following reason: ' + errorMsg);
    //kurentoManager.exitScreenShare(); TODO stop?
    kurentoHandler.onFail(errorMessage);
  } else {
    console.log("Viewer call was accepted with SDP => " + message.sdpAnswer);
    this.webRtcPeer.processAnswer(message.sdpAnswer);
  }
}

Kurento.prototype.serverResponse = function (message) {
  if (message.response != 'accepted') {
    var errorMsg = message.message ? message.message : 'Unknow error';
    console.warn('Call not accepted for the following reason: ' + errorMsg);
    kurentoHandler.dispose();
  } else {
    this.webRtcPeer.processAnswer(message.sdpAnswer);
  }
}

Kurento.prototype.makeShare = function() {
  var self = this;
  console.log("Kurento.prototype.makeShare " + JSON.stringify(this.webRtcPeer, null, 2));
  if (!this.webRtcPeer) {

    var options = {
      onicecandidate : this.onIceCandidate
    }

    console.log("Peer options " + JSON.stringify(options, null, 2));

    kurentoHandler.startScreenStreamFrom();

  }
}

Kurento.prototype.onIceCandidate = function(candidate) {
  console.log('Local candidate' + JSON.stringify(candidate));

  var message = {
    id : 'onIceCandidate',
    type: 'screenshare',
    role: 'presenter',
    voiceBridge: kurentoHandler.voiceBridge,
    candidate : candidate
  }
  console.log("this object " + JSON.stringify(this, null, 2));
  kurentoHandler.sendMessage(message);
}

Kurento.prototype.onViewerIceCandidate = function(candidate) {
  console.log('Viewer local candidate' + JSON.stringify(candidate));

  var message = {
    id : 'viewerIceCandidate',
    type: 'screenshare',
    role: 'viewer',
    voiceBridge: kurentoHandler.voiceBridge,
    candidate : candidate,
    callerName: kurentoHandler.caller_id_name
  }
  console.log("this object " + JSON.stringify(this, null, 2));
  kurentoHandler.sendMessage(message);
}

Kurento.prototype.setWatchVideo = function (tag) {
  this.useVideo = true;
  this.useCamera = 'none';
  this.useMic = 'none';
  this.mediaCallback = this.viewer;
  this.create(tag);
};

Kurento.prototype.viewer = function () {
  var self = this;
  if (!this.webRtcPeer) {

    var options = {
      remoteVideo: document.getElementById(this.renderTag),
      onicecandidate : this.onViewerIceCandidate
    }

    self.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
      if(error) {
        return kurentoHandler.onFail(error);
      }

      this.generateOffer(self.onOfferViewer);
    });
  }
};


Kurento.prototype.dispose = function() {
  if (this.webRtcPeer) {
    this.webRtcPeer.dispose();
    this.webRtcPeer = null;
  }
}

Kurento.prototype.getChromeScreenConstraints = function(callback, extensionId) {
  chrome.runtime.sendMessage(extensionId, {
    getStream: true,
    sources: [
      "window",
      "screen",
      "tab"
    ]},
    function(response) {
      console.log(response);
      callback(response);
    });
};

Kurento.normalizeCallback = function (callback) {
  if (typeof callback == 'function') {
    return callback;
  } else {
    console.log(document.getElementById('BigBlueButton')[callback]);
    return function (args) {
      document.getElementById('BigBlueButton')[callback](args);
    };
  }
};

/* Global methods */

// this function explains how to use above methods/objects
window.getScreenConstraints = function(sendSource, callback) {
  var _this = this;
  var chromeMediaSourceId = sendSource;
  if(isChrome) {
    kurentoHandler.getChromeScreenConstraints (function (constraints) {

      var sourceId = constraints.streamId;

      // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
      kurentoHandler.screenConstraints.video.chromeMediaSource = { exact: [sendSource]};
      kurentoHandler.screenConstraints.video.chromeMediaSourceId= sourceId;
      console.log("getScreenConstraints for Chrome returns => " +JSON.stringify(kurentoHandler.screenConstraints, null, 2));
      // now invoking native getUserMedia API
      callback(null, kurentoHandler.screenConstraints);

    }, kurentoHandler.chromeExtension);
  }
  else if (isFirefox) {
    kurentoHandler.screenConstraints.video.mediaSource= "screen";
    kurentoHandler.screenConstraints.video.width= {max: kurentoHandler.vid_width};
    kurentoHandler.screenConstraints.video.height = {max:  kurentoHandler.vid_height};

    console.log("getScreenConstraints for Firefox returns => " +JSON.stringify(kurentoHandler.screenConstraints, null, 2));
    // now invoking native getUserMedia API
    callback(null, kurentoHandler.screenConstraints);
  }
}

window.kurentoInitialize = function () {
  if (window.kurentoManager == null || window.KurentoManager == undefined) {
    window.kurentoManager = new KurentoManager();
  }
};

window.kurentoWatchVideo = function () {
  window.kurentoInitialize();
  window.kurentoManager.joinWatchVideo.apply(window.kurentoManager, arguments);
};

window.kurentoExitVideo = function () {
  // TODO kurentoExitVideo()
}

Kurento.prototype.onOfferHandler(message) {
  return function(error, sdpOffer) {
    if(error)  {
      console.log("Kurento.prototype.onOffer" + message.type + " Error " + error);
      kurentoHandler.onFail(error);
      return;
    }

    console.log("onOffer" + message.type + " sending to screenshare server => " + JSON.stringify(message, null, 2));
    kurentoHandler.sendMessage(message);
  };
}


// ---- Video

window.kurentoShareVideo = function() {
  window.kurentoInitialize();
  window.kurentoManager.shareVideo.apply(window.kurentoManager, arguments);
}

KurentoVideo = {
  prototype: Kurento
}

KurentoVideo.prototype.sendMessage = function(message) {
  const ws = this.ws;

  // For the new MCS API, type of stream and user role
  message.type = 'video';
  message.role = 'user';

  const jsonMessage = JSON.stringify(message);
  console.log("Sending VIDEO message:");
  console.log(jsonMessage);
  ws.send(jsonMessage, (error) => {
    if (error) {
      console.error(`client: Websocket error "${error}" on message "${jsonMessage.id}"`);
    }
  });
}

KurentoVideo.prototype.start = function (id, share, tag, responseCallback) {
  this.responseCallback = responseCallback;

    const self = this;

    const ws = this.state.ws;

    console.log(`Starting video call for video: ${id}`);
    console.log('Creating WebRtcPeer and generating local sdp offer ...');

    const onIceCandidate = function (candidate) {
      const message = {
        id: 'onIceCandidate',
        candidate,
        cameraId: id,
      };
      self.sendMessage(message);
    };

    const options = {
      mediaConstraints: { audio: false, video: true },
      onicecandidate: onIceCandidate,
    };

    let peerObj;
    if (shareWebcam) {
      options.localVideo = tag;
      peerObj = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly;
    } else {
      peerObj = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly;

      options.remoteVideo = tag;
      document.getElementById('webcamArea').appendChild(options.remoteVideo);
    }

    this.webRtcPeer = new peerObj(options, function (error) {
      if (error) {
        console.error(' [ERROR] Webrtc error');
        return;
      }

      this.generateOffer((error, offerSdp) => {
        if (error) {
          return console.error(error);
        }

        console.info(`Invoking SDP offer callback function ${location.host}`);
        const message = {
          id: 'start',
          sdpOffer: offerSdp,
          cameraId: id,
          cameraShared: shareWebcam,
        };
        self.sendMessage(message);
      });
    });
  }
};

KurentoVideo.prototype.startResponse = function() {

  const id = message.cameraId;
  const webRtcPeer = this.webRtcPeers;
  const cb = this.responseCallback;

  if (message.sdpAnswer == null) {
    return console.debug('Null sdp answer. Camera unplugged?');
  }

  if (webRtcPeer == null) {
    return console.debug('Null webrtc peer ????');
  }

  console.log('SDP answer received from server. Processing ...');

  webRtcPeer.processAnswer(message.sdpAnswer, (error) => {
    if (error) {
      console.error(error);
    } else {
      cb(error);
    }
  });

};

KurentoVideo.prototype.init = function() {

  this.ws.addEventListener('message', (msg) => {
    const parsedMessage = JSON.parse(msg.data);

    console.debug('Received message new ws message: ');
    console.debug(parsedMessage);

    switch (parsedMessage.id) {

      case 'startResponse':
        this.startResponse(parsedMessage);
        break;

      case 'error':
        this.handleError(parsedMessage);
        break;

      case 'playStart':
        this.handlePlayStart(parsedMessage);
        break;

      case 'playStop':
        this.handlePlayStop(parsedMessage);

        break;

      case 'iceCandidate':

        const webRtcPeer = this.webRtcPeer[parsedMessage.cameraId];

        if (webRtcPeer !== null) {
          webRtcPeer.addIceCandidate(parsedMessage.candidate, (err) => {
            if (err) {
              return console.error(`Error adding candidate: ${err}`);
            }
          });
        } else {
          console.error(' [ICE] Message arrived before webRtcPeer?');
        }

        break;
    }
  });
}


// ---- Screen
Kurento.prototype.onOfferViewer = Kurento.prototype.onOfferHandler({
  id : 'viewer',
  type: 'screenshare',
  internalMeetingId: kurentoHandler.internalMeetingId,
  voiceBridge: kurentoHandler.voiceBridge,
  callerName : kurentoHandler.caller_id_name,
  sdpOffer : offerSdp
};);

Kurento.prototype.onOfferPresenter = Kurento.prototype.onOfferHandler({
  id : 'presenter',
  type: 'screenshare',
  internalMeetingId: kurentoHandler.internalMeetingId,
  voiceBridge: kurentoHandler.voiceBridge,
  callerName : kurentoHandler.caller_id_name,
  sdpOffer : offerSdp,
  vh: kurentoHandler.vid_height,
  vw: kurentoHandler.vid_width
};);

Kurento.prototype.startScreenStreamFrom = function () {
  var screenInfo = null;
  var _this = this;
  if (!!window.chrome) {
    if (!_this.chromeExtension) {
      _this.logError({
        status:  'failed',
        message: 'Missing Chrome Extension key',
      });
      _this.onFail();
      return;
    }
  }
  // TODO it would be nice to check those constraints
  _this.screenConstraints.video = {};

  var options = {
    //localVideo: this.renderTag,
    onicecandidate : _this.onIceCandidate,
    mediaConstraints : _this.screenConstraints,
    sendSource : 'desktop'
  };

  console.log(" Peer options => " + JSON.stringify(options, null, 2));

  _this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
    if(error)  {
      console.log("WebRtcPeerSendonly constructor error " + JSON.stringify(error, null, 2));
      kurentoHandler.onFail(error);
      return kurentoManager.exitScreenShare();
    }

    _this.webRtcPeer.generateOffer(_this.onOfferPresenter);
    console.log("Generated peer offer w/ options "  + JSON.stringify(options));
  });
}

Kurento.prototype.stop = function() {
  if (this.webRtcPeer) {
    var message = {
      id : 'stop',
      type : 'screenshare',
      voiceBridge: kurentoHandler.voiceBridge
    }
    kurentoHandler.sendMessage(message);
    kurentoHandler.disposeScreenShare();
  }
}

Kurento.prototype.disposeScreenShare = function() {
  if (this.webRtcPeer) {
    this.webRtcPeer.dispose();
    this.webRtcPeer = null;
  }
}

KurentoManager.prototype.exitScreenShare = function () {
  if (this.kurentoScreenShare != null) {
    if(kurentoHandler.pingInterval) {
      clearInterval(kurentoHandler.pingInterval);
    }
    if(kurentoHandler.ws !== null) {
      kurentoHandler.ws.onclose = function(){};
      kurentoHandler.ws.close();
    }
    kurentoHandler.disposeScreenShare();
    this.kurentoScreenShare = null;
    kurentoHandler = null;
  }
};

Kurento.prototype.setScreenShare = function (tag) {
  this.mediaCallback = this.makeShare;
  this.create(tag);
};

KurentoManager.prototype.shareScreen = function (tag) {
  this.exitScreenShare();
  var obj = Object.create(Kurento.prototype);
  Kurento.apply(obj, arguments);
  this.kurentoScreenShare = obj;
  kurentoHandler = obj;
  this.kurentoScreenShare.setScreenShare(tag);
};

window.kurentoShareScreen = function() {
  window.kurentoInitialize();
  window.kurentoManager.shareScreen.apply(window.kurentoManager, arguments);
};

window.kurentoExitScreenShare = function () {
  window.kurentoInitialize();
  window.kurentoManager.exitScreenShare();
};
