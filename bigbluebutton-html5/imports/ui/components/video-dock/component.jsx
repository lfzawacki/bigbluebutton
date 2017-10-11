import React, { Component } from 'react';
import ScreenshareContainer from '/imports/ui/components/screenshare/container';
import styles from './styles.scss';
//import KurentoVideo from '/imports/api/2.0/video/client/bridge/kurento';

const KurentoVideo = window.KurentoVideo;

class VideoElement extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <video id={props.id} width={props.width} height={props.height}/>;
  }

}

export default class VideoDock extends Component {

  constructor(props) {
    super(props);

    this.state = {
      videos: {}
    };

    this.sendUserShareWebcam = props.sendUserShareWebcam.bind(this);
    this.sendUserUnshareWebcam = props.sendUserUnshareWebcam.bind(this);

    this.unshareWebcam = this.unshareWebcam.bind(this);
    this.shareWebcam = this.shareWebcam.bind(this);

   // KurentoVideo.on('playStart', this.handlePlayStart);
   // KurentoVideo.on('playStop', this.handlePlayStop);
   // KurentoVideo.on('error', this.handleError);
  }

  componentDidMount() {
    const that = this;
    const { users } = this.props;

    for (let i = 0; i < users.length; i++) {
      if (users[i].has_stream) {

        let videoElement = new VideoElement({id: `video-elem-${id}`,
          width: 120, height: 90, autoPlay: true, videoId: id});

        let videos = this.state.videos;
        videos[id] = videoElement;
        this.setState(videos);

        KurentoVideo.start(users[i].userId, false, videoElement.props.id, () => {});
      }
    }

    document.addEventListener('joinVideo', function() { that.shareWebcam(); });// TODO find a better way to do this
    document.addEventListener('exitVideo', function() { that.unshareWebcam(); });
  }

  stop(id) {

    KurentoVideo.stop(id, () => {
      // const videoTag = document.getElementById(`video-elem-${id}`);
      // if (videoTag) {
      //   document.getElementById('webcamArea').removeChild(videoTag);
      // }

      let videos = this.state.videos;
      delete videos[id];
      this.setState({videos: videos});

      adjustVideos('#webcamArea', true);
    });
  }

  shareWebcam() {
    const { users } = this.props;
    const id = users[0].userId;

    // promise?
    KurentoVideo.start(id, true, this.refs.videoInput.id, () => {
      this.sendUserShareWebcam(id);
    });
  }

  unshareWebcam() {
    const { users } = this.props;
    const id = users[0].userId;
    this.sendUserUnshareWebcam(id);
  }

  handlePlayStop(id) {
    console.log('Handle play stop <--------------------');

    this.stop(id);
  }

  handlePlayStart(id) {
    console.log('Handle play start <===================');

    adjustVideos('#webcamArea', true);
  }

  handleError(id) {
    console.log(` Handle error ---------------------> ${message.message}`);
  }

  render() {
    return (

      <div className={styles.videoDock}>
        <div id="webcamArea" />
        <video id="shareWebcamVideo" className={styles.sharedWebcamVideo} ref="videoInput" />

        {
          Object.keys(this.state.videos).map((id) => {
            return this.state.videos[id];
          })
        }

      </div>
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { users } = this.props;
    const nextUsers = nextProps.users;

    if (users) {
      let suc = false;

      for (let i = 0; i < users.length; i++) {
        if (users && users[i] &&
              nextUsers && nextUsers[i]) {
          if (users[i].has_stream !== nextUsers[i].has_stream) {
            console.log(`User ${nextUsers[i].has_stream ? '' : 'un'}shared webcam ${users[i].userId}`);

            if (nextUsers[i].has_stream) {
              this.start(users[i].userId, false, this.refs.videoInput);
            } else {
              this.stop(users[i].userId);
            }

            suc = suc || true;
          }
        }
      }

      return true;
    }

    return false;
  }
}
