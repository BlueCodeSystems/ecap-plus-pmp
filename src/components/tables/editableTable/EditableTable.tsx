import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input, InputRef, Button, Tooltip, Space, Row, Col, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { BasicTableRow, Pagination } from 'api/table.api';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Household {
  household_id: string;
  caregiver_name: string;
  homeaddress: string;
  facility: string;
  province: string;
  ward: string;
  caseworker_name: string;
}

const initialPagination: Pagination = {
  current: 1,
  pageSize: 100,
};

export const EditableTable: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([]);
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [user, setUser] = useState<any | null>(null);
  const navigate = useNavigate();
const searchInput = useRef<InputRef>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');

  const [subPopulationFilters, setSubPopulationFilters] = useState({
    calhiv: 'all',
    hei: 'all',
    cwlhiv: 'all',
    agyw: 'all',
    csv: 'all',
    cfsw: 'all',
    abym: 'all',
  });

  const subPopulationFilterLabels = {
    calhiv: 'CALHIV',
    hei: 'HEI',
    cwlhiv: 'CWLHIV',
    agyw: 'AGYW',
    csv: 'CSV',
    cfsw: 'CFSW',
    abym: 'ABYM',
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchHouseholds = async () => {
      if (!user) return;
      try {
        setTableData((prev) => ({ ...prev, loading: true }));
        const response = await axios.get(`https://ecapplus.server.dqa.bluecodeltd.com/household/all-households`);
        setHouseholds(response.data.data);
      } catch (error) {
        console.error('Error fetching households data:', error);
      } finally {
        setTableData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchHouseholds();
  }, [user]);

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const handleSubPopulationFilterChange = (filterName: keyof typeof subPopulationFilters, value: string) => {
    setSubPopulationFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
  <Input
  ref={searchInput}
  placeholder={`Search ${dataIndex}`}
  value={selectedKeys[0]}
  onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
  onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
  style={{ marginBottom: 8, display: 'block' }}
/>;
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
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Reset table
          </Button>
          <Button
            type="link"
            size="small"
            onClick={close}
          >
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: any) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: { [x: string]: any; }) => {
      const fieldValue = record[dataIndex];
      return fieldValue ? fieldValue.toString().toLowerCase().includes(value.toLowerCase()) : false;
    },
    onFilterDropdownVisibleChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text: { toString: () => any; }) =>
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

  const columns = [
    {
      title: t('Household ID'),
      dataIndex: 'household_id',
      width: '20%',
      ...getColumnSearchProps('household_id'),
    },
    {
      title: t('Caregiver Name'),
      dataIndex: 'name',
      width: '20%',
      ...getColumnSearchProps('name'),
    },
    {
      title: t('Household Details'),
      dataIndex: 'address',
      width: '30%',
      ...getColumnSearchProps('address'),
      render: (text: string) => <div style={{ whiteSpace: 'pre-line' }}>{text}</div>,
    },
    {
      title: t('Case Worker'),
      dataIndex: 'caseworker_name',
      width: '20%',
      ...getColumnSearchProps('caseworker_name'),
    },
    {
      title: t('Actions'),
      width: '10%',
      dataIndex: '',
      render: (text: string, record: BasicTableRow) => (
        <BaseSpace>
          <BaseButton type="primary" onClick={() => handleView(record.household_id)}>
            {t('View')}
          </BaseButton>
        </BaseSpace>
      ),
    },
  ];

  // Apply search filtering
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = households.filter((household) => {
      const matchesSearch =
        (household.household_id?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.caregiver_name?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.homeaddress?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.ward?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.caseworker_name?.toLowerCase() || '').includes(lowerCaseQuery);

      const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        const vcaValue = household[key as keyof Household];
        if (value === 'all') return true;
        return value === 'yes' ? vcaValue === '1' || vcaValue === 'true' : vcaValue === '0' || vcaValue === 'false';
      });

      return matchesSearch && matchesSubPopulationFilters;
    });

    setFilteredHouseholds(filtered);
  }, [searchQuery, households, subPopulationFilters]);

  useEffect(() => {
    const mappedData: BasicTableRow[] = filteredHouseholds.map((household, index) => ({
      key: index,
      name: household.caregiver_name,
      address: `
        Address: ${household.homeaddress || 'Not Applicable'}
        Facility: ${household.facility || 'Not Applicable'}
        Province: ${household.province || 'Not Applicable'}
        Ward: ${household.ward || 'Not Applicable'}
      `,
      household_id: household.household_id,
      caseworker_name: household.caseworker_name,
    }));

    setTableData({ data: mappedData, pagination: initialPagination, loading: false });
  }, [filteredHouseholds]);

  const handleView = (household_id: string) => {
    const selectedHousehold = households.find(household => household.household_id === household_id);
    navigate(`/profile/household-profile/${encodeURIComponent(household_id)}`, { state: { household: selectedHousehold } });
  };
  
  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Tooltip title={t('You can search by Household ID, Caregiver Name, Caseworker Name, and other fields.')}>
            <S.SearchInput
              placeholder={t('Global Search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginRight: '16px' }}
            />
          </Tooltip>
        </Col>
        <Col>
          <h5 style={{ margin: '0 16px 0 0' }}>{t('Filter by Sub Population')}</h5>
          <Row align="middle" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
              <div key={key} style={{ marginRight: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px' }}>{label}</span>
                <Select
                  style={{ width: '100px' }}
                  value={subPopulationFilters[key as keyof typeof subPopulationFilters]}
                  onChange={(newValue) => handleSubPopulationFilterChange(key as keyof typeof subPopulationFilters, newValue)}
                >
                  <Select.Option value="all">{t('All')}</Select.Option>
                  <Select.Option value="yes">{t('Yes')}</Select.Option>
                  <Select.Option value="no">{t('No')}</Select.Option>
                </Select>
              </div>
            ))}
          </Row>
        </Col>
      </Row>
      <BaseTable
        columns={columns}
        dataSource={tableData.data}
        pagination={tableData.pagination}
        loading={tableData.loading}
      />
    </div>
  );
};
