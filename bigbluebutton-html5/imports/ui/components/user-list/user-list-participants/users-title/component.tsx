import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import Styled from './styles';
import withRenderInstrumentation from '/imports/ui/components/common/with-render-instrumentation/component';

interface UsersTitleProps {
  count: number;
}

const messages = defineMessages({
  usersTitle: {
    id: 'app.userList.usersTitle',
    description: 'Title for the Header',
  },
});

const UsersTitle: React.FC<UsersTitleProps> = ({ count }) => {
  const intl = useIntl();

  return (
    <Styled.Container>
      <Styled.SmallTitle>
        {intl.formatMessage(messages.usersTitle, { userCount: count.toLocaleString('en-US', { notation: 'standard' }) })}
      </Styled.SmallTitle>
    </Styled.Container>
  );
};

export default withRenderInstrumentation(UsersTitle, 'UsersTitle');
