import React, { Component } from 'react';
import ScreenshareContainer from '/imports/ui/components/screenshare/container';
import styles from './styles.scss';
//import KurentoVideo from '/imports/api/2.0/video/client/bridge/kurento';

class VideoElement extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <video id={this.props.id} width={this.props.width} height={this.props.height}/>;
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
    const KurentoVideo = window.KurentoVideo;

    for (let i = 0; i < users.length; i++) {
      if (users[i].has_stream) {
        this.start(users[i].userId, false, this.getVideoId(users[i].userId));
      }
    }

    document.addEventListener('joinVideo', () => { that.shareWebcam(); });// TODO find a better way to do this
    document.addEventListener('exitVideo', () => { that.unshareWebcam(); });
  }

  start(id, shared, tagId) {
    let st = this.state;

    st.videos[id] = new KurentoVideo(id, shared, tagId);

    st.videos[id].start(() => {

    });

    this.setState(st);
  }

  stop(id) {
    const KurentoVideo = window.KurentoVideo;

    KurentoVideo.stop(id, () => {

      let st = this.state;
      delete st.videos[id];

      this.setState(st);

      adjustVideos('#webcamArea', true);
    });
  }

  shareWebcam() {
    const { users } = this.props;
    const id = users[0].userId;
    const KurentoVideo = window.KurentoVideo;

    let st = this.state;
    st.videos[id] = new KurentoVideo(id, true, this.refs.videoInput.id);

    // promise?
    st.videos[id].start(() => {
      this.sendUserShareWebcam(id);
    });

    this.setState(st);
  }

  unshareWebcam() {
    const { users } = this.props;
    const id = users[0].userId;
    this.sendUserUnshareWebcam(id);
  }

  handlePlayStop(video) {
    console.log('Handle play stop <--------------------');

    this.stop(video.id);
  }

  handlePlayStart(video) {
    console.log('Handle play start <===================');

    adjustVideos('#webcamArea', true);
  }

  handleError(id) {
    console.log(` Handle error ---------------------> ${message.message}`);
  }

  render() {
    let that = this;

    return (

      <div className={styles.videoDock}>
        <div id="webcamArea" />
        <video id="shareWebcamVideo" className={styles.sharedWebcamVideo} ref="videoInput" />

        {
          Object.keys(this.state.videos).map((id) => {
            return (
              <VideoElement id={that.getVideoId(id)} key={that.getVideoId(id)} width={120} height={90} autoPlay={true} videoId={id} />
            );
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
              this.start(users[i].userId, false, this.refs.videoInput.id);
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

  getVideoId(id) {
    return `video-elem-${id}`;
  }
}
