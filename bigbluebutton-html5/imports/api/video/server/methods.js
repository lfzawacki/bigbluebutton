import { Meteor } from 'meteor/meteor';
import userShareWebcam from './methods/userShareWebcam';
import userUnshareWebcam from './methods/userUnshareWebcam';
import userSendIceCandidate from './methods/userSendIceCandidate';

Meteor.methods({
  userShareWebcam,
  userUnshareWebcam,
  userSendIceCandidate
});
