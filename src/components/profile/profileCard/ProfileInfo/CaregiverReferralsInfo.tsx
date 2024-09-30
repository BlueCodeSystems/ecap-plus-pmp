import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton, Typography, Alert, Table } from 'antd';
import axios from 'axios';
import styled from 'styled-components';

const { Title } = Typography;

const Wrapper = styled.div`
  width: 100%;
`;

const columns = [
  {
    title: 'referral_date',
    dataIndex: 'referral_date',
    key: 'referral_date',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Health Services',
    dataIndex: 'health_services',
    key: 'health_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'HIV Services',
    dataIndex: 'hiv_services',
    key: 'hiv_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Other Health Services',
    dataIndex: 'other_health_services',
    key: 'other_health_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Safe Services',
    dataIndex: 'safe_services',
    key: 'safe_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'School Services',
    dataIndex: 'schooled_services',
    key: 'schooled_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Stable Services',
    dataIndex: 'stable_services',
    key: 'stable_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
];

const cleanData = (data: any[]) => {
  return data.map((record) => {
    const cleanedRecord = { ...record };

    // Replace null or undefined values with 'Not Applicable'
    Object.keys(cleanedRecord).forEach((key) => {
      if (cleanedRecord[key] === null || cleanedRecord[key] === undefined) {
        cleanedRecord[key] = 'Not Applicable';
      }
    });

    return cleanedRecord;
  });
};

export const CaregiverReferralsInfo: React.FC = () => {
  const location = useLocation();
  const householdId = location.state?.household.household_id;

  const [isLoading, setLoading] = useState(false);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (householdId) {
      setLoading(true);
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/household/all-referrals/527853143`)
        .then((response) => {
          const data = cleanData(response.data.data);
          console.log("referrals:::",response.data.data)
          setServiceRecords(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [householdId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Skeleton active />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Alert
          message="We encountered an error fetching service records. Refresh the page to see if the issue persists."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Wrapper>
      <Title>Caregiver Referrals</Title>
      <Table
        columns={columns}
        dataSource={serviceRecords}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey="referral_date"
      />
    </Wrapper>
  );
};
