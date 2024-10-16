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
    icon: <HomeOutlined />,
    children: [
      {
        title: 'common.mis-dashboard',
        key: 'mis-dashboard',
        url: '/',
      },
      {
        title: 'common.households-register',
        key: 'households-register',
        url: '/apps/households-register',
      },
      {
        title: 'common.vcas-register',
        key: 'vcas-register',
        url: '/apps/vcas-register',
      },
      // {
      //   title: 'common.households-members-register',
      //   key: 'households-members-register',
      //   url: '/apps/households-members-register',
      // },
    ],
  },
  {
    title: 'User Management',
    key: 'medical-dashboard',
    url: '/users-management-portal',
    icon: <UserOutlined />,
  }
];