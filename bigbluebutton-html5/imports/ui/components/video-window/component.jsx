import React, { Component, PropTypes } from 'react';
import Video from '/imports/api/video';

let selectedVideo = null;

export default class VideoWindow extends Component {

  constructor(props) {
    super(props);
    this.state = { selected: false };

    this.handleClick = this.handleClick.bind(this);
  }

  render() {

    if (Video.findOne({sendingIce: true})) {
      let video = Video.findOne({sendingIce: true});
      let candidate = video.candidate;

      Meteor.call('userSendIceCandidate', {candidate});
    }

    return (
    <div className={"videoWindow " + this.selectedClass()} data-video-id={this.props.video.id}>

      <video className={""} id={this.props.video.id} src="img/loading.mp4" autoPlay muted loop></video>

      <div className="videoText">
        <a href="#" onClick={this.handleClick}>
          {this.props.video.name}
        </a>
        <span className="video-icons">
          <AudioIcon videoId={this.props.video.id} />
          <FullscreenButton onClick={this.handleFullscreen}/>
        </span>
      </div>

      <div className="videoError">
        Failed loading video. Retrying in <span className="seconds"></span>
        <span className="videoIcons">
          <RestartVideoButton />
        </span>
      </div>
    </div>
    );
  }

  handleClick() {
    console.log(this.props);
    this.props.actions.handleShareWebcam({id: this.props.id});
  }

  handleFullscreen() {
    console.log('Handle fullscreen');
  }

  selectedClass() {
    return this.state.selected ? "video-selected" : "";
  }

}

class RestartVideoButton extends Component {
  render() {
    return (
      <a href="#" className="restart-video-button" title="Restart Camera">
        <i className={"fa fa-refresh mosaic-icon"} ></i>
      </a>
    )
  }
}

class FullscreenButton extends Component {
  render() {
    return (
      <a href="#" className="fullscreen-button" title="See fullscreen">
        <i className={"fa fa-arrows-alt mosaic-icon"} ></i>
      </a>
    )
  }
}

class AudioIcon extends Component {
  handleClick() {

  }

  render() {
    return (
      <a href="#" onClick={this.handleClick} title="Sending audio">
        <i className={"fa audio-icon video-icon"} ></i>
      </a>
    );
  }

}
