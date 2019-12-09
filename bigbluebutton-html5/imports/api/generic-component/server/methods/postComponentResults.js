import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import RedisPubSub from '/imports/startup/server/redis';

export default function postGenericComponentResults(credentials, options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'GenericComponentResultsMsg';

  const { meetingId, requesterUserId } = credentials;
  const { name, results } = options;

  check(meetingId, String);
  check(requesterUserId, String);
  check(name, String);
  check(results, Object);

  const payload = { name, results };

  Logger.info(`User id=${requesterUserId} sharing a generic ${name} component result for meeting ${meetingId}`);

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
