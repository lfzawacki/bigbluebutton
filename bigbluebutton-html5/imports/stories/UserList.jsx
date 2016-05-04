import React from 'react';
import {UserListItem} from '../ui/userlist/UserListItem.jsx';
import {UserList} from '../ui/userlist/UserList.jsx';

import { storiesOf, action } from '@kadira/storybook';

var mock_actions = {
  kick(user) {},
  setPresenter(user) {},
  openChat(user) {},
  muteUser() {},
};

var user_list = [
  {
    id: 1, name: 'Lucas',
    isCurrent: true, isPresenter: true, isModerator: true,
    emoji: 'happy', unreadMessagesCount: 0,
    sharingStatus: {
      isInAudio: true, isLocked: false, isWebcamOpen: false, isListenOnly: false, isMuted: false, isTalking: true,
    },
    actions: mock_actions,
  },

  {
    id: 2, name: 'Gabriel',
    isCurrent: false, isPresenter: false, isModerator: false,
    emoji: 'sad', unreadMessagesCount: 2,
    sharingStatus: {
      isInAudio: true, isLocked: false, isWebcamOpen: false, isListenOnly: true, isMuted: false, isTalking: false,
    },
    actions: mock_actions,
  }

]

storiesOf('UserList', module)
  .add('with one user', () => (
    <UserList users={[user_list[0]]} currentUser={user_list[0]} />
  ))
  .add('with two users', () => (
    <UserList users={[user_list[0], user_list[1]]} currentUser={user_list[0]} />
  ))

