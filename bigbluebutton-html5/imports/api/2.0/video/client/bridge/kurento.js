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
  }

  on(event) {
  }

  stop(id) {
    window.KurentoVideo.stop(id);
  }

  start(id, share, tag, cb) {
    window.KurentoVideo.start(
      id, share, tag, cb
      // BridgeService.getConferenceBridge(),
      // getUsername(), 
      // getMeetingId(),
      // null,
      // null,
    );
  }
}
