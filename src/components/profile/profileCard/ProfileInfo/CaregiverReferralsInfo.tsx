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
  schooled_services: string | null;
  stable_services: string | null;
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
    title: 'Referral Date',
    dataIndex: 'referred_date',
    key: 'referred_date',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Case Worker',
    dataIndex: 'caseworker_name',
    key: 'caseworker_name',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Phone',
    dataIndex: 'phone',
    key: 'phone',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Receiving Organisation',
    dataIndex: 'receiving_organization',
    key: 'receiving_organization',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Date Referred',
    dataIndex: 'referred_date',
    key: 'referred_date',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Covid-19',
    dataIndex: 'covid_19',
    key: 'covid_19',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'CD4',
    dataIndex: 'cd4',
    key: 'cd4',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'HIV Adherence',
    dataIndex: 'hiv_adherence',
    key: 'hiv_adherence',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'HIV Counselling Testing',
    dataIndex: 'hiv_counseling_testing',
    key: 'hiv_counseling_testing',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Post GBV',
    dataIndex: 'post_gbv',
    key: 'post_gbv',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Post GBV',
    dataIndex: 'post_gbv',
    key: 'post_gbv',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Substance Abuse',
    dataIndex: 'substance_abuse',
    key: 'substance_abuse',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'TB Screening',
    dataIndex: 'tb_screening',
    key: 'tb_screening',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'TB Supplementary',
    dataIndex: 'supplementary',
    key: 'supplementary',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Post GBV',
    dataIndex: 'post_gbv',
    key: 'post_gbv',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Supplementary',
    dataIndex: 'supplementary',
    key: 'supplementary',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Family Planning',
    dataIndex: 'f_planning',
    key: 'f_planning',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Insecticide',
    dataIndex: 'insecticide',
    key: 'insecticide',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Hiv Aids Treatment',
    dataIndex: 'hiv_aids_treatment',
    key: 'hiv_aids_treatment',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'F W Health',
    dataIndex: 'f_w_health',
    key: 'f_w_health',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'VMMC',
    dataIndex: 'vmmc',
    key: 'vmmc',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Immunization',
    dataIndex: 'immunization',
    key: 'immunization',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Condom',
    dataIndex: 'condom',
    key: 'condom',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Routine Care',
    dataIndex: 'routine_care',
    key: 'routine_care',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Emmegency Care',
    dataIndex: 'emergency_care',
    key: 'emergency_care',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Age Counselling',
    dataIndex: 'age_counselling',
    key: 'age_counselling',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'H Treatment Care',
    dataIndex: 'h_treatment_care',
    key: 'h_treatment_care',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'PMTCT',
    dataIndex: 'pmtct',
    key: 'pmtct',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Hygiene Counselling',
    dataIndex: 'hygiene_counselling',
    key: 'hygiene_counselling',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Transmitted Infections',
    dataIndex: 'transmitted_infections',
    key: 'transmitted_infections',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'PLHA',
    dataIndex: 'plha',
    key: 'plha',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Viral Load',
    dataIndex: 'viral_load',
    key: 'viral_load',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Other Health Services',
    dataIndex: 'other_health_services',
    key: 'other_health_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Other Education',
    dataIndex: 'other_education',
    key: 'other_education',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Care Facility',
    dataIndex: 'care_facility',
    key: 'care_facility',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Post Violence Trauma',
    dataIndex: 'post_violence_trauma',
    key: 'post_violence_trauma',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Legal Assistance',
    dataIndex: 'legal_assistance',
    key: 'legal_assistance',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Other Safety Services',
    dataIndex: 'other_safety_services',
    key: 'other_safety_services',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'VCA Uniforms Books',
    dataIndex: 'vca_uniforms_books',
    key: 'vca_uniforms_books',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Re Enrollment',
    dataIndex: 're_enrollment',
    key: 're_enrollment',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Bursaries',
    dataIndex: 'bursaries',
    key: 'bursaries',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Cash Transfers',
    dataIndex: 'cash_transfer',
    key: 'cash_transfer',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Cash Support',
    dataIndex: 'cash_support',
    key: 'cash_support',
    render: (text: string | null) => text ? text : 'Not Applicable',
  },
  {
    title: 'Food Security',
    dataIndex: 'food_security',
    key: 'food_security',
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
      covid_19: record.covid_19 ?? 'Not Applicable',
      cd4: record.cd4 ?? 'Not Applicable',
      hiv_adherence: record.hiv_adherence ?? 'Not Applicable',
      hiv_counseling_testing: record.hiv_counseling_testing ?? 'Not Applicable',
      post_gbv: record.post_gbv ?? 'Not Applicable',
      substance_abuse: record.substance_abuse ?? 'Not Applicable',
      tb_screening: record.tb_screening ?? 'Not Applicable',
      supplementary: record.supplementary ?? 'Not Applicable',
      f_planning: record.f_planning ?? 'Not Applicable',
      insecticide: record.insecticide ?? 'Not Applicable',
      hiv_aids_treatment: record.hiv_aids_treatment ?? 'Not Applicable',
      f_w_health: record.f_w_health ?? 'Not Applicable',
      vmmc: record.vmmc ?? 'Not Applicable',
      immunization: record.immunization ?? 'Not Applicable',
      condom: record.condom ?? 'Not Applicable',
      routine_care: record.routine_care ?? 'Not Applicable',
      emergency_care: record.emergency_care ?? 'Not Applicable',
      age_counselling: record.age_counselling ?? 'Not Applicable',
      h_treatment_care: record.h_treatment_care ?? 'Not Applicable',
      pmtct: record.pmtct ?? 'Not Applicable',
      hygiene_counselling: record.hygiene_counselling ?? 'Not Applicable',
      transmitted_infections: record.transmitted_infections ?? 'Not Applicable',
      plha: record.plha ?? 'Not Applicable',
      viral_load: record.viral_load ?? 'Not Applicable',
      other_health_services: record.other_health_services ?? 'Not Applicable',
      other_education: record.other_education ?? 'Not Applicable',
      care_facility: record.care_facility ?? 'Not Applicable',
      post_violence_trauma: record.post_violence_trauma ?? 'Not Applicable',
      legal_assistance: record.legal_assistance ?? 'Not Applicable',
      other_safety_services: record.other_safety_services ?? 'Not Applicable',
      vca_uniforms_books: record.vca_uniforms_books ?? 'Not Applicable',
      re_enrollment: record.re_enrollment ?? 'Not Applicable',
      bursaries: record.bursaries ?? 'Not Applicable',
      cash_transfer: record.cash_transfer ?? 'Not Applicable',
      cash_support: record.cash_support ?? 'Not Applicable',
      food_security: record.food_security ?? 'Not Applicable',
      schooled_services: record.schooled_services ?? 'Not Applicable',
      stable_services: record.stable_services ?? 'Not Applicable',
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
