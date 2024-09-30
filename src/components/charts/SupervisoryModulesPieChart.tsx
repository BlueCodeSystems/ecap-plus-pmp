import React from 'react';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { useTranslation } from 'react-i18next';
import { PieChart } from '../common/charts/PieChart';

export const SupervisoryModulesPieChart: React.FC = () => {
  const { t } = useTranslation();

  // Data array with each department and its corresponding value and color
  const data = [
    { value: 67, name: t('Case Management'), itemStyle: { color: '#7D0000' } }, // Orange
    { value: 34, name: t('Finance'), itemStyle: { color: '#5DA5DA' } },         // Blue
    { value: 78, name: t('Human Resource'), itemStyle: { color: '#FAA43A' } },   // Yellow
    { value: 68, name: t('Procurement'), itemStyle: { color: '#60BD68' } },      // Green
    { value: 88, name: t('Stores'), itemStyle: { color: '#F17CB0' } },           // Pink
  ];

  return (
    <BaseCard padding="0 0 1.875rem" title={t('Score by department')}>
      <PieChart data={data} showLegend={true} />
    </BaseCard>
  );
};