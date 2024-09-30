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
import { MemberPersonalInfo } from './profileCard/ProfileInfo/MemberPersonalInfo';
import { MembersServicesPlan } from './profileCard/ProfileInfo/MembersServicesPlan';
import { MembersReferals } from './profileCard/ProfileInfo/MembersReferals';


const MemberProfileLayout: React.FC = () => {
  const user = useAppSelector((state) => state.user.user);
  const { t } = useTranslation();
  const { isTablet: isTabletOrHigher, mobileOnly } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();

  const { isTablet } = useResponsive();

  const isTitleShown = isTabletOrHigher || (mobileOnly && location.pathname === '/profile');
  const isMenuShown = isTabletOrHigher || (mobileOnly && location.pathname !== '/profile');

  useEffect(() => {
    isTablet && location.pathname === '/apps' && navigate('households-members-register');
  }, [isTablet, location.pathname, navigate]);

  // Define tab items
  const tabItems = [
    {
      key: 'member-overview',
      label: t('Member Profile'),
      children: (
        <MemberPersonalInfo profileData={user} />
      ),
    },
    {
      key: 'member-case-plans',
      label: t('Case Plans'), 
      children: <MembersServicesPlan profileData={user} />, 
    },
    {
      key: 'referrals',
      label: t('Referrals'),
      children: <MembersReferals profileData={user} />, 
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
            <Tabs defaultActiveKey="member-overview" items={tabItems} />
          </ProfileCard>
        </BaseCol>
      </BaseRow>
    </>
  );
};

const ProfileCard = styled(BaseCard)`
  height: unset;
`;

export default MemberProfileLayout;
