import React from 'react';
import {
  CompassOutlined,
  DashboardOutlined,
  FormOutlined,
  HomeOutlined,
  LayoutOutlined,
  LineChartOutlined,
  TableOutlined,
  UserOutlined,
  BlockOutlined,
} from '@ant-design/icons';

export interface SidebarNavigationItem {
  title: string;
  key: string;
  url?: string;
  children?: SidebarNavigationItem[];
  icon?: React.ReactNode;
}

export const sidebarNavigation: SidebarNavigationItem[] = [
  {
    title: 'common.nft-dashboard',
    key: 'nft-dashboard',
    url: '/',
    icon: <DashboardOutlined />, // Dashboard icon for the main NFT Dashboard
    children: [
      {
        title: 'Home',
        key: 'mis-dashboard',
        url: '/',
        icon: < HomeOutlined />, // Home icon for MIS Dashboard
      },
      {
        title: 'common.households-register',
        key: 'households-register',
        url: '/apps/households-register',
        icon: <TableOutlined />, // Table icon for Households Register
      },
      {
        title: 'common.vcas-register',
        key: 'vcas-register',
        url: '/apps/vcas-register',
        icon: <FormOutlined />, // Form icon for VCAs Register
      },
      {
        title: 'Archived Households',
        key: 'households-archived-register',
        url: '/apps/households-archived-register',
        icon: <BlockOutlined />, // Block icon for Archived Households
      },
      {
        title: 'Archived VCAs',
        key: 'vcas--archived-register',
        url: '/apps/vcas-archived-register',
        icon: <BlockOutlined />, // Block icon for Archived VCAs
      },
      {
        title: 'Flagged Records',
        key: 'flagged-records',
        url: '/flagged-records',
        icon: <CompassOutlined />, // Compass icon for Flagged Records
      },
    ],
  },
  {
    title: 'User Management',
    key: 'medical-dashboard',
    url: '/users-management-portal',
    icon: <UserOutlined />, // User icon for User Management
  },
];
