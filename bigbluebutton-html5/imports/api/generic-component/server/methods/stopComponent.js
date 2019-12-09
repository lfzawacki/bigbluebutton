import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import Meetings from '/imports/api/meetings';
import RedisPubSub from '/imports/startup/server/redis';

export default function stopComponent(credentials, options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StopGenericComponentMsg';

  const { meetingId, requesterUserId } = credentials;
  const { name } = options;

  Logger.info(`User id=${requesterUserId} stopped sharing generic component ${name} video for meeting=${meetingId}`);

  check(meetingId, String);
  check(requesterUserId, String);
  check(name, String);

  const meeting = Meetings.findOne({ meetingId });
  if (!meeting || !meeting.genericComponent) return;

  Meetings.update({ meetingId }, { $unset: { genericComponent: '' } });
  const payload = { name };

  Logger.info(`User id=${requesterUserId} stopped sharing generic component ${name} video for meeting=${meetingId}`);

  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
