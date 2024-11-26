import React, { useEffect, useState } from 'react';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { References } from '@app/components/common/References/References';
import { useResponsive } from '@app/hooks/useResponsive';
import { Balance } from '@app/components/nft-dashboard/Balance/Balance';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { Button, Skeleton, Typography } from 'antd';
import axios from 'axios';
import { GradientStackedAreaChart } from '@app/components/charts/GradientStackedAreaChart/GradientStackedAreaChart';
import { RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const MedicalDashboardPage: React.FC = () => {
  
  const { isDesktop, isMobile, isTablet } = useResponsive();
  const [user, setUser] = useState<User | null>(null);
  const [vcasCount, setVCAsCount] = useState(0);
  const [householdCount, setHouseholdCount] = useState(0);
  const [districtLoading, setDistrictLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setDistrictLoading(true);
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/household/households-count/${user?.location}`
        );
        setHouseholdCount(response.data.count);
      } catch (error) {
        console.error('Error fetching household count data:', error);
      } finally {
        setDistrictLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/child/vcas-count/${user?.location}`
        );
        setVCAsCount(response.data.count);
      } catch (error) {
        console.error('Error fetching VCAs data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const desktopLayout = (
    <>
      <div style={{ margin: '20px' }}>
        <BaseRow gutter={[80, 80]}>
          <BaseCol span={6}>
            <Typography.Title style={{ textAlign: 'center' }} level={4}>
              Location
            </Typography.Title>
            <Typography.Title style={{ textAlign: 'center' }} level={4}>
              {districtLoading ? <Skeleton /> : `${user?.location} District`}
            </Typography.Title>
          </BaseCol>
          <BaseCol xs={24} lg={9}>
            <div id="balance" style={{ marginBottom: '20px' }}>
              <Balance title="Households" count={householdCount} />
            </div>
          </BaseCol>
          <BaseCol xs={24} lg={9}>
            <div id="balance" style={{ marginBottom: '20px' }}>
              <Balance title="VCAs" count={vcasCount} />
            </div>
          </BaseCol>
        </BaseRow>
        <BaseRow gutter={[60, 60]} style={{ marginTop: '40px' }}>
          <BaseCol xs={24} xxl={12}>
            <GradientStackedAreaChart />
          </BaseCol>
        </BaseRow>
        <References />
      </div>
    </>
  );

  const mobileAndTabletLayout = (
    <>
      <BaseRow gutter={[20, 24]} style={{ marginBottom: '20px', textAlign: 'center' }}>
      </BaseRow>
      <BaseRow gutter={[20, 24]}>
        <BaseCol xs={24} sm={12} md={8}>
          <Typography.Title style={{ textAlign: 'center' }} level={4}>
            Location
          </Typography.Title>
          <Typography.Title style={{ textAlign: 'center' }} level={4}>
            {districtLoading ? <Skeleton /> : `${user?.location} District`}
          </Typography.Title>
        </BaseCol>
        <BaseCol xs={24} sm={12} md={8}>
          <div id="balance">
            <Balance title="Households" count={householdCount} />
          </div>
        </BaseCol>
        <BaseCol xs={24} sm={12} md={8}>
          <div id="balance">
            <Balance title="VCAs" count={vcasCount} />
          </div>
        </BaseCol>
        <BaseCol xs={24} lg={12}>
          <GradientStackedAreaChart />
        </BaseCol>
      </BaseRow>
    </>
  );

  return (
    <>
      <PageTitle>ECAP+ PMP</PageTitle>
      {isDesktop ? desktopLayout : mobileAndTabletLayout}
    </>
  );
};

export default MedicalDashboardPage;
