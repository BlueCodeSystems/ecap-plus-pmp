import React, { useEffect } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { useResponsive } from '@app/hooks/useResponsive';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { BaseRow } from '../common/BaseRow/BaseRow';
import { BaseCol } from '../common/BaseCol/BaseCol';
import { Skeleton, Tabs } from 'antd';
import { CaregiverPersonalInfo } from './profileCard/ProfileInfo/CaregiverPersonalInfo';
import { CaregiverServicesInfo } from './profileCard/ProfileInfo/CaregiverServicesInfo';
import { CaregiverReferralsInfo } from './profileCard/ProfileInfo/CaregiverReferralsInfo';
import { CaregiverCasePlans } from './profileCard/ProfileInfo/CaregiverCasePlans';
import { HouseholdMembersInfo } from './profileCard/ProfileInfo/HouseholdMembersInfo';

const CaregiverProfileLayout: React.FC = () => {
  const user = useAppSelector((state) => state.user.user);
  const { t } = useTranslation();
  const { isTablet: isTabletOrHigher, mobileOnly } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();

  const { isTablet } = useResponsive();

  const isTitleShown = isTabletOrHigher || (mobileOnly && location.pathname === '/profile');
  const isMenuShown = isTabletOrHigher || (mobileOnly && location.pathname !== '/profile');

  useEffect(() => {
    isTablet && location.pathname === '/apps' && navigate('households-register');
  }, [isTablet, location.pathname, navigate]);

  // Define tab items
  const tabItems = [
    {
      key: 'profile-overview',
      label: t('Caregiver Profile'),
      children: (
        <CaregiverPersonalInfo profileData={user} />
      ),
    },
    {
      key: 'household-members',
      label: t('Caregiver Family Members'),
      children: <HouseholdMembersInfo profileData={user} />, 
    },
    {
      key: 'caregiver-services',
      label: t('Caregiver Caseplans'),
      children: <CaregiverCasePlans profileData={user} />, 
    },
    {
      key: 'referrals',
      label: t('Referrals'),
      children: <CaregiverReferralsInfo profileData={user} />, 
    },
  ];

  return (
    <>
      <PageTitle>{t('Profile Overview')}</PageTitle>
      {!isTitleShown && (
        <BaseButton icon={<LeftOutlined />} type="text" onClick={() => navigate(-1)}>
          {t('Go Previous')}
        </BaseButton>
      )}

      <BaseRow gutter={[30, 30]}>
        <BaseCol span={24}>
          <ProfileCard>
            <Tabs defaultActiveKey="profile-overview" items={tabItems} />
          </ProfileCard>
        </BaseCol>
      </BaseRow>
    </>
  );
};

const ProfileCard = styled(BaseCard)`
  height: unset;
`;

export default CaregiverProfileLayout;
