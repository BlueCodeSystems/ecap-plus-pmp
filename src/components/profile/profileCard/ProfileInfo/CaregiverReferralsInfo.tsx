import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton, Typography, Alert, Table } from 'antd';
import axios, { AxiosError } from 'axios';
import styled from 'styled-components';

const { Title } = Typography;

const Wrapper = styled.div`
  width: 100%;
`;

interface Referral {
  household_id: string | null;
  referred_date: string | null;
  date_edited: string | null;
  caseworker_name: string | null;
  phone: string | null;
  receiving_organization: string | null;
  date_referred: string | null;
  covid_19: string | null;
  cd4: string | null;
  hiv_adherence: string | null;
  hiv_counseling_testing: string | null;
  post_gbv: string | null;
  substance_abuse: string | null;
  tb_screening: string | null;
  supplementary: string | null;
  prep: string | null;
  f_planning: string | null;
  insecticide: string | null;
  hiv_aids_treatment: string | null;
  f_w_health: string | null;
  vmmc: string | null;
  immunization: string | null;
  condom: string | null;
  routine_care: string | null;
  emergency_care: string | null;
  age_counselling: string | null;
  h_treatment_care: string | null;
  pmtct: string | null;
  hygiene_counselling: string | null;
  transmitted_infections: string | null;
  plha: string | null;
  viral_load: string | null;
  other_health_services: string | null;
  other_education: string | null;
  care_facility: string | null;
  post_violence_trauma: string | null;
  legal_assistance: string | null;
  other_safety_services: string | null;
  vca_uniforms_books: string | null;
  re_enrollment: string | null;
  bursaries: string | null;
  cash_transfer: string | null;
  cash_support: string | null;
  food_security: string | null;
  other_stability_services: string | null;
}

const columns = [
  {
    title: 'Referred Date',
    dataIndex: 'referred_date',
    key: 'referred_date',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
  {
    title: 'Date Edited',
    dataIndex: 'date_edited',
    key: 'date_edited',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
  {
    title: 'Caseworker Name',
    dataIndex: 'caseworker_name',
    key: 'caseworker_name',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
  {
    title: 'Phone',
    dataIndex: 'phone',
    key: 'phone',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
  {
    title: 'Receiving Organization',
    dataIndex: 'receiving_organization',
    key: 'receiving_organization',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
  {
    title: 'HIV Counseling & Testing',
    dataIndex: 'hiv_counseling_testing',
    key: 'hiv_counseling_testing',
    render: (text: string | null) => text ?? 'Not Applicable',
  },
];

const cleanData = (data: Referral[]): Referral[] => {
  return data.map((record) => {
    return {
      ...record,
      household_id: record.household_id ?? 'Not Applicable',
      referred_date: record.referred_date ?? 'Not Applicable',
      date_edited: record.date_edited ?? 'Not Applicable',
      caseworker_name: record.caseworker_name ?? 'Not Applicable',
      phone: record.phone ?? 'Not Applicable',
      receiving_organization: record.receiving_organization ?? 'Not Applicable',
      hiv_counseling_testing: record.hiv_counseling_testing ?? 'Not Applicable',
      // Add additional fields as needed
    };
  });
};

export const CaregiverReferralsInfo: React.FC = () => {
  const location = useLocation();
  const householdId = location.state?.household?.household_id;

  const [isLoading, setLoading] = useState<boolean>(false);
  const [serviceRecords, setServiceRecords] = useState<Referral[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (householdId) {
        setLoading(true);
        try {
          const response = await axios.get(`https://ecapplus.server.dqa.bluecodeltd.com/household/all-referrals/${householdId}`);
          const data = cleanData(response.data.data);
          setServiceRecords(data);
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            setError(err.message);
          } else {
            setError('An unexpected error occurred.');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
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
        rowKey={(record) => record.household_id ?? String(Date.now())} 
      />
    </Wrapper>
  );
};
