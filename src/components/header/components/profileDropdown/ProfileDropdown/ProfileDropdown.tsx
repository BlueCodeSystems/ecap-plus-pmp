import React, { useEffect, useState } from 'react';
import { ProfileOverlay } from '../ProfileOverlay/ProfileOverlay';
import { useResponsive } from '@app/hooks/useResponsive';
import * as S from './ProfileDropdown.styles';
import { BasePopover } from '@app/components/common/BasePopover/BasePopover';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import axios from 'axios';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  // Add other fields as needed
}

const fetchUserData = async (setUser: React.Dispatch<React.SetStateAction<User | null>>) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Adjust token retrieval as needed
      },
    });
    setUser(response.data.data);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

export const ProfileDropdown: React.FC = () => {
  const { isTablet } = useResponsive();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUserData(setUser);
  }, []);

  return user ? (
    <BasePopover content={<ProfileOverlay />} trigger="click">
      <BaseCol>
      <b>Welcome back, 👋 <br />{user.first_name}!</b><br />
      </BaseCol>
    </BasePopover>
  ) : null;
};