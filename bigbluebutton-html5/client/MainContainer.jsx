import React from 'react';
import a11y from 'react-a11y';
import {Header} from '/imports/ui/main/Header.jsx';
import {Whiteboard} from '/imports/ui/whiteboard/Whiteboard.jsx';
import {Chat} from '/imports/ui/chat/Chat.jsx';

// Accessibility "linter" for React components
a11y(React);

MainContainer = React.createClass({
  handleShield() {
    $('.tooltip').hide();
    toggleShield();
    return closeMenus();
  },

  render() {
    return (
      <div id="testing">
        <Header />
          <div id="panels">
            <div onClick={this.handleShield} className="shield"></div>
            <Whiteboard />
            <Chat />
          </div>
      </div>
    );
  },
});
