import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton, Tag, Typography } from 'antd';
import axios from 'axios';
import TreeTableArchived from '@app/components/tables/TreeTable/TreeTableArchived';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const VcasArchivedRegisterPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        // Simulate a 5-second delay before fetching user data
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUserData(false);
        setLoadingTable(false);
      }
    };

    fetchUserData();
  }, []);

  const content = (
    <>
      <Typography.Title level={4}> {loadingUserData ? <Skeleton.Input active size="small" /> : `${user?.location}`} District VCAs Archived Register</Typography.Title>
      <Tag color="volcano">
        Note: Only deregistered VCAs are shown.
      </Tag>
      <br />   
      <br />
    </>

  );

  return (
    <>
      {content}
      {loadingTable ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <TreeTableArchived />
      )}
    </>
  );
};

export default VcasArchivedRegisterPage;
