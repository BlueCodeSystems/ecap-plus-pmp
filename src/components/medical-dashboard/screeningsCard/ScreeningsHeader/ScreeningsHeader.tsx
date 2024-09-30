import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { Typography, Spin } from 'antd';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

export const ScreeningsHeader: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <BaseRow gutter={[0, { xs: 15, sm: 15, md: 20 }]} align="middle">
      <BaseCol xs={24} xl={12}>
        {t('District Technical Performance')}
        <br />
        {t('Monitoring Tool')}
        <br />
        <br />
        <Typography style={{ fontWeight: 'bold' }}>
          {loading ? <Spin size="small" /> : `${user?.location}`} District
        </Typography>
      </BaseCol>
    </BaseRow>
  );
};
