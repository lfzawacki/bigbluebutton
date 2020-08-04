import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import GenericComponent from './component';
import { getComponentName, startGenericComponent, stopGenericComponent } from './service';
import Auth from '/imports/ui/services/auth';

const GenericComponentContainer = props => (
  <GenericComponent {...{ ...props }} />
);

export default withTracker(({ isPresenter }) => {
  return {
    isPresenter,
    meetingID: Auth.meetingID,
    userName: Auth.fullname,
    startGenericComponent,
    stopGenericComponent,
    name: getComponentName(),
  };
})(GenericComponentContainer);
