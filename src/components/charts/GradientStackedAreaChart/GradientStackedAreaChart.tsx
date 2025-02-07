import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as echarts from 'echarts';
import { BaseChart } from '@app/components/common/charts/BaseChart';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { themeObject } from '@app/styles/themes/themeVariables';
import { FONT_SIZE, FONT_WEIGHT } from '@app/styles/themes/constants';
import axios from 'axios';
import { Select, Button, Spin, Skeleton, Tag } from 'antd';
import { DeleteOutlined, RiseOutlined } from '@ant-design/icons';
import { useResponsive } from '@app/hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { Parser } from 'json2csv';
import Item from 'antd/lib/list/Item';

const { Option } = Select;

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

export const GradientStackedAreaChart: React.FC = () => {
  const { t } = useTranslation();
  const { isDesktop, isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.theme.theme);

  const [user, setUser] = useState<User | null>(null);
  const [caregiverServicesData, setCaregiverServicesData] = useState<any[]>([]);
  const [vcaServicesData, setVcaServicesData] = useState<any[]>([]);
  const [caregiverReferralsData, setCaregiverReferralsData] = useState<any[]>([]);
  const [vcaReferralsData, setVcaReferralsData] = useState<any[]>([]);  // Added state for VCA Referrals
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [selectedData, setSelectedData] = useState<any[]| null>(null);
  const [selectedOption, setSelectedOption] = useState<string| null>(null);
 
  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch Caregiver Services Data
  useEffect(() => {
    const fetchCaregiverData = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/household/caregiver-services-by-month/${user?.location}`
        );
        setCaregiverServicesData(response.data.data);
      } catch (error) {
        console.error('Error fetching caregiver services data:', error);
      }
    };

    fetchCaregiverData();
  }, [user]);

  // Fetch VCA Services Data
  useEffect(() => {
    const fetchVcaData = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/child/vca-services-by-month/${user?.location}`
        );
        setVcaServicesData(response.data.data);
      } catch (error) {
        console.error('Error fetching VCA services data:', error);
      }
    };

    fetchVcaData();
  }, [user]);

  // Fetch Caregiver Referrals Data
  useEffect(() => {
    const fetchCaregiverReferralsData = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/household/caregiver-referrals-by-month/${user?.location}`
        );
        setCaregiverReferralsData(response.data.data);
      } catch (error) {
        console.error('Error fetching caregiver referrals data:', error);
      }
    };

    fetchCaregiverReferralsData();
  }, [user]);

  // Fetch VCA Referrals Data
  useEffect(() => {
    const fetchVcaReferralsData = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/child/vca-referrals-by-month/${user?.location}`
        );
        setVcaReferralsData(response.data.data);
      } catch (error) {
        console.error('Error fetching VCA referrals data:', error);
      }
    };

    fetchVcaReferralsData();
  }, [user]);
 
  const years: number[] = []; //array of years
  
  // get data for the year array
  const caregiverServicesYearData = () => {
    caregiverServicesData.forEach((item) =>{
      const [ ,year] = item.service_month.split('-');
      const yearNumber = parseInt(year, 10);
      if (year !== null && !years.includes(yearNumber)) {
        years.push(yearNumber);
      }
      years.sort((a, b) => b - a);
    });
    return years;
  }

 const vacServicesYearData = () => {
    vcaServicesData.forEach((item) =>{
      const [ ,year] = item.service_month.split('-');
      const yearNumber = parseInt(year, 10);
     if (year !== null && !years.includes(yearNumber)) {
        years.push(yearNumber);
      }
      years.sort((a, b) => b - a);
    });
    return years;
  }

  const caregiverRefferalsYearData = () => {
    caregiverReferralsData.forEach((item) =>{
      if (item.service_month && typeof item.service_month === 'string'){
        const [month,year] = item.service_month.split('-');
        const yearNumber = parseInt(year, 10);
        if (year !== null && !years.includes(yearNumber)) {
          years.push(yearNumber);
        }
        years.sort((a, b) => b - a);
      }
    });
    return years;
  }

 const vcaRefferalsYearData = () => {
      vcaReferralsData.forEach((item) =>{
      if (item.service_month && typeof item.service_month === 'string'){
        const [month ,year] = item.service_month.split('-');
      const yearNumber = parseInt(year, 10);
      if (year !== null && !years.includes(yearNumber)) {
        years.push(yearNumber);
      }
      years.sort((a, b) => b - a);
      }
    });
    return years;
  }

  const dataCollected = [
    caregiverServicesYearData,
    vacServicesYearData,
    caregiverRefferalsYearData,
    vcaRefferalsYearData
  ];
  //removes duplicates in the years array
  dataCollected.forEach((fn) => {
    fn().forEach((year) => {
      if (!years.includes(year)) {
        years.push(year);
      }
    });
  });
  
  // Process Data for Chart
  const processCaregiverData = () => {
    const months = Array(12).fill(0);
    caregiverServicesData.forEach((item) => {
      const [month,year] = item.service_month.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      if (selectedMonth === null || parseInt(month, 10) === selectedMonth) {
        if(selectedYear === null || selectedYear === parseInt(year, 10) && item.service_month !== null){
          months[monthIndex] += Math.round(item.service_count);
        }
        else{
          months[monthIndex] += 0;
        }
      }
    });
    return months;
  };

  const processVcaData = () => {
    const months = Array(12).fill(0);
    vcaServicesData.forEach((item) => {
      const [month,year] = item.service_month.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      if (selectedMonth === null || parseInt(month, 10) === selectedMonth) {
        if(selectedYear === null || selectedYear === parseInt(year, 10) && item.service_month !== null){
          months[monthIndex] += Math.round(item.service_count);
        }
        else{
          months[monthIndex] += 0;
        }
      }
    });
    return months;
  };

  const processCaregiverReferralsData = () => {
    const months = Array(12).fill(0);
    caregiverReferralsData.forEach((item) => {
      const [month,year] = item.referral_month.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      if (selectedMonth === null || parseInt(month, 10) === selectedMonth) {
        if(selectedYear === null || selectedYear === parseInt(year, 10) && item.referral_month !== null){
          months[monthIndex] += Math.round(item.referral_count);
        }
        else{
          months[monthIndex] += 0;
        }
      }
    });
    return months;
  };

  const processVcaReferralsDataProcessed = () => {  // Process VCA Referrals
    const months = Array(12).fill(0);
    vcaReferralsData.forEach((item) => {
      const [month, year] = item.referral_month.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      if (selectedMonth === null || parseInt(month, 10) === selectedMonth) {
        if(selectedYear === null || selectedYear === parseInt(year, 10) && item.referral_month !== null){
          months[monthIndex] += Math.round(item.referral_count);
        }
        else{
          months[monthIndex] += 0;
        }
      }
    });
    return months;
  };
  const allData = [
    { name: "VCA Services", data: vcaServicesData },
    { name: "VCA Referrals", data: vcaReferralsData },
    { name: "Caregiver Services", data: caregiverServicesData },
    { name: "Caregiver Referrals", data: caregiverReferralsData }
];

