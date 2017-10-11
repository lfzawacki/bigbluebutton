import Meetings from '/imports/api/2.0/meetings';

const getConferenceBridge = () => Meetings.findOne().voiceProp.voiceConf;

export default {
  getConferenceBridge,
};
