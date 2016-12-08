import kurento from 'kurento-client';
import Logger from './logger';
import { Meteor } from 'meteor/meteor';
import { EventEmitter2 } from 'eventemitter2';
import h264_sdp from './h264_sdp';

class KurentoClient {
  constructor(config = {}) {
    this.config = config;
    this.kurentoClient = null;
    this.playerEndpoints = {};
    this.mediaPipelines = {};
    this.kurentoIpAddress = null;
  }

  init(config = {}, callback = null) {
    let wsUri = this.config.wsUri;

    this.kurentoIpAddress = this.config.host;

    let clientCallback = (err, _kurentoClient) => {

      if (err) {
        Logger.info(`Could not find media server at address '${wsUri}'`);
        return Meteor.bindEnvironment(callback)("Could not find media server at address " + ws_uri + ". Exiting with error " + err);
      }

      this.kurentoClient = _kurentoClient;

      // TODO: Potentially start bridge to Flash video here

      if (callback) {
        Meteor.bindEnvironment(callback)(false);
      }
    }
    kurento(wsUri, Meteor.bindEnvironment(clientCallback));
  }

  // Proxy for kurentoClient create method
  create() {
    return this.kurentoClient(...arguments);
  }

  createCandidate(_candidate) {
    return kurento.register.complexTypes.IceCandidate(_candidate);
  }

  createVideo(videoId) {
    return new KurentoVideoHTML5(videoId);
  }

  updateConfig(config) {
    this.config = Object.assign({}, this.config, config);
  }

  on(event, listener) {
  }

};

// Class specific for sending and receiving video using WebRTC
class KurentoVideoHTML5 {

  constructor(client, videoId, videoObj) {
    this.client = client;
    this.videoId = videoId;
    this.videoObj = videoObj;

    this.pipeline = null;
    this.webrtcEndpoint = null;
    this.candidatesQueue = [];
  }

  getMediaPipeline(callback) {

    Logger.info(' [video] Media pipeline for ' + this.videoId);

    if (this.client.mediaPipelines.hasOwnProperty(this.videoId)) {
      Logger.info(' [video] Pipeline already created.');

      this.pipeline = this.client.mediaPipelines[this.videoId];

      return callback(null, this.pipeline);
    }

    // Actually create a new pipeline
    let pipelineCallback = (err, _pipeline) => {
      Logger.info(' [video] Create new pipeline.');

      if (err) {
        callback(err);
      }

      // Store it
      this.pipeline = _pipeline;
      this.client.mediaPipelines[videoId] = _pipeline;

      callback(null, _pipeline);
    };

    this.client.create('MediaPipeline', Meteor.bindEnvironment(pipelineCallback));
  }

  createWebRtcEndpoint(callback) {
    let webRtcCallback = (err, _webRtcEndpoint) => {
      if (err) {
        return callback(err);
      }

      // We got it, store the endpoint
      this.webRtcEndpoint = _webRtcEndpoint;

      Logger.info(' [webrtc] Creating a new webrtc enpoint for ' + this.videoId);

      return callback(null);
    };

    this.pipeline.create('WebRtcEndpoint', Meteor.bindEnvironment(webRtcCallback));
  }

  createMediaElements(callback) {

    function onEndOfStream() {
    };

    Logger.info(' [media] Creating a new player endpoint for ' + this.videoId);
    createWebRtcEndpoint(callback);
  }

  connectMediaElements(callback) {
    let connectCallback = (err) => {
      if (err) {
         return callback(err);
      }

      return callback(null);
    };
    this.webRtcEndpoint.connect(webRtcEndpoint, Meteor.bindEnvironment(connectCallback));
  }

  addCandidatesFromQueue() {
    if (this.candidatesQueue) {
      while(this.candidatesQueue.length) {
        let candidate = candidatesQueue.shift();
        this.webRtcEndpoint.addIceCandidate(candidate);
      }
    }
  }

  startWebRtc(sdpOffer, callback) {

    let getMediaCallback = (err, pipeline) => {

      if (err) {
        return callback(err);
      }

      let createMediaCallback = (err) => {

        if (err) {
          if (pipeline) {
            pipeline.release();
            pipeline = null;
          }
          return callback(err);
        }

        addCandidatesFromQueue();

        let connectMediaCallback = (err) => {
          if (err) {
            return callback(err);
          }

          hookWebRtcEvents();

          // Force H264 on Firefox and Chrome
          sdpOffer = h264_sdp.transform(sdpOffer);

          let proccessOfferCallback = (err, sdpAnswer) => {
            if (err) {
              return callback(err);
            }

            let gatherCandidateCallback = (err) => {
              if (err) {
                return callback(err);
              }

              return callback(null, sdpAnswer);
            }

            this.webRtcEndpoint.gatherCandidates(Meteor.bindEnvironment(gatherCandidateCallback));
          }

          this.webRtcEndpoint.processOffer(sdpOffer, Meteor.bindEnvironment(processOfferCallback));
        }

        connectMediaElements(Meteor.bindEnvironment(connectMediaCallback));
      }

      createMediaElements(Meteor.bindEnvironment(createMediaCallback));
    }

    getMediaPipeline(Meteor.bindEnvironment(getMediaCallback));
  }

  start(sdpOffer, iceCallback) {
    let startWebRtcCallback = (err, sdpAnswer) => {

      if (err) {
        Logger.error('Start error');
      }

      return sdpAnswer; // return first ice;
    }

    startWebRtc(sdpOffer, Meteor.bindEnvironment(iceCallback), Meteor.bindEnvironment(startWebRtcCallback));
  }

  hookWebRtcEvents() {

    let onIceCallback = (event) => {
      var candidate = this.client.createCandidate(event.candidate);
      iceCallback(ice);
    };

    // Potentially hook stuff here to manage connection status
    let mediaStateChangedCallback = (event) => {
      Logger.info('  [webrtc] MediaStateChanged from [' + event.oldState + ']' + ' to [' + event.newState + '], mediaSourceId = ' + videoId);

      if (event.newState === 'CONNECTED') {
        Logger.info('  [webrtc] Media source with id ' + videoId + ' STARTED sending video');

        // Set video status 'playStart'
      } else {
        Logger.info('  [webrtc] Media source with id ' + videoId + ' STOPPED sending video');

        // Set video status 'playStop'
      }
    };

    this.webRtcEndpoint.on('OnIceCandidate', Meteor.bindEnvironment(onIceCallback));

    this.webRtcEndpoint.on('MediaStateChanged', Meteor.bindEnvironment(mediaStateChangedCallback));
  }

  queueCandidate(_candidate) {
    let candidate = this.client.createCandidate(_candidate);
    if (this.webRtcEndpoint) {
      this.webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
      this.candidatesQueue.push(candidate);
    }
  };

  release() {
    console.info(' [video] Releasing pipeline for video ' + videoId);

    if (this.webRtcEndpoint) {

      this.webRtcEndpoint.release();
      this.webRtcEndpoint = null;
    }
  };

}

let KurentoClientSingleton = new KurentoClient();

Meteor.startup(() => {
  const KURENTO_CONFIG = Meteor.settings.kurento;

  KurentoClientSingleton.updateConfig(KURENTO_CONFIG);
  KurentoClientSingleton.init();
});

export default KurentoClientSingleton;