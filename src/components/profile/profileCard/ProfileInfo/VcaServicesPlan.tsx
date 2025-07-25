import React, { useEffect, useState } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton, Typography, Alert, Table, Button, Space, Modal } from 'antd';
import axios from 'axios';
import styled from 'styled-components';
import { BasicTableRow, Pagination } from 'api/table.api';
import { isoToDate } from '@app/utils/utils';

const { Title } = Typography;

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
  text-transform: capitalize;
`;

const initialPagination: Pagination = {
  current: 1,
  pageSize: 100,
};

const cleanData = (data: any[]) => {
  return data.map((record) => {
    const cleanedRecord = { ...record };

    // Replace null or undefined values with 'Not Applicable'
    Object.keys(cleanedRecord).forEach((key) => {
      if (cleanedRecord[key] === null || cleanedRecord[key] === undefined) {
        cleanedRecord[key] = 'Not Applicable';
      }

      // Remove '[' and ']' from string values
      if (typeof cleanedRecord[key] === 'string') {
        cleanedRecord[key] = cleanedRecord[key].replace(/[\[\]"]/g, '');
      }
    });

    return cleanedRecord;
  });
};

export const VcaServicesPlan: React.FC = () => {
  const location = useLocation();
  const vcaId = location.state?.vca.uid;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setLoading] = useState(false);
  const [casePlans, setCasePlans] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [filteredCasePlans, setFilteredCasePlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  // Apply search filtering
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = casePlans.filter((records) =>
      (records.health_services?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (records.other_health_services?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (records.safe_services?.toLowerCase() || '').includes(lowerCaseQuery)

    );
    setFilteredCasePlans(filtered);
  }, [searchQuery, casePlans]);

  useEffect(() => {
    if (vcaId) {
      setTableData((prev) => ({ ...prev, loading: true }));
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/child/vca-caseplans/${vcaId}`)
        .then((response) => {
          const data = cleanData(response.data.data);
          setTableData({ data: data, pagination: initialPagination, loading: false });
          setCasePlans(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setTableData((prev) => ({ ...prev, loading: false }));
        });
    }
  }, [vcaId]);

  useEffect(() => {
    if (vcaId) {
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/child/vca-services/${vcaId}`)
        .then((response) => {
          const data = cleanData(response.data.data);
          setServiceRecords(data);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [vcaId]);

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

  const handleView = (unique_id: string) => {
    const filtered = serviceRecords.filter((record) => record.vcaid === unique_id);
    const startIndex = Math.floor(Math.random() * 3);
    const slicedFiltered = filtered.slice(0, startIndex + 1);
    setFilteredServices(slicedFiltered);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'case_plan_date',
      key: 'case_plan_date',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'status',
      dataIndex: 'case_plan_status',
      key: 'case_plan_status',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Created At',
      dataIndex: 'date_created',
      key: 'date_created',
      render: (text: string | null) => {
        if (text) {
          const date = isoToDate(text);
          return date.toLocaleDateString();
        } else {
          return 'Not Applicable';
        }
      },
    },
    {
      title: t('Actions'),
      dataIndex: '',
      render: (text: string, record: BasicTableRow) => (
        <BaseSpace>
          <BaseButton type="primary" onClick={() => handleView(record.unique_id)}>
            {t('View Services')}
          </BaseButton>
        </BaseSpace>
      ),
    },

  ];

  const servicesColumns = [
    {
      title: 'Service Date',
      dataIndex: 'service_date',
      key: 'service_date',
      render: (text: string | null) => {
        if (text) {
          const date = isoToDate(text);
          return date.toLocaleDateString();
        } else {
          return 'Not Applicable';
        }
      },
    },
    {
      title: 'Health Services',
      dataIndex: 'health_services',
      key: 'health_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'HIV Services',
      dataIndex: 'hiv_services',
      key: 'hiv_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Other Health Services',
      dataIndex: 'other_health_services',
      key: 'other_health_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Safe Services',
      dataIndex: 'safe_services',
      key: 'safe_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'School Services',
      dataIndex: 'schooled_services',
      key: 'schooled_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
    {
      title: 'Stable Services',
      dataIndex: 'stable_services',
      key: 'stable_services',
      render: (text: string | null) => (text ? text : 'Not Applicable'),
    },
  ];

  return (
    <div style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <BaseTable
          scroll={{ x: 200 }}
          dataSource={tableData.data}
          columns={columns}
          pagination={tableData.pagination}
          onChange={(pagination) => { }}
          loading={tableData.loading}
          tableLayout="fixed"
        />
      </Space>

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
          <Title>Vca Services</Title>
          <Table
            scroll={{ x: 200 }}
            columns={servicesColumns}
            dataSource={filteredServices}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: serviceRecords.length,
              onChange: handlePageChange,
            }}
            rowKey="service_date"
          />
        </Wrapper>

      </Modal>
    </div>
  );
};
