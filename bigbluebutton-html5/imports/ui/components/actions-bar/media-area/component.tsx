import React, { useState, useCallback } from 'react';
import { defineMessages } from 'react-intl';
import { MediaAreaProps } from './types';
import Styled from './styles';
import MediaSharingModal from '/imports/ui/components/actions-bar/media-area/media-sharing/component';

const defaultProps = {
  isPresentationManagementDisabled: false,
  amIPresenter: false,
  amIModerator: false,
};

const intlMessages = defineMessages({
  mediaLabel: {
    id: 'app.actionsBar.actionsDropdown.actionsLabel',
    description: 'Actions button label',
  },
});

const MediaArea = (props: MediaAreaProps) => {
  const {
    intl,
    amIPresenter,
    amIModerator,
    isMeteorConnected,
    mediaAreaItems,
    isCameraAsContentEnabled,
    hasCameraAsContent,
    hasPresentation,
    handleTakePresenter,
    isPresentationManagementDisabled,
    isPresentationEnabled,
    isSharingVideo,
    allowExternalVideo,
    stopExternalVideoShare,
    setPresentationFitToWidth,
    isMobile,
    isRTL,
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  if ((!amIPresenter && !amIModerator) || !isMeteorConnected) {
    return null;
  }

  return (
    <>
      <Styled.HideDropdownButton
        hideLabel
        aria-label={intl.formatMessage(intlMessages.mediaLabel)}
        data-test="mediaAreaButton"
        label={intl.formatMessage(intlMessages.mediaLabel)}
        icon="media-area"
        color={menuOpen ? 'primary' : 'default'}
        size="lg"
        circle
        onClick={handleToggleMenu}
      />
      <MediaSharingModal
        isMobile={isMobile}
        isRTL={isRTL}
        open={menuOpen}
        onClose={handleToggleMenu}
        intl={intl}
        amIPresenter={amIPresenter}
        amIModerator={amIModerator}
        isMeteorConnected={isMeteorConnected}
        mediaAreaItems={mediaAreaItems}
        isCameraAsContentEnabled={isCameraAsContentEnabled}
        hasCameraAsContent={hasCameraAsContent}
        hasPresentation={hasPresentation}
        handleTakePresenter={handleTakePresenter}
        isPresentationManagementDisabled={isPresentationManagementDisabled}
        isPresentationEnabled={isPresentationEnabled}
        isSharingVideo={isSharingVideo}
        allowExternalVideo={allowExternalVideo}
        stopExternalVideoShare={stopExternalVideoShare}
        setPresentationFitToWidth={setPresentationFitToWidth}
      />
    </>
  );
};

MediaArea.defaultProps = defaultProps;

export default React.memo(MediaArea);
