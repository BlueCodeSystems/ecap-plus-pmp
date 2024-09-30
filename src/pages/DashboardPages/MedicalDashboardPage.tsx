import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { ScreeningsCard } from '@app/components/medical-dashboard/screeningsCard/ScreeningsCard/ScreeningsCard';
import { References } from '@app/components/common/References/References';
import { useResponsive } from '@app/hooks/useResponsive';
import * as S from './DashboardPage.styles';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { ScatterChart } from '@app/components/charts/ScatterChart/ScatterChart';
import { SupervisoryModulesPieChart } from '@app/components/charts/SupervisoryModulesPieChart';

const MedicalDashboardPage: React.FC = () => {
  const { isTablet, isDesktop } = useResponsive();
  const { t } = useTranslation();

  const desktopLayout = (
    <BaseRow style={{ paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px' }}>
      <BaseRow gutter={[30, 30]}>
        <BaseCol id="latest-screenings" span={24}>
          <ScreeningsCard />
        </BaseCol>
  
        <BaseCol id="activity" span={24} style={{ marginTop: '20px' }}>
          <BaseRow gutter={[30, 30]}>
            <BaseCol id="pie" xs={24} lg={12}>
              <SupervisoryModulesPieChart />
            </BaseCol>
            <BaseCol id="scatter" xs={24} lg={12}>
              <ScatterChart />
            </BaseCol>
          </BaseRow>
        </BaseCol>
      </BaseRow>
      <References />
    </BaseRow>
  );  

  const mobileAndTabletLayout = (
    <BaseRow style={{ paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px' }}>
      <BaseRow gutter={[30, 30]}>
        <BaseCol id="latest-screenings" span={24}>
          <ScreeningsCard />
        </BaseCol>
  
        <BaseCol id="activity" span={24} style={{ marginTop: '20px' }}>
          <BaseRow gutter={[30, 30]}>
            <BaseCol id="pie" xs={24} lg={12}>
              <SupervisoryModulesPieChart />
            </BaseCol>
            <BaseCol id="scatter" xs={24} lg={12}>
              <ScatterChart />
            </BaseCol>
          </BaseRow>
        </BaseCol>
      </BaseRow>
    </BaseRow>
  );

  return (
    <>
      <PageTitle>{t('common.medical-dashboard')}</PageTitle>
      {isDesktop ? desktopLayout : mobileAndTabletLayout}
    </>
  );
};

export default MedicalDashboardPage;