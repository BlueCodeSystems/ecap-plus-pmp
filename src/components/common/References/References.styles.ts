import styled from 'styled-components';
import { media } from '@app/styles/themes/constants';

// Wrapper for the references section
export const ReferencesWrapper = styled.div`
  width: 80%; /* Adjust the width of the container */
  display: flex; /* Use flexbox for layout */
  flex-direction: column; /* Stack items vertically */
  align-items: flex-start; /* Align items to the far left */
  margin-top: 2rem; /* Space above the wrapper */

  @media only screen and ${media.sm} {
    align-items: flex-start; /* Ensure alignment is to the far left on small screens */
  }

  @media only screen and ${media.xl} {
    flex-direction: row; /* Stack items horizontally on larger screens */
    justify-content: flex-start; /* Align items to the start (left) */
  }
`;

// Text styling
export const Text = styled.span`
  display: block; /* Ensure text block formatting */
  white-space: pre-wrap; /* Preserve whitespace and wrap text */
  margin-bottom: 1rem; /* Space below text */

  @media only screen and ${media.xl} {
    margin-bottom: 0; /* Remove bottom margin on larger screens */
  }
`;

// Icon container styling
export const Icons = styled.div`
  margin-left: -0.5rem; /* Negative margins for tight spacing */
  margin-right: -0.5rem;
  display: flex; /* Use flexbox for layout */
  flex-wrap: nowrap; /* Do not wrap icons */

  svg {
    font-size: 2rem; /* Icon size */
    margin-left: 0.5rem; /* Space between icons */
    margin-right: 0.5rem;
  }
`;
