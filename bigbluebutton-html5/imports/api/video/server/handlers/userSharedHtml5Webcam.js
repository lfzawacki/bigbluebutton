export default function handleUserSharedHtml5Webcam({ payload }) {
  const message = payload.message;
  const meetingId = payload.meeting_id;
  const userId = payload.user_id;

  check(meetingId, String);
  check(message, Object);

  return sharedWebcam(meetingId,userId);
}
