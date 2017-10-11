import Users from '/imports/api/2.0/users';
import Auth from '/imports/ui/services/auth';
import BridgeService from './service';

const getUserId = () => {
  const userID = Auth.userID;
  return userID;
}

const getMeetingId = () => {
  const meetingID = Auth.meetingID;
  return meetingID;
}

const getUsername = () => {
  return Users.findOne({ userId: getUserId() }).name;
}

export default class KurentoVideo {
  kurentoWatchVideo() {
    window.kurentoWatchVideo(
      'video',
      BridgeService.getConferenceBridge(),
      getUsername(),
      getMeetingId(),
      null,
      null,
    );
  }

  kurentoExitVideo() {
    window.kurentoExitVideo();
  }

  // TODO parameters? que elementos?
  kurentoShareVideo() {
    window.kurentoShareVideo(
      null,
      BridgeService.getConferenceBridge(),
      getUsername(), 
      getMeetingId(),
      null,
      null,
    );
  }
}
