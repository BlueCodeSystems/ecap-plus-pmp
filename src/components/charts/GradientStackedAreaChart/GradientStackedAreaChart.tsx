import React from 'react';
import { useTranslation } from 'react-i18next';
import * as echarts from 'echarts';
import { BaseChart } from '@app/components/common/charts/BaseChart';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { themeObject } from '@app/styles/themes/themeVariables';
import { FONT_SIZE, FONT_WEIGHT } from '@app/styles/themes/constants';

export const GradientStackedAreaChart: React.FC = () => {
  const { t } = useTranslation();
  const theme = useAppSelector((state) => state.theme.theme);

  // Sample months data (ensuring all 12 months are covered)
  const months = [
    t('January'),
    t('February'),
    t('March'),
    t('April'),
    t('May'),
    t('June'),
    t('July'),
    t('August'),
    t('September'),
    t('October'),
    t('November'),
    t('December'),
  ];

  // Extended data arrays to cover all 12 months
  const monthlyData = [120, 132, 101, 134, 90, 230, 210, 230, 145, 155, 166, 180];
  const vcaServicesData = [150, 230, 224, 218, 135, 147, 260, 220, 180, 190, 200, 210];
  const householdServicesData = [220, 182, 191, 234, 290, 330, 310, 320, 340, 350, 360, 370];
  const referralsData = [320, 332, 301, 334, 390, 330, 320, 310, 315, 325, 335, 345];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: themeObject[theme].chartTooltipLabel,
        },
      },
    },
    legend: {
      data: [
        'Caregiver Services',
        'VCA Services',
        'Household Services',
        'Referrals'
      ],
      top: 0,
      left: 10,
      textStyle: {
        color: themeObject[theme].textMain,
      },
    },
    grid: {
      top: 80,
      left: 20,
      right: 20,
      bottom: 0,
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: months, // Updated to include all months
        axisLabel: {
          fontSize: FONT_SIZE.xxs,
          fontWeight: FONT_WEIGHT.light,
          color: themeObject[theme].primary,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          fontSize: FONT_SIZE.xxs,
          fontWeight: FONT_WEIGHT.light,
          color: themeObject[theme].textMain,
        },
      },
    ],
    series: [
      {
        name: 'Caregiver Services',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: themeObject[theme].chartColor1,
            },
            {
              offset: 1,
              color: themeObject[theme].chartColor1Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: monthlyData,
      },
      {
        name: 'VCA Services',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: themeObject[theme].chartColor2,
            },
            {
              offset: 0.82,
              color: themeObject[theme].chartColor2Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: vcaServicesData,
      },
      {
        name: 'Household Services',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: themeObject[theme].chartColor3,
            },
            {
              offset: 0.65,
              color: themeObject[theme].chartColor3Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: householdServicesData,
      },
      {
        name: 'Referrals',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: themeObject[theme].chartColor4,
            },
            {
              offset: 1,
              color: themeObject[theme].chartColor4Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: referralsData,
      },
    ],
  };

  return (
    <BaseCard padding="0 0 1.875rem" title="Services provided in a month">
      <BaseChart option={option} />
    </BaseCard>
  );
};
