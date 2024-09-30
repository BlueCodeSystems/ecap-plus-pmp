import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton, Typography, Alert, Table, Button } from 'antd';
import axios from 'axios';
import styled from 'styled-components';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';  // Import jsPDF
import 'jspdf-autotable';  // Import jsPDF autoTable

const { Title } = Typography;

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
  text-transform: capitalize;
`;

const ExportWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

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

const cleanData = (data: any[]) => {
  return data.map((record) => {
    const cleanedRecord = { ...record };


    Object.keys(cleanedRecord).forEach((key) => {
      if (cleanedRecord[key] === null || cleanedRecord[key] === undefined) {
        cleanedRecord[key] = 'Not Applicable';
      }

      if (typeof cleanedRecord[key] === 'string') {
        cleanedRecord[key] = cleanedRecord[key].replace(/[\[\]"]/g, '');
      }
    });

    return cleanedRecord;
  });
};


export const CaregiverReferrals: React.FC = () => {
  const location = useLocation();
  const householdId = location.state?.household.household_id;

  const [isLoading, setLoading] = useState(false);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (householdId) {
      setLoading(true);
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/household/all-referrals/${householdId}`)
        .then((response) => {

          const data = cleanData(response.data.data);

          setServiceRecords(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [householdId]);

  const exportCSV = () => {
    const csv = Papa.unparse(serviceRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vca-referrals.csv');
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Vca Referrals', 14, 10);
    doc.autoTable({
      head: [columns.map(col => col.title)],
      body: serviceRecords.map(record => columns.map(col => record[col.dataIndex])),
    });
    doc.save('vca-referrals.pdf');
  };

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
      <ExportWrapper>
        <Button onClick={exportCSV} type="primary" style={{ marginRight: 8 }}>
          Export CSV
        </Button>
        <Button onClick={exportPDF} type="primary">
          Export PDF
        </Button>
      </ExportWrapper>
      <Table
        columns={columns}
        dataSource={serviceRecords}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey="referred_date"
      />
    </Wrapper>
  );
};