//handle datachange
const handleDataChange = (event: any) => {
    const collectData = allData.find((item) => item.name === event);
    if (collectData) {
      setSelectedData(collectData.data);
      setSelectedOption(event);
    }
};

  // Handle month change
  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
  };
  //handle year change
  const handleYearChange = (value: number) => {
    setSelectedYear(value);
  };

  // Clear filter
  const clearFilter = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    setSelectedOption(null);
  };
  
  // Prepare data for chart
  const caregiverData = processCaregiverData();
  const vcaData = processVcaData();
  const caregiverReferralsDataProcessed = processCaregiverReferralsData();
  const vcaReferralsDataProcessed = processVcaReferralsDataProcessed();  // VCA Referrals processed data

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
 
  const monthWithYear = months.map(month => `${month}${selectedYear === null? " " : selectedYear}`); 

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
        'VCA Services',
        'VCA Referrals',
        'Caregiver Services',
        'Caregiver Referrals',
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
        data: monthWithYear,
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
        min: 0,
        axisLabel: {
          fontSize: FONT_SIZE.xxs,
          fontWeight: FONT_WEIGHT.light,
          color: themeObject[theme].textMain,
        },
      },
    ],
    series: [
      {
        name: 'VCA Services',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 0 },
        showSymbol: true,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#01509a' },
            { offset: 1, color: '#ffffff' },
          ]),
        },
        emphasis: { focus: 'series' },
        data: vcaData,
      },
      {
        name: 'VCA Referrals',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 0, color: themeObject[theme].chartColor2 },
        showSymbol: true,
        areaStyle: {
          opacity: 0.9,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeObject[theme].chartColor2 },
            { offset: 0.65, color: themeObject[theme].chartColor2Tint },
          ]),
        },
        emphasis: { focus: 'series' },
        data: vcaReferralsDataProcessed,
      },
      {
        name: 'Caregiver Services',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 0 },
        showSymbol: true,
        areaStyle: {
          opacity: 0.4,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f5af19' },
            { offset: 1, color: '#f12711' },
          ]),
        },
        emphasis: { focus: 'series' },
        data: caregiverData,
      },
      {
        name: 'Caregiver Referrals',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 0, color: themeObject[theme].chartColor3 },
        showSymbol: true,
        areaStyle: {
          opacity: 0.9,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeObject[theme].chartColor4 },
            { offset: 1, color: themeObject[theme].chartColor4Tint },
          ]),
        },
        emphasis: { focus: 'series' },
        data: caregiverReferralsDataProcessed,
      },
    ],
  };
  useEffect(() => {
    if (
      caregiverServicesData.length &&
      caregiverReferralsData.length &&
      vcaServicesData.length &&
      vcaReferralsData.length
    ) {
      setDistrictLoading(false);
    }
  }, [caregiverServicesData, vcaServicesData, caregiverReferralsData, vcaReferralsData]);

  const handleViewDashboards = () => {
    navigate('/visualization-dashboards');
  };

  const exportToCSV = () => {
    try {
        const filteredData = selectedData ? selectedData.filter(item => {
          const services = item.service_month;
          const referrals = item.referral_month;
          // services are selected returns the selected month and year
            if(services !== null || services !== undefined){
              const [month, year] = services && services?.split('-');
              return month == selectedMonth && year == selectedYear; 
            }
            // referrals are selected returns the elected month and year
            else if(referrals && typeof referrals === 'string' && referrals.includes('-') && referrals !== null){
              const [newmonth, newyear] = referrals?.split('-');
              return parseInt(newmonth, 10) == selectedMonth && parseInt(newyear, 10) == selectedYear;
            }
            //specific services and referrals are not selected return month or year data
            else if (services !== null || referrals !== null && referrals !== undefined){
                const [month, year] = services?.split('-');
                const [newmonth, newyear] = referrals?.split('-');
                if(selectedMonth !== null && selectedYear === null){
                  return month == selectedMonth &&  newmonth == selectedMonth;// concatinate the methods that return months
              }
                else if(selectedYear !== null && selectedMonth === null){
                return year == selectedYear && newyear == selectedYear;// concatinate the methods that return years
                }
            }
            // In case none of the conditions are met, explicitly return alert
            return false; 
        }) : [];
        const allDataFilters = () =>{
          if (filteredData?.length === 0) {
            if (selectedMonth === null && selectedYear === null && selectedOption=== null){
                const allInfo = caregiverServicesData.concat(vcaServicesData).concat(caregiverReferralsData).concat(vcaReferralsData);
              return allInfo;
            }
          }
          return [];
        };
      
        
      // Convert to CSV
      const parser = new Parser();
      const csvData = parser.parse(filteredData.length > 0 ? filteredData : allDataFilters());
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedOption? selectedOption : 'All Data'} ${selectedMonth != null ? months[selectedMonth - 1] : ''} ${selectedYear? selectedYear: ""}.csv`;
      link.click();
      }
      catch (error) { 
      console.error('Error exporting data:', error);
    }
      
    };
      
  

  return (
    <BaseCard title={t('Caregiver, VCA Services and Referrals provided in a month')}>
      <Spin spinning={districtLoading}>
        {districtLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <BaseRow>
            <div style={{ marginBottom: 20 }}>
              {/* Row for Select Month and Clear Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Select
                  value={selectedMonth || undefined}
                  onChange={handleMonthChange}
                  placeholder="Select Month"
                  style={{ minWidth: '200px' }}
                >
                  {months.map((month, index) => (
                    <Option key={index} value={index + 1}>
                      {month}
                    </Option>
                  ))}
                </Select>
                
                <Select
                  value={selectedYear || undefined}
                  onChange={handleYearChange}
                  placeholder="Select Year"
                  style={{ minWidth: '200px' }}
                >
                  {years.map((year, index) => (
                    <Option key={index} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={selectedOption}
                  onChange={handleDataChange}
                  placeholder="Select Data"
                  style={{ minWidth: '200px' }}
                >
                  {allData.map((item, index) => (
                    <Option key={index} value={item.name}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
                  
                  {/* Button to export to CSV */}
                  <Button 
                    type="primary" 
                    onClick={exportToCSV}>
                    {selectedMonth ? `Export ${months[selectedMonth - 1]} to CSV` : "Export to CSV"}
                     </Button>

                <Button
                  type="primary"
                  onClick={clearFilter}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <DeleteOutlined style={{ marginRight: 5 }} />
                  {t('Clear Filter')}
                </Button>
              </div>

              {/* "View Dashboards" Button placed below */}
              <div style={{ marginTop: '15px' }}>
                <Button
                  style={{
                    borderRadius: '50px',
                    background: 'linear-gradient(to right, #f5af19, #f12711)',
                    color: 'white',
                    borderTopRightRadius: '90%',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  type="primary"
                  onClick={handleViewDashboards}
                >
                  View Dashboards <RiseOutlined />
                </Button>
              </div>
            </div>
          </BaseRow>
        )}
        {!districtLoading && <BaseChart option={option}/>}
      </Spin>
    </BaseCard>
  );
};
