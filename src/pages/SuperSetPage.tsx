import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Skeleton, Typography, Alert } from 'antd';
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
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
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
      <Typography.Title level={4}>
        {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : `${user?.location}`} District
      </Typography.Title>
      <Alert
        message="Notice"
        description="Some features, such as filtering and interaction with charts, depend on your permissions and they are not filtered charts based on user or province location. Contact admin or support for access."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
      <iframe
        src="https://superset.ccms.bluecodeltd.com/superset/dashboard/p/bPr1NLOxjkQ/"
        style={{ width: '100%', height: '80vh', border: 'none' }}
        title="Superset Dashboard"
      />
    </>
  );
};

export default SuperSetPage;