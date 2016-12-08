export default function handleUserUnsharedHtml5Webcam({ payload }) {
  const message = payload.message;
  const meetingId = payload.meeting_id;
  const userId = payload.user_id;

  check(meetingId, String);
  check(message, Object);

  return unsharedWebcam(meetingId,userId);
}
