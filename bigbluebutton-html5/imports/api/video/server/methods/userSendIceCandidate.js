import { Meteor } from 'meteor/meteor';

import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import RedisPubSub from '/imports/startup/server/redis';
import { isAllowedTo } from '/imports/startup/server/userPermissions';

import Video from '/imports/api/video';

export default function userSendIceCandidate(credentials, message) {

  let video = Video.findOne().first

  let candidate = video.client.createCandidate(message.candidate);
  if (video.webRtcEndpoint) {
    video.webRtcEndpoint.addIceCandidate(candidate);
  }
  else {
    video.candidatesQueue.push(candidate);
  }

  return {};
};
