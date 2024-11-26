import React, { useEffect, useState } from 'react';
import { Table, Modal, Button, Space, Skeleton, Alert, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { isoToDate } from '@app/utils/utils';

const { Title } = Typography;

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
  text-transform: capitalize;
`;

const initialPagination = {
  current: 1,
  pageSize: 10,
};

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

export const CaregiverCasePlans: React.FC = () => {
  const location = useLocation();
  const householdId = location.state?.household.household_id;

  const [casePlans, setCasePlans] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [filteredCasePlans, setFilteredCasePlans] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPagination.current);
  const [pageSize, setPageSize] = useState(initialPagination.pageSize);

  useEffect(() => {
    if (householdId) {
      setLoading(true);
      // Fetch Caregiver Case Plans
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/household/caregiver-caseplans/${householdId}`)
        .then((response) => {
          const data = cleanData(response.data.data);
          setCasePlans(data);
          setFilteredCasePlans(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });

      // Fetch Caregiver Services
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/household/caregiver-services/${householdId}`)
        .then((response) => {
          const data = cleanData(response.data.data);
          setServiceRecords(data);
        })
        .catch((err) => setError(err.message));
    }
  }, [householdId]);

  const handleView = (unique_id: string) => {
    const filtered = serviceRecords.filter((record) => record.vcaid === unique_id);
    setFilteredServices(filtered);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'case_plan_date',
      key: 'case_plan_date',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Status',
      dataIndex: 'case_plan_status',
      key: 'case_plan_status',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Created At',
      dataIndex: 'date_created',
      key: 'date_created',
      render: (text: string | null) => (text ? isoToDate(text).toLocaleDateString() : 'Not Applicable'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => handleView(record.unique_id)}>
            View Services
          </Button>
        </Space>
      ),
    },
  ];

  const servicesColumns = [
    { title: 'Service Date', dataIndex: 'service_date', key: 'service_date' },
    { title: 'Is HIV Positive', dataIndex: 'is_hiv_positive', key: 'is_hiv_positive' },
    { title: 'Last Viral Load Result', dataIndex: 'vl_last_result', key: 'vl_last_result' },
    { title: 'Health Services', dataIndex: 'health_services', key: 'health_services' },
    { title: 'HIV Services', dataIndex: 'hiv_services', key: 'hiv_services' },
    { title: 'Other Health Services', dataIndex: 'other_health_services', key: 'other_health_services' },
    { title: 'Safe Services', dataIndex: 'safe_services', key: 'safe_services' },
    { title: 'Other Safe Services', dataIndex: 'other_safe_services', key: 'other_safe_services' },
    { title: 'Schooled Services', dataIndex: 'schooled_services', key: 'schooled_services' },
    { title: 'Other Schooled Services', dataIndex: 'other_schooled_services', key: 'other_schooled_services' },
    { title: 'Stable Services', dataIndex: 'stable_services', key: 'stable_services' },
    { title: 'Other Stable Services', dataIndex: 'other_stable_services', key: 'other_stable_services' },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Skeleton active />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert
          message="We encountered an error while fetching data."
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ margin: '20px' }}>
      <Table
        scroll={{ x: 200 }}
        dataSource={filteredCasePlans}
        columns={columns}
        rowKey="unique_id"
        pagination={{ current: currentPage, pageSize: pageSize, total: filteredCasePlans.length, onChange: handlePageChange }}
      />

      <Modal
        title="Service Records"
        open={isModalVisible}
        onCancel={handleCancel}
        width="80%"
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        <Wrapper>
          <Title>Caregiver Services</Title>
          <Table
           scroll={{ x: 200 }}
            columns={servicesColumns}
            dataSource={filteredServices}
            rowKey="service_date"
            pagination={{ current: currentPage, pageSize, total: filteredServices.length, onChange: handlePageChange }}
          />
        </Wrapper>
      </Modal>
    </div>
  );
};
