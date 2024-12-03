import React, { useEffect, useState, useRef } from 'react';
import { Table, Typography, Skeleton, Alert, Button, Space, Input, Tag, Popconfirm, message, Select } from 'antd';
import type { InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Highlighter from 'react-highlight-words';
import type { ColumnType } from 'antd/es/table';

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
  const searchInput = useRef<InputRef>(null);

  const getColumnSearchProps = (dataIndex: keyof Record): ColumnType<Record> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Clear
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : '#1890ff' }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase())
        : false,
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/items/flagged_forms_ecapplus_pmp/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === id ? { ...record, status: newStatus } : record
        )
      );
      message.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoadingUserData(false);
      }
    };

    const fetchTableData = async () => {
      try {
        setLoadingTable(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/items/flagged_forms_ecapplus_pmp`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setRecords(response.data.data);
      } catch (err: any) {
        console.error('Error fetching table data:', err);
        setError(err.response?.data?.message || 'Failed to fetch table data.');
      } finally {
        setLoadingTable(false);
      }
    };

    fetchUserData();
    fetchTableData();
  }, []);

  const columns: ColumnType<Record>[] = [
    {
      title: 'ID',
      dataIndex: 'household_id',
      key: 'household_id',
      ...getColumnSearchProps('household_id'),
    }, 
    {
      title: 'Caseworker Name',
      dataIndex: 'caseworker_name',
      key: 'caseworker_name',
      ...getColumnSearchProps('caseworker_name'),
    },
    {
      title: 'Caregiver Name',
      dataIndex: 'caregiver_name',
      key: 'caregiver_name',
      ...getColumnSearchProps('caregiver_name'),
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility',
      ...getColumnSearchProps('facility'),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      ...getColumnSearchProps('comment'),
    },
    {
      title: 'Verifier/Supervisor',
      dataIndex: 'verifier',
      key: 'verifier',
      ...getColumnSearchProps('verifier'),
    },
    {
      title: 'Flag Status',
      dataIndex: 'status',
      key: 'status_display',
      render: (status: string) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Draft':
              return 'orange';
            case 'Published':
              return 'green';
            case 'Archived':
              return 'red';
            default:
              return 'blue';
          }
        };

        return <Tag color={getStatusColor(status)}>{status}</Tag>;
      },
    },
    {
      title: 'Status Filter',
      dataIndex: 'status',
      key: 'status_filter',
      filters: [
        { text: 'Draft', value: 'Draft' },
        { text: 'Published', value: 'Published' },
        { text: 'Archived', value: 'Archived' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string, record) => {
        const handleChange = (newStatus: string) => {
          if (newStatus === 'Published' && !record.comment) {
            message.warning('Cannot publish without resolving the comment.');
            return;
          }
          updateStatus(record.id, newStatus);
        };

        return (
          <Select
            value={status}
            onChange={handleChange}
            style={{ width: 130 }}
          >
            <Option value="Draft">Draft</Option>
            {record.comment && <Option value="Published">Published</Option>}
            <Option value="Archived">Archived</Option>
          </Select>
        );
      },
    },
  ];

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

      {loadingTable ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Table
          scroll={{ x: 500 }}
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </>
  );
};

export default FlagRecordPage;
