import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { Skeleton, Typography } from 'antd';
import { TitleHeader } from '@app/components/apps/newsFeed/NewsFilter/NewsFilter.styles';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const SuperSetPage: React.FC = () => {

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
    <>
      <br />
      <Typography.Title level={4}>Visualizations</Typography.Title>
      <Typography.Title level={5}>{loading ? <Skeleton active paragraph={{ rows: 1 }} /> : `${user?.location}`} District</Typography.Title>
      <TitleHeader>
      Guide: Implement state filters to refine displayed data.
      </TitleHeader> <br />
      <BaseRow gutter={[30, 30]}>
        <BaseCol xs={24} sm={24} md={24} lg={24} xl={24}>
          <BaseCard id="step-form" title={t('forms.stepForm')} padding="1.25rem">
       
          </BaseCard>
        </BaseCol>
      </BaseRow>
    </>
  );
};

export default SuperSetPage;
