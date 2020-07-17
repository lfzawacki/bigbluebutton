import logger from '/imports/startup/client/logger';
import { makeCall } from '/imports/ui/services/api';
import Meetings from '/imports/api/meetings';
import Auth from '/imports/ui/services/auth';

const getComponentName = () => {
  const m = Meetings.findOne({ meetingId: Auth.meetingID });

  return m && m.genericComponent && m.genericComponent.name;
}

const getComponentUrl = () => {
  const m = Meetings.findOne({ meetingId: Auth.meetingID });

  return m && m.genericComponent && m.genericComponent.url;
}

const stopGenericComponent = () => {
  makeCall('stopGenericComponent', { name: getComponentName() });
}

const enabledGenericComponents = () => {
  return Object.values(Meteor.settings.public.app.genericComponents);
}

const startGenericComponent = (name, url) => {
  makeCall('startGenericComponent', { name, url });
}


export {
  enabledGenericComponents,
  startGenericComponent,
  stopGenericComponent,
  getComponentUrl,
  getComponentName,
};
