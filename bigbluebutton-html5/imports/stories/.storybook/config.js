import { configure } from '@kadira/storybook';

function loadStories() {
  require('../UserList.jsx');

}

configure(loadStories, module);
