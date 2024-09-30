import { media } from '@app/styles/themes/constants';
import styled from 'styled-components';
import { DashboardCard } from '../../DashboardCard/DashboardCard';

export const ScreeningsCard = styled(DashboardCard)`
  width: 100vw; /* Full width of the viewport */
  max-width: 100%; /* Ensure it doesn't exceed the viewport width */
  
  @media only screen and ${media.xl} {
    .ant-card-body {
      position: relative;
      overflow: hidden;
    }
  }
`;
