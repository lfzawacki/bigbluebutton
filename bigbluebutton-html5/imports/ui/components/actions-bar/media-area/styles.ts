import styled from 'styled-components';
import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';
import Button from '/imports/ui/components/common/button/component';

// @ts-ignore - Button is JSX element
const HideDropdownButton = styled(Button)`
  ${({ open }) => open && `
      @media ${smallOnly} {
        display:none;
      }
   `}
`;

export default {
  HideDropdownButton,
};
