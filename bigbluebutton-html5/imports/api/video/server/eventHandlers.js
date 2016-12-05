import RedisPubSub from '/imports/startup/server/redis';
import handleChatMessage from './handlers/userSharedHtml5Webcam';
import handleChatHistory from './handlers/userUnsharedHtml5Webcam';

RedisPubSub.on('user_shared_html5_webcam', handleChatHistory);
RedisPubSub.on('user_unshared_html5_webcam', handleChatHistory);
