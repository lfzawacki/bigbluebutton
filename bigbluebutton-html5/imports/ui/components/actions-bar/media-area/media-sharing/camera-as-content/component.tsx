import React, { useEffect, useRef, useState } from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import MenuItem from '@mui/material/MenuItem';
import { SelectChangeEvent } from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getSettingsSingletonInstance } from '/imports/ui/services/settings';
import Styled from './styles';
import { useStorageKey } from '/imports/ui/services/storage/hooks';
import logger from '/imports/startup/client/logger';
import { SCREENSHARING_ERRORS } from '/imports/api/screenshare/client/bridge/errors';
import BBBVideoStream from '/imports/ui/services/webrtc-base/bbb-video-stream';
import deviceInfo from '/imports/utils/deviceInfo';
import VideoService from '/imports/ui/components/video-provider/service';
import PreviewService from '/imports/ui/components/video-preview/service';
import MediaStreamUtils from '/imports/utils/media-stream-utils';
import ProfileStyled from '/imports/ui/components/profile-settings/styles';
import ModalStyled from '../styles';
import * as ScreenShareService from '/imports/ui/components/screenshare/service';

interface CameraAsContentViewProps {
  intl: IntlShape;
  onActionCompleted: () => void;
  hasCameraAsContent: boolean;
  stopExternalVideoShare: () => void;
}

interface CameraProfileProps {
  id: string;
  name: string;
  default?: boolean;
  bitrate: number;
  constraints?: {
    width: number;
    height: number;
    frameRate?: number;
  };
}

const VIEW_STATES = {
  finding: 'finding',
  found: 'found',
  error: 'error',
};

// Re-define intlMessages here or pass formatted strings if preferred
const intlMessages: { [key: string]: { id: string; description?: string } } = defineMessages({
  cameraLabel: {
    id: 'app.videoPreview.cameraLabel',
    description: 'Camera dropdown label',
  },
  findingWebcamsLabel: {
    id: 'app.videoPreview.findingWebcamsLabel',
    description: 'Finding webcams label',
  },
  webcamNotFoundLabel: {
    id: 'app.videoPreview.webcamNotFoundLabel',
    description: 'Webcam not found label',
  },
  AbortError: {
    id: 'app.video.abortError',
    description: 'Some problem occurred which prevented the device from being used',
  },
  OverconstrainedError: {
    id: 'app.video.overconstrainedError',
    description: 'No candidate devices which met the criteria requested',
  },
  SecurityError: {
    id: 'app.video.securityError',
    description: 'Media support is disabled on the Document',
  },
  TypeError: {
    id: 'app.video.typeError',
    description: 'List of constraints specified is empty, or has all constraints set to false',
  },
  NotFoundError: {
    id: 'app.video.notFoundError',
    description: 'error message when can not get webcam video',
  },
  NotAllowedError: {
    id: 'app.video.notAllowed',
    description: 'error message when webcam had permission denied',
  },
  NotSupportedError: {
    id: 'app.video.notSupportedError',
    description: 'error message when origin do not have ssl valid',
  },
  NotReadableError: {
    id: 'app.video.notReadableError',
    description: 'error message When the webcam is being used by other software',
  },
  TimeoutError: {
    id: 'app.video.timeoutError',
    description: 'error message when promise did not return',
  },
  genericError: {
    id: 'app.video.genericError',
    description: 'error message for when the webcam sharing fails with unknown error',
  },
  inactiveError: {
    id: 'app.video.inactiveError',
    description: 'Camera stopped unexpectedly',
  },
  shareLabel: {
    id: 'app.mediaSharing.modal.share',
    description: 'Label for the share button in the sharing media modal',
  },
  stopSharingLabel: {
    id: 'app.mediaSharing.modal.stopSharing',
    description: 'Label for the stop sharing button in the sharing media modal',
  },
});

