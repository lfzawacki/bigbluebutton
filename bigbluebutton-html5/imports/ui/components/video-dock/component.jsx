import React, { Component, PropTypes } from 'react';
import styles from './styles.scss';
import DeskshareContainer from '/imports/ui/components/deskshare/container.jsx';
import VideoWindowContainer from '/imports/ui/components/video-window/container.jsx';

export default class VideoDock extends Component {

  constructor(props) {
    super(props);
    this.state = { videos: [{name: 'video1', id: 'video1'}] };
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  handleReorder(video1, video2) {
    let videos = this.state.videos;
    let i1 = video1.index, i2 = video2.index;

    // Reorder videos
    videos[i1] = video2;
    videos[i2] = video1;

    // Re-assign indexes
    video1.index = i2;
    video2.index = i1;

    this.setState({videos: videos});

    $(window).resize();

    // HACK, do this with React callbacks and stuff
    setTimeout(function() {
      $("#" + video1.id)[0].play();
      $("#" + video2.id)[0].play();
    }, 300);

  }

  render() {

    return (
      <div className={styles.videoDock}>
        {$.map( this.state.videos, function(obj) {
          return <VideoWindowContainer id={obj.id + "-container"} key={"video-window" + obj.id} video={obj} />
        })}
      </div>
    )
  }
}
