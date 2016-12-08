import Video from '/imports/api/video';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import { isAllowedTo } from '/imports/startup/server/userPermissions';

Meteor.publish('video', (credentials) => {

  if (!isAllowedTo('subscribeVideo', credentials)) {
    this.error(new Meteor.Error(402, "The user was not authorized to subscribe for 'videos'"));
  }

  const { meetingId, requesterUserId, requesterToken } = credentials;

  check(meetingId, String);
  check(requesterUserId, String);
  check(requesterToken, String);

  Logger.info(`Publishing video for ${meetingId} ${requesterUserId} ${requesterToken}`);

  return Video.find({});
});