const CameraAsContentView: React.FC<CameraAsContentViewProps> = ({
  intl,
  hasCameraAsContent,
  onActionCompleted,
  stopExternalVideoShare,
}) => {
  const { formatMessage } = intl;
  const settingsStorage = window.meetingClientSettings.public.app.userSettingsStorage;
  const [availableWebcams, setAvailableWebcams] = useState<MediaDeviceInfo[] | null>(null);
  const [webcamDeviceId, setWebcamDeviceId] = useState<string | null>(
    useStorageKey('WebcamDeviceId', settingsStorage) as string || null,
  );
  const [viewState, setViewState] = useState<string>(VIEW_STATES.finding);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);

  const isMounted = useRef<boolean>(true);
  const currentVideoStream = useRef<BBBVideoStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeCameras = async () => {
    isMounted.current = true;
    if (deviceInfo.hasMediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        VideoService.updateNumberOfDevices(devices);
        // Late enumerateDevices resolution, stop.
        if (!isMounted.current) return;

        let {
          webcams,
          // eslint-disable-next-line prefer-const
          areLabelled,
          // eslint-disable-next-line prefer-const
          areIdentified,
        } = PreviewService.digestVideoDevices(devices, webcamDeviceId);

        logger.debug({
          logCode: 'video_preview_enumerate_devices',
          extraInfo: {
            devices,
            webcams,
          },
        }, `Enumerate devices came back. There are ${devices.length} devices and ${webcams.length} are video inputs`);

        if (webcams.length > 0) {
          // @ts-ignore
          await getCameraStream(webcams[0].deviceId, PreviewService.getCameraAsContentProfile());
          // Late gUM resolve, stop.
          if (!isMounted.current) return;

          if (!areLabelled || !areIdentified) {
            // If they aren't labelled or have nullish deviceIds, run
            // enumeration again and get their full versions
            // Why: fingerprinting countermeasures obfuscate those when
            // no permission was granted via gUM
            try {
              const newDevices = await navigator.mediaDevices.enumerateDevices();
              webcams = PreviewService.digestVideoDevices(newDevices, webcamDeviceId).webcams;
            } catch (error: unknown) {
              // Not a critical error beucase it should only affect UI; log it
              // and go ahead
              logger.error({
                logCode: 'video_preview_enumerate_relabel_failure',
                extraInfo: {
                  errorName: (error as Error).name, errorMessage: (error as Error).message,
                },
              }, 'enumerateDevices for relabelling failed');
            }
          }

          setAvailableWebcams(webcams);
          setViewState(VIEW_STATES.found);
          displayPreview();
        } else {
          // There were no webcams coming from enumerateDevices. Throw an error.
          const noWebcamsError = new Error('NotFoundError');
          handleDeviceError('enumerate', noWebcamsError, ': no webcams found');
        }
      } catch (error) {
        // enumerateDevices failed
        handleDeviceError('enumerate', error as Error, 'enumerating devices');
      }
    } else {
      // Top-level navigator.mediaDevices is not supported.
      // The session went through the version checking, but somehow ended here.
      // Nothing we can do.
      const error = new Error('NotSupportedError');
      handleDeviceError('mount', error, ': navigator.mediaDevices unavailable');
    }
  };

  useEffect(() => {
    initializeCameras();

    return () => {
      // Code to run on unmount
      terminateCameraStream(currentVideoStream.current, webcamDeviceId);
      cleanupStreamAndVideo();
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // ComponentDidUpdate logic
    if (
      viewState === VIEW_STATES.found
      && !videoRef.current?.srcObject
    ) {
      displayPreview();
    }
  }, [viewState]);

  const handleDeviceError = (
    logCode: string,
    error: Error,
    description: string,
  ) => {
    logger.warn(
      {
        logCode: `video_preview_${logCode}_error`,
        extraInfo: {
          errorName: error.name,
          errorMessage: error.message,
        },
      },
      `Error ${description}`,
    );
    setViewState(VIEW_STATES.error);
    setDeviceError(handleGUMError(error));
  };

  const handleGUMError = (error: Error) => {
    logger.error(
      {
        logCode: 'video_preview_gum_failure',
        extraInfo: {
          errorName: error.name,
          errorMessage: error.message,
        },
      },
      'getUserMedia failed in video-preview',
    );

    const intlError = intlMessages[error.name] || intlMessages[error.message];
    if (intlError) {
      return formatMessage(intlError);
    }

    return formatMessage(intlMessages.genericError, {
      0: `${error.name}: ${error.message}`,
    });
  };

  const handlePreviewError = (
    logCode: string,
    error: Error,
    description: string,
  ) => {
    logger.warn(
      {
        logCode: `video_preview_${logCode}_error`,
        extraInfo: {
          errorName: error.name,
          errorMessage: error.message,
        },
      },
      `Error ${description}`,
    );
    setPreviewError(handleGUMError(error));
  };

  const handleLocalStreamInactive = ({ id }: { id: string }) => {
    if (
      currentVideoStream.current
      && typeof id === 'string'
      && currentVideoStream.current?.mediaStream?.id === id
    ) {
      setIsCameraLoading(true);
      handlePreviewError(
        'stream_inactive',
        new Error('inactiveError'),
        '- preview camera stream inactive',
      );
    }
  };

  const terminateCameraStream = (stream: BBBVideoStream | null, deviceId: string | null) => {
    if (stream) {
      // Stream is being destroyed - remove gUM revocation handler to avoid false negatives
      stream.removeListener('inactive', handleLocalStreamInactive);
      PreviewService.terminateCameraStream(stream, deviceId);
    }
  };

  const setCurrentVideoStream = (bbbVideoStream: BBBVideoStream | null) => {
    if (currentVideoStream.current) {
      currentVideoStream.current.removeListener(
        'inactive',
        handleLocalStreamInactive,
      );
    }
    if (bbbVideoStream) {
      // This causes a preview crash in firefox, review it
      // bbbVideoStream.once('inactive', handleLocalStreamInactive);
    }
    currentVideoStream.current = bbbVideoStream;
  };

  const cleanupStreamAndVideo = () => {
    setCurrentVideoStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const updateDeviceId = (deviceId: string | null) => {
    let actualDeviceId = deviceId;

    if (!actualDeviceId && currentVideoStream.current) {
      actualDeviceId = MediaStreamUtils.extractDeviceIdFromStream(
        currentVideoStream.current.mediaStream,
        'video',
      );
    }

    setWebcamDeviceId(actualDeviceId);
    return actualDeviceId;
  };

  const getCameraStream = async (deviceId: string | null, profile: CameraProfileProps) => {
    setPreviewError(null);
    setIsCameraLoading(true);

    terminateCameraStream(currentVideoStream.current, webcamDeviceId);
    cleanupStreamAndVideo();

    try {
      // The return of doGUM is an instance of BBBVideoStream (a thin wrapper over a MediaStream)
      let bbbVideoStream = await PreviewService.doGUM(deviceId, profile);
      setCurrentVideoStream(bbbVideoStream);
      const updatedDevice = updateDeviceId(deviceId);

      if (updatedDevice !== deviceId) {
        bbbVideoStream = await PreviewService.doGUM(updatedDevice, profile);
        setCurrentVideoStream(bbbVideoStream);
      }
    } catch (error) {
      handlePreviewError(
        'do_gum_preview',
        error as Error,
        'displaying final selection',
      );
    }

    if (!isMounted.current) {
      terminateCameraStream(currentVideoStream.current, deviceId);
      cleanupStreamAndVideo();
    }

    setIsCameraLoading(false);
  };

  const displayPreview = () => {
    if (currentVideoStream.current && videoRef.current) {
      videoRef.current.srcObject = currentVideoStream.current.mediaStream;
    }
  };

  const handleSelectWebcam = async (event: SelectChangeEvent<unknown>) => {
    const webcamValue = event.target.value as string;
    const profile = PreviewService.getCameraAsContentProfile();

    if (profile) {
      await getCameraStream(webcamValue, profile);
      displayPreview();
      PreviewService.changeWebcam(webcamValue);
    }
  };

  function renderWebcamPreview(): React.ReactNode {
    const Settings = getSettingsSingletonInstance();
    const { animations } = Settings.application;

    const containerStyle = {
      width: '60%',
      height: '25vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (viewState) {
      case VIEW_STATES.finding:
        return (
          <ProfileStyled.VideoPreviewContent>
            <ProfileStyled.VideoCol>
              <div style={containerStyle}>
                <span>{formatMessage(intlMessages.findingWebcamsLabel)}</span>
                <ProfileStyled.FetchingAnimation animations={animations} />
              </div>
            </ProfileStyled.VideoCol>
          </ProfileStyled.VideoPreviewContent>
        );
      case VIEW_STATES.error:
        return (
          <ProfileStyled.VideoPreviewContent>
            <ProfileStyled.VideoCol><div>{deviceError}</div></ProfileStyled.VideoCol>
          </ProfileStyled.VideoPreviewContent>
        );
      case VIEW_STATES.found:
      default:
        return (
          <ProfileStyled.VideoPreviewContent>
            <ProfileStyled.VideoCol>
              {
                previewError
                  ? (
                    <div>{previewError}</div>
                  )
                  : (
                    <ProfileStyled.VideoPreview
                      mirroredVideo={VideoService.mirrorOwnWebcam()}
                      id="preview"
                      data-test={VideoService.mirrorOwnWebcam() ? 'mirroredVideoPreview' : 'videoPreview'}
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                    />
                  )
              }
            </ProfileStyled.VideoCol>
          </ProfileStyled.VideoPreviewContent>
        );
    }
  }

  const handleStartCameraAsContent = () => {
    if (!PreviewService.storeStream(webcamDeviceId, currentVideoStream.current)) {
      currentVideoStream.current?.stop();
    }
    cleanupStreamAndVideo();
    const handleFailure = (error: unknown) => {
      const {
        // @ts-ignore - jsx code
        errorCode = SCREENSHARING_ERRORS.UNKNOWN_ERROR.errorCode,
        errorMessage = (error as Error).message,
      } = error as { errorCode?: number, errorMessage?: string };

      logger.error({
        logCode: 'camera_as_content_failed',
        extraInfo: { errorCode, errorMessage },
      }, `Sharing camera as content failed: ${errorMessage} (code=${errorCode})`);

      ScreenShareService.screenshareHasEnded();
    };

    ScreenShareService.shareScreen(
      hasCameraAsContent,
      stopExternalVideoShare,
      // eslint-disable-next-line no-underscore-dangle
      true, handleFailure, { stream: PreviewService.getStream(webcamDeviceId)._mediaStream },
    );
    ScreenShareService.setCameraAsContentDeviceId(webcamDeviceId);
  };

  return (
    <>
      <Styled.Content>
        {renderWebcamPreview()}
        <ProfileStyled.DeviceContainer>
          <ProfileStyled.IconCamera />
          {availableWebcams && availableWebcams.length > 0
            ? (
              <ProfileStyled.DeviceSelector value={webcamDeviceId || ''} onChange={handleSelectWebcam} IconComponent={ExpandMoreIcon}>
                {availableWebcams.map((webcam, index) => (
                  <MenuItem key={webcam.deviceId} value={webcam.deviceId}>
                    {webcam.label || `${formatMessage(intlMessages.cameraLabel)} ${index}`}
                  </MenuItem>
                ))}
              </ProfileStyled.DeviceSelector>
            )
            : <span>{formatMessage(intlMessages.webcamNotFoundLabel)}</span>}
        </ProfileStyled.DeviceContainer>
      </Styled.Content>
      <ModalStyled.FooterContainer>
        <ModalStyled.ConfirmationButton
          data-test={!hasCameraAsContent ? 'StartCameraAsContent' : 'StopCameraAsContent'}
          label={!hasCameraAsContent
            ? formatMessage(intlMessages.shareLabel) : formatMessage(intlMessages.stopSharingLabel)}
          color={!hasCameraAsContent ? 'primary' : 'danger'}
          onClick={async () => {
            if (!hasCameraAsContent) {
              handleStartCameraAsContent();
              onActionCompleted();
            } else {
              ScreenShareService.screenshareHasEnded();
              initializeCameras();
            }
          }}
          disabled={isCameraLoading || !availableWebcams || availableWebcams.length === 0}
          icon={hasCameraAsContent ? 'video_off' : undefined}
        />
      </ModalStyled.FooterContainer>
    </>
  );
};

export default CameraAsContentView;
