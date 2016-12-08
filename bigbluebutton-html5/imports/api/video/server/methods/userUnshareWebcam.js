import { Meteor } from 'meteor/meteor';
import RedisPubSub from '/imports/startup/server/redis';

const REDIS_CONFIG = Meteor.settings.redis;
const CHANNEL = REDIS_CONFIG.channels.toBBBApps.html5-video;

const VIDEO_CONFIG = Meteor.settings.public.video;


export default function userUnshareWebcam(credentials, message) {
  sendUserUnshareWebcam(credentials, message);
  return; //
};


function sendUserUnshareWebcam(credentials, message) {
  const { meetingId, requesterUserId, requesterToken } = credentials;

  check(meetingId, String);
  check(requesterUserId, String);
  check(requesterToken, String);
  check(message, Object);

  let eventName = 'user_unshare_html5_webcam_request_message';

  if (!isAllowedTo(actionName, credentials)) {
    throw new Meteor.Error('not-allowed', `You are not allowed to unshare webcam`);
  }

  let payload = {
    message,
    meeting_id: meetingId,
    requester_id: message.from_userid,
  };

  return RedisPubSub.publish(CHANNEL, eventName, payload);
}
