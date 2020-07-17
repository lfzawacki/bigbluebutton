import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import GenericComponent from './component';
import Auth from '/imports/ui/services/auth';

const GenericComponentContainer = props => (
  <GenericComponent {...{ ...props }} />
);

export default withTracker(({ isPresenter }) => {
  console.log(Auth);
  return {
    isPresenter,
    meetingID: Auth.meetingID,
    userName: Auth.fullname,
  };
})(GenericComponentContainer);
