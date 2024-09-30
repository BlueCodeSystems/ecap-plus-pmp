import styled from 'styled-components';
import { FONT_SIZE, FONT_WEIGHT, media } from '@app/styles/themes/constants';
import { BaseInput } from '../BaseInput/BaseInput';
import { SearchOutlined } from '@ant-design/icons'
import { BaseSpace } from '../../BaseSpace/BaseSpace';

export const Space = styled(BaseSpace)`
  & > .ant-space-item:last-of-type {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;;

export const SearchIcon = styled(SearchOutlined)`
  font-size: 1.25rem;
  color: #666;

  @media only screen and (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const ClearButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  margin-left: 0.5rem;
  display: flex; /* Ensure it aligns properly with the input */
  align-items: center;
  height: 100%; /* Match the height of the input */
  padding: 0; /* Remove extra padding */
  
  &:hover {
    color: #333;
  }
`;

export const SearchInput = styled(BaseInput.Search)`
  border: 2px solid #c6d9eb;
  border-radius: 1.5rem;
  background: #ffffff;
  padding: 0.5rem 1rem;
  width: 100%; /* Default to 100% width for mobile devices */
  max-width: 450px; /* Set a maximum width */
  margin: 0 auto; /* Center horizontally */
  box-shadow: none; /* Remove box shadow to avoid enlarging effect */
  display: flex; /* Use flex to align items properly */

  &:focus {
    border-color: #a2b8d7;
    outline: none;
  }

  .ant-input-prefix {
    margin-right: 0.5rem;
  }

  .ant-input-group-addon {
    display: none;
  }

  input {
    height: auto;
    padding: 0.5rem;
    border: none;
    outline: none;
    background: transparent;
    font-weight: bold;
    font-size: 14px; /* Slightly increased font size for better readability */
    color: #333;
  }

  .clear-button {
    display: flex;
    align-items: center;
    margin-left: 0; /* Remove margin if not needed */
  }

  @media only screen and (min-width: 576px) {
    width: 75%; /* Adjust width for small tablets */
  }

  @media only screen and (min-width: 768px) {
    width: 50%; /* Adjust width for tablets */
  }

  @media only screen and (min-width: 992px) {
    width: 450px; /* Use the fixed width for larger screens */
  }
`;