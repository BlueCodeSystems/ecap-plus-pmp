import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Input, InputRef, Button, Tooltip, Row, Col, Select, Space, Modal, Typography, Alert, Tag } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { BasicTableRow, Pagination } from '@app/api/table.api';
import { useNavigate } from 'react-router-dom';
import { FilterDropdownProps } from 'antd/lib/table/interface';
import styled from 'styled-components';
import { Parser } from 'json2csv';

const { Text } = Typography;

interface User {
  location: string;
}

interface Vca {
  id: string;
  uid: string;
  lastname: string;
  firstname: string;
  birthdate: string;
  vca_gender: string;
  homeaddress: string | null;
  facility: string;
  province: string;
  district: string;
  ward: string | null;
  calhiv: string;
  hei: string;
  cwlhiv: string;
  agyw: string;
  csv: string;
  cfsw: string;
  abym: string;
  vl_suppressed: string | null;
  child_adolescent_in_aged_headed_household: string;
  child_adolescent_in_chronically_ill_headed_household: string;
  child_adolescent_in_child_headed_household: string;
  child_adolescent_living_with_disability: string;
  child_adolescent_in_female_headed_household: string;
  under_5_malnourished: string;
  pbfw: string;
}

interface TableDataItem extends BasicTableRow {
  unique_id: string;
  name: string;
  gender: string;
  age: number;
  address: {
    homeaddress: string | null;
    facility: string;
    province: string;
    district: string;
    ward: string | null;
  };
}

const initialPagination: Pagination = {
  current: 1,
  pageSize: 100,
};

const subPopulationFilterLabels = {
  calhiv: 'C/ALHIV',
  hei: 'HEI',
  cwlhiv: 'C/WLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
  caahh: 'CAAHH',
  caichh: 'CAICHH',
  caich: 'CAICH',
  calwd: 'CALWD',
  caifhh: 'CAIFHH',
  muc: 'MUC',
  pbfw: 'PBFW'
};

const filterKeyDescriptions = {
  calhiv: 'Children and Adolescents Living with HIV',
  hei: 'HIV Exposed Infants',
  cwlhiv: 'Children and Women Living with HIV',
  agyw: 'Adolescent Girls and Young Women',
  csv: 'Children Survivors of Violence',
  cfsw: 'Children of Female Sex Workers',
  abym: 'Adolescent Boys and Young Men',
  caahh: 'Child/Adolescent in Aged Headed Household',
  caichh: 'Child/Adolescent in Chronically Ill Headed Household',
  caich: 'Child/Adolescent in Child Headed Household',
  calwd: 'Child/Adolescent Living with Disability',
  caifhh: 'Child/Adolescent in Female Headed Household',
  muc: 'Malnourished Under 5 Children',
  pbfw: 'Pregnant and Breastfeeding Women'
};

const filterKeyToDataKey = {
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
};

let combinedText = '';

const ExportWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  margin-bottom: 16px;
`;

export const TreeTable: React.FC = () => {
  const [vcas, setVcas] = useState<Vca[]>([]);
  const [initialvcas, setInitialVcas] = useState<Vca[]>([]);
  const [filteredVcas, setFilteredVcas] = useState<Vca[]>([]);
  const [tableData, setTableData] = useState<{ data: TableDataItem[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const searchInput = useRef<InputRef>(null);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [householdSearchField, setHouseholdSearchField] = useState<string>('');
  

  const [subPopulationFilters, setSubPopulationFilters] = useState(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({
      ...acc,
      [key]: 'all'
    }), {} as Record<keyof typeof subPopulationFilterLabels, string>)
  );

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

  const [filters, setFilters] = useState([
    { key: "reason", value: "" }
  ]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await axios.get(`https://ecapplus.server.dqa.bluecodeltd.com/child/vcas-assessed-register/${user?.location}`);
        setVcas(response.data.data);
        setInitialVcas(response.data.data);
      } catch (error) {
        console.error('Error fetching VCAs data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = vcas.filter((vca) => {
      const addressString = [
        vca.homeaddress,
        vca.facility,
        vca.province,
        vca.district,
        vca.ward
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch =
        (vca.uid?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.firstname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.lastname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        addressString.includes(lowerCaseQuery) ||
        (vca.vca_gender?.toLowerCase() || '').includes(lowerCaseQuery);

      const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(([filterKey, value]) => {
        if (value === 'all') return true;

        let dataKey = filterKey;
        if (filterKey in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[filterKey as keyof typeof filterKeyToDataKey];
        }

        const vcaValue = vca[dataKey as keyof Vca];
        return vcaValue === null ? false :
          value === 'yes' ? vcaValue === '1' || vcaValue === 'true' :
            vcaValue === '0' || vcaValue === 'false';
      });

      return matchesSearch && matchesSubPopulationFilters;
    });

    setFilteredVcas(filtered);

    const mappedData: TableDataItem[] = filtered.map((vca, index) => ({
      key: index,
      unique_id: vca.uid,
      name: `${vca.firstname} ${vca.lastname}`,
      gender: vca.vca_gender,
      age: calculateAge(vca.birthdate),
      address: {
        homeaddress: vca.homeaddress,
        facility: vca.facility,
        province: vca.province,
        district: vca.district,
        ward: vca.ward
      }
    }));

    setTableData({ data: mappedData, pagination: initialPagination, loading: false });
  }, [searchQuery, vcas, subPopulationFilters]);

  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;

    const formats = [
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    ];

    let parsedDate: Date | null = null;

    for (const format of formats) {
      const parts = birthdate.match(format);
      if (parts) {
        if (format === formats[0]) {
          parsedDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
        } else if (format === formats[1]) {
          parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
        } else {
          parsedDate = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        break;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date format: ${birthdate}`);
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - parsedDate.getFullYear();
    const m = today.getMonth() - parsedDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn('');
    combinedText = '';
  };

  const handleSubPopulationFilterChange = (filterName: keyof typeof subPopulationFilters, value: string) => {
    setSubPopulationFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const exportToCSV = () => {
    try {
      const parser = new Parser();
      const csvData = parser.parse(filteredVcas);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'vca.csv';
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleClearFilters = () => {
    // Reset all search and filter states
    setSearchQuery('');
    setSearchText('');
    setSearchedColumn('');
    combinedText = '';
  
    // Reset all sub-population filters to 'all'
    setSubPopulationFilters(
      Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({
        ...acc,
        [key]: 'all',
      }), {} as Record<string, string>)
    );
  
    // Reset graduation filter
    setFilters([{ key: "reason", value: "" }]);
  
    // Reset column-specific filters
    setColumnFilters({});
  
    // Reset household search field
    setHouseholdSearchField('');
  
    // Reset filteredVcas to initialvcas
    setFilteredVcas(initialvcas);
  
    // Reset table data to show all VCAs
    const mappedData: TableDataItem[] = initialvcas.map((vca, index) => ({
      key: index,
      unique_id: vca.uid,
      name: `${vca.firstname} ${vca.lastname}`,
      gender: vca.vca_gender,
      age: calculateAge(vca.birthdate),
      address: {
        homeaddress: vca.homeaddress,
        facility: vca.facility,
        province: vca.province,
        district: vca.district,
        ward: vca.ward
      }
    }));
  
    setTableData({ data: mappedData, pagination: initialPagination, loading: false });
  
    // Clear search input fields for each column
    columns.forEach((column) => {
      if ('filterDropdown' in column && column.filterDropdown) {
        const filterDropdownProps = column.filterDropdown as unknown as FilterDropdownProps;
        if (filterDropdownProps.clearFilters) {
          filterDropdownProps.clearFilters(); // Clear the column-specific filter
        }
      }
      if (searchInput.current) {
        if (searchInput.current && searchInput.current.input) {
          searchInput.current.input.value = ''; // Clear the search input field
        }
      }
    });
  };
  
  const handleSubPopFilterChange = (filterType: string, value: string) => {
    setFilters(prevFilters => {
      return prevFilters.map(filter => {
        if (filter.key === filterType) {
          return { ...filter, value: value };
        }
        return filter;
      });
    });
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => {
            setSelectedKeys(e.target.value ? [e.target.value] : []);
            // Track which field is being searched in the Household Details column
            if (dataIndex === 'address') {
              setHouseholdSearchField('Address');
            } else if (dataIndex === 'facility') {
              setHouseholdSearchField('Facility');
            } else if (dataIndex === 'province') {
              setHouseholdSearchField('Province');
            } else if (dataIndex === 'district') {
              setHouseholdSearchField('District');
            } else if (dataIndex === 'ward') {
              setHouseholdSearchField('Ward');
            }
          }}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              handleSearch(selectedKeys as string[], confirm, dataIndex);
              // Update columnFilters state when a filter is applied
              setColumnFilters((prevFilters) => ({
                ...prevFilters,
                [dataIndex]: (selectedKeys[0] as string) || '',
              }));
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 95 }}
          >
            Search
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              if (clearFilters) {
                clearFilters(); // Clear the column-specific filter
                setSearchText(''); // Clear the search text
                setSearchedColumn(''); // Clear the searched column
                // Remove the column filter from columnFilters state
                setColumnFilters((prevFilters) => {
                  const newFilters = { ...prevFilters };
                  delete newFilters[dataIndex];
                  return newFilters;
                });
                // Reset the household search field ONLY if the Household Details filter is being reset
                if (dataIndex === 'address') {
                  setHouseholdSearchField('');
                }
                confirm({ closeDropdown: false }); // Keep the dropdown open
              }
            }}
            style={{ width: 110 }}
          >
            Reset Column
          </Button>
          <Button
            type="link"
            size="small"
            onClick={close}
          >
            X
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string | number | boolean, record: { [x: string]: any }) => {
      const fieldValue = record[dataIndex];
  
      // Handle Household Details column differently
      if (dataIndex === 'address') {
        const addressFields = Object.values(record.address).filter(Boolean);
        const addressString = addressFields.join(' ').toLowerCase();
        return addressString.includes(value.toString().toLowerCase());
      }
  
      // Exact match for unique_id, gender, and age
      if (dataIndex === 'unique_id' || dataIndex === 'gender' || dataIndex === 'age') {
        return fieldValue ? fieldValue.toString().toLowerCase() === value.toString().toLowerCase() : false;
      }
  
      // Partial match for other fields (e.g., name)
      return fieldValue ? fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase()) : false;
    },
    render: (text: any, record: TableDataItem) => {
      if (dataIndex === 'address') {
        // Render only non-empty address fields
        const addressFields = [
          `Address: ${record.address.homeaddress || ''}`,
          `Facility: ${record.address.facility || ''}`,
          `Province: ${record.address.province || ''}`,
          `District: ${record.address.district || ''}`,
          `Ward: ${record.address.ward || ''}`,
        ].filter((field) => !field.endsWith(': ')); // Remove empty fields
  
        return (
          <div>
            {addressFields.map((field, index) => (
              <div key={index}>{field}</div>
            ))}
          </div>
        );
      }
  
      return searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      );
    },
  });

  const handleView = (uid: string) => {
    const selectedVca = vcas.find((vca) => vca.uid === uid);
    navigate(`/profile/vca-profile/${encodeURIComponent(uid)}`, { state: { vca: selectedVca } });
  };

  const columns = [
    {
      title: t('Unique ID'),
      dataIndex: 'unique_id',
      width: '10%',
      ...getColumnSearchProps('unique_id'),
    },
    {
      title: t('Full Name'),
      dataIndex: 'name',
      width: '15%',
      ...getColumnSearchProps('name'),
    },
    {
      title: t('Gender'),
      dataIndex: 'gender',
      width: '10%',
      ...getColumnSearchProps('gender'),
    },
    {
      title: t('Age'),
      dataIndex: 'age',
      width: '10%',
      ...getColumnSearchProps('age'),
    },
    {
      title: t('Household Details'),
      dataIndex: 'address',
      width: '35%',
      ...getColumnSearchProps('address'),
    },
    {
      title: t('Applied Filters & Search'),
      dataIndex: 'appliedFilters',
      width: '20%',
      render: (text: string, record: Vca) => {
        // Collect all applied sub-population filters
        const appliedSubPopulationFilters = Object.entries(subPopulationFilters)
          .filter(([key, value]) => value !== 'all')
          .map(([key]) => subPopulationFilterLabels[key as keyof typeof subPopulationFilterLabels]);
    
        // Collect the graduation filter (if applied)
        const graduationFilter = filters.find(filter => filter.key === "reason")?.value || "";
    
        // Collect column-specific filters
        const appliedColumnFilters = Object.entries(columnFilters)
          .filter(([key, value]) => value !== '')
          .map(([key, value]) => {
            if (key === 'address') {
              // Format Household Details filters based on the specific field being searched
              return `${householdSearchField}: ${value}`;
            } else {
              // Format other columns as "Column Name: Search Text"
              return `${key}: ${value}`;
            }
          });
    
        // Combine all applied filters into a single array
        const allAppliedFilters = [
          ...appliedSubPopulationFilters,
          ...(graduationFilter ? [`Graduation: ${graduationFilter}`] : []),
          ...appliedColumnFilters,
        ];
    
        // Render the applied filters as tags
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {allAppliedFilters.map((filter, index) => (
              <Tag key={index} color="cyan">
                {filter}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: t('Actions'),
      width: '10%',
      dataIndex: '',
      render: (_: any, record: TableDataItem) => (
        <BaseButton type="primary" onClick={() => handleView(record.unique_id)}>
          {t('View')}
        </BaseButton>
      ),
    },
  ];

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
        <Col span={24}>
          <h5 style={{ fontSize: '20px', margin: '16px 16px 8px 0' }}>{t('Filter by Sub Population')}</h5>
          <Row align="middle" style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
              <div key={key} style={{ marginRight: '16px', marginBottom: '1px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
        <Col>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }} >
            <ExportWrapper>
              <Space>
                {/* Button to clear all filters and search */}
                <Button type="primary" onClick={handleClearFilters}>
                  {t('Clear Filters')}
                </Button>
                {/* Button to export to CSV */}
                <Button type="primary" onClick={exportToCSV}>
                  {t('Export to CSV')}
                </Button>
              </Space>

            </ExportWrapper>
          </div>
        </Col>
      </Row>

      <Modal
        title="Filter Key Descriptions"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {Object.entries(filterKeyDescriptions).map(([key, description]) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <Text strong>{subPopulationFilterLabels[key as keyof typeof subPopulationFilterLabels]}:</Text>
              <br />
              <Text>{description}</Text>
            </div>
          ))}
        </div>
      </Modal>


      <BaseTable
      key={filteredVcas.length}
        columns={columns}
        dataSource={tableData.data}
        pagination={tableData.pagination}
        loading={loading}
        scroll={{ x: 1000 }}
        style={{ overflowX: 'auto' }}
      />
    </div>
  );
};

export default TreeTable;