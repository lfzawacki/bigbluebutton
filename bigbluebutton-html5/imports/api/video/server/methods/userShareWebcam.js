import { Meteor } from 'meteor/meteor';

import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import RedisPubSub from '/imports/startup/server/redis';
import { isAllowedTo } from '/imports/startup/server/userPermissions';
import Video from '/imports/api/video';

import KurentoClientSingleton from '/imports/startup/server/kurento-client';

export default function userShareWebcam(credentials, message) {

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

  return Video.upsert({videoId: message.id, video: video});
};
