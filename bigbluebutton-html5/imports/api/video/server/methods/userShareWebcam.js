import { Meteor } from 'meteor/meteor';

import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import RedisPubSub from '/imports/startup/server/redis';
import { isAllowedTo } from '/imports/startup/server/userPermissions';
import Video from '/imports/api/video';

import KurentoClientSingleton from '/imports/startup/server/kurento-client';

const REDIS_CONFIG = Meteor.settings.redis;
const CHANNEL = REDIS_CONFIG.channels.toBBBApps.html5-video;

const VIDEO_CONFIG = Meteor.settings.public.video;

export default function userShareWebcam(credentials, message) {
  // Create server side video object
  let video = KurentoClientSingleton.createVideo(message.id);

  let iceCallback = (candidate) => {
    // Sending ice to continue the process
    let videoObj = Video.findOne();
    Video.update(videoObj._id, {
      $set: { sendingIce: true, candidate },
    });
  }

  video.start(message.sdpOffer, iceCallback, Meteor.bindEnvironment((err) => {

  }));

  Video.upsert({videoId: message.id, video: video});

  return sendUserShareWebcam(credentials, message);
}

function sendUserShareWebcam(credentials, message) {

  const { meetingId, requesterUserId, requesterToken } = credentials;

  check(meetingId, String);
  check(requesterUserId, String);
  check(requesterToken, String);
  check(message, Object);

  // Send message
  let eventName = 'user_share_html5_webcam_request_message';

  if (!isAllowedTo(actionName, credentials)) {
    throw new Meteor.Error('not-allowed', `You are not allowed to share webcam`);
  }

  let payload = {
    message,
    meeting_id: meetingId,
    requester_id: message.from_userid,
  };

  return RedisPubSub.publish(CHANNEL, eventName, payload);
};
