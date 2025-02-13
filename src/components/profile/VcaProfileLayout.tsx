import React, { useEffect } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { useResponsive } from '@app/hooks/useResponsive';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { BaseRow } from '../common/BaseRow/BaseRow';
import { BaseCol } from '../common/BaseCol/BaseCol';
import { Tabs } from 'antd';
import { VcaPersonalInfo } from './profileCard/ProfileInfo/VcaPersonalInfo';
import { VcaServicesPlan } from './profileCard/ProfileInfo/VcaServicesPlan';
import { VcaReferals } from './profileCard/ProfileInfo/VcaReferals';
import VcaFlaggedRecordForm from './profileCard/ProfileInfo/VcaFlaggedRecordForm';

const VcaProfileLayout: React.FC = () => {
  const user = useAppSelector((state) => state.user.user);
  const { t } = useTranslation();
  const { isTablet: isTabletOrHigher, mobileOnly } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();
  const { unique_id } = useParams<{ unique_id: string }>(); // Extract unique_id from URL
  const { isTablet } = useResponsive();

  const isTitleShown = isTabletOrHigher || (mobileOnly && location.pathname === '/profile');

  useEffect(() => {
    if (isTablet && location.pathname === '/apps') {
      navigate('vcas-register');
    }
  }, [isTablet, location.pathname, navigate]);

  // Define tab items
  const tabItems = [
    {
      key: 'vca-overview',
      label: t('VCA Profile'),
      children: <VcaPersonalInfo />,
    },
    {
      key: 'vca-case-plans',
      label: t('Case Plans'),
      children: <VcaServicesPlan />,
    },
    {
      key: 'referrals',
        label: t('Referrals'),
      children: <VcaReferals />,
    },
    {
      key: 'flag-record-form',
      label: t('Flag Record Form'),
      children: <VcaFlaggedRecordForm />,
    },
  ];

  return (
    <>
      <PageTitle>{t('Profile Overview')}</PageTitle>
      <BaseButton icon={<LeftOutlined />} type="text" onClick={() => navigate(-1)}>
        {t('Go Previous')}
      </BaseButton>

      <BaseRow gutter={[30, 30]}>
        <BaseCol span={24}>
          <ProfileCard>
            <Tabs defaultActiveKey="vca-overview" items={tabItems} />
          </ProfileCard>
        </BaseCol>
      </BaseRow>
    </>
  );
};

const ProfileCard = styled(BaseCard)`
  height: unset;
`;

export default VcaProfileLayout;