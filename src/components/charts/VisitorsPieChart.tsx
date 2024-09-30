import React from 'react';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { useTranslation } from 'react-i18next';
import { PieChart } from '../common/charts/PieChart';

export const VisitorsPieChart: React.FC = () => {
  const { t } = useTranslation();
  const data = [
    { value: 234, name: t('Medium risk'), itemStyle: { color: '#ff9966' } },
    { value: 374, name: t('Low risk'), itemStyle: { color: '#09834D' } },
    { value: 98, name: t('High risk'), itemStyle: { color: '#ff6666' } },
  ];

  return (
    <BaseCard padding="0 0 1.875rem" title={t('Case Classification')}>
      <PieChart data={data} showLegend={true} />
    </BaseCard>
  );
};
