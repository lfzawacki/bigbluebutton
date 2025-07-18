import styled from 'styled-components';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0px 1.5rem 1.5rem 1.5rem;
  text-align: left;

  #preview {
    max-height: 10rem;
  }
`;

export default {
  Content,
};
