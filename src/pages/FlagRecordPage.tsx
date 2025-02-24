import React, { useEffect, useState, useRef } from 'react';
import { Table, Typography, Skeleton, Alert, Button, Space, Input, Tag, message, Select } from 'antd';
import { SearchOutlined} from '@ant-design/icons';
import axios from 'axios';
import Highlighter from 'react-highlight-words';
import type { ColumnType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom'; // Use useNavigate for navigation

const { Option } = Select;

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

interface Record {
  id: string;
  household_id: string;
  caseworker_name: string;
  caregiver_name: string;
  facility: string;
  vca_id: string;
  comment: string;
  verifier: string;
  status: string;
  created_at: string;
}

const FlagRecordPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<typeof Input>(null);
  const navigate = useNavigate(); 

  const getColumnSearchProps = (dataIndex: keyof Record): ColumnType<Record> => ({
    // ...existing search logic
  });

 
  const handleExport = () => {
    console.log('Exporting records...');
    try {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['Household ID,Caseworker Name,Caregiver Name,Facility,Comment,Verifier,Status,Created At']
          .concat(
            records.map(
              (record) =>
                `${record.household_id},${record.caseworker_name},${record.caregiver_name},${record.facility},${record.comment},${record.verifier},${record.status},${record.created_at}`
            )
          )
          .join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'district_flagged_records.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Exported successfully!');
      console.log('Export successful!');
    } catch (error) {
      console.error('Error exporting data:', error);
      message.error('Failed to export records.');
    }
  };

  useEffect(() => {
    console.log('Fetching user data...');
    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        console.log('User data fetched:', response.data.data);
        setUser(response.data.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoadingUserData(false);
      }
    };

    console.log('Fetching records...');
    const fetchTableData = async () => {
      try {
        setLoadingTable(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/items/flagged_forms_ecapplus_pmp`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        console.log('Records fetched:', response.data.data);
        setRecords(response.data.data);
      } catch (err) {
        console.error('Error fetching table data:', err);
        setError('Failed to fetch table data.');
      } finally {
        setLoadingTable(false);
      }
    };

    fetchUserData();
    fetchTableData();
  }, []);

  const columns: ColumnType<Record>[] = [
    {
      title: 'Household ID',
      dataIndex: 'household_id',
      key: 'household_id',
    },
    {
      title: 'Caseworker Name',
      dataIndex: 'caseworker_name',
      key: 'caseworker_name',
    },
    {
      title: 'Caregiver Name',
      dataIndex: 'caregiver_name',
      key: 'caregiver_name',
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Verifier',
      dataIndex: 'verifier',
      key: 'verifier',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={text === 'Pending' ? 'orange' : text === 'Approved' ? 'green' : 'red'}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  // Function to handle row click
  const handleRowClick = (record: Record) => {
    return {
      onClick: () => {
        navigate(`/profile/household-profile/${encodeURIComponent(record.household_id)}`, {
          state: { household: record }, // Pass the full household object
        });
      },
      style: { cursor: 'pointer' }, 
    };
  };
  

  return (
    <>
      <Typography.Title level={4}>
        {loadingUserData ? (
          <Skeleton.Input active size="small" />
        ) : (
          `${user?.location} District Flagged Records`
        )}
      </Typography.Title>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

       {/***
      <Button
        type="primary"
        onClick={handleExport}
        style={{ marginBottom: '20px' }} 
      >
        Export to CSV
      </Button>
        **/}
        
      {loadingTable ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Table
          scroll={{ x: 500 }}
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          onRow={handleRowClick} 
        />
      )}
    </>
  );
};

export default FlagRecordPage;