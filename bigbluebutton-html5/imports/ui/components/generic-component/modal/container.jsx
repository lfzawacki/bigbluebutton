import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withModalMounter } from '/imports/ui/components/modal/service';
import GenericComponentModal from './component';

const GenericComponentModalContainer = props => <GenericComponentModal {...props} />;

export default withModalMounter(withTracker(({ mountModal }) => ({
  closeModal: () => {
    mountModal(null);
  },
}))(GenericComponentModalContainer));
