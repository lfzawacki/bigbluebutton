import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import Meetings from '/imports/api/meetings';
import RedisPubSub from '/imports/startup/server/redis';

export default function startComponent(credentials, options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StartGenericComponentMsg';

  const { meetingId, requesterUserId } = credentials;
  const { name, url } = options;

  check(meetingId, String);
  check(requesterUserId, String);
  check(url, String);

  Meetings.update({ meetingId }, { $set: { genericComponent: {name, url} } });

  const payload = { name, url };

  Logger.info(`User id=${requesterUserId} sharing a generic ${name} component: ${url} for meeting ${meetingId}`);

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
