import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EditableTable } from '@app/components/tables/editableTable/EditableTable';
import { Skeleton, Tag, Typography } from 'antd';
import axios from 'axios';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const HouseholdsRegisterPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);

        // Fetch user data from the API
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
      <Typography.Title level={4}>
        {loadingUserData ? <Skeleton.Input active size="small" /> : `${user?.location}`} District Households Register
      </Typography.Title>
      <Tag color="volcano">
        Note: Only active caregivers are shown.
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
        <EditableTable />
      )}
    </>
  );
};

export default HouseholdsRegisterPage;
