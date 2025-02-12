import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input, InputRef, Button, Tooltip, Space, Row, Col, Select, Tag, Breadcrumb } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import styled from 'styled-components';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { BasicTableRow, Pagination } from 'api/table.api';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Household {
  de_registration_reason: string;
  household_id: string;
  caregiver_name: string;
  homeaddress: string;
  facility: string;
  province: string;
  district: string;
  ward: string;
  caseworker_name: string;
}

const initialPagination: Pagination = {
  current: 1,
  pageSize: 100,
};

const initialSubPopulationFilters = {
  calhiv: 'all',
  hei: 'all',
  cwlhiv: 'all',
  agyw: 'all',
  csv: 'all',
  cfsw: 'all',
  abym: 'all',
};

const ExportWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

export const EditableTableArchived: React.FC = () => {
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
  const [subPopulationFilters, setSubPopulationFilters] = useState(initialSubPopulationFilters);

  const [filters, setFilters] = useState([
    { key: "de_registration_reason", value: "" }
  ]);

  const subPopulationFilterLabels = {
    calhiv: 'CALHIV',
    hei: 'HEI',
    cwlhiv: 'CWLHIV',
    agyw: 'AGYW',
    csv: 'C/SV',
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

        const filterValue = filters.find(filter => filter.key === "de_registration_reason")?.value || "";

        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/household/all-households-archived/${user?.location}`,
          {
            params: {
              de_registration_reason: filterValue,
            },
          }
        );

        setHouseholds(response.data.data);
        setFilteredHouseholds(response.data.data); // Ensure filtered list updates correctly
        console.log("Fetched households with filter:", response.data.data);
      } catch (error) {
        console.error("Error fetching households data:", error);
      } finally {
        setTableData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchHouseholds();
  }, [user, filters]);

  // Function to clear all filters and search
  const clearAllFiltersAndSearch = () => {
    setSearchText(''); // Clear search text
    setSearchQuery('');
    setSearchedColumn('')
    setSubPopulationFilters(initialSubPopulationFilters); // Reset filters to their initial values
  };

  const exportToCSV = () => {
    try {
      const parser = new Parser();
      const csvData = parser.parse(filteredHouseholds);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'households_data.csv';
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };


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
      <div style= {{ padding: 8 }
}>
  <Input
          ref={ searchInput }
placeholder = {`Search ${dataIndex}`}
value = { selectedKeys[0]}
onChange = { e => setSelectedKeys(e.target.value ? [e.target.value] : []) }
onPressEnter = {() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
style = {{ marginBottom: 8, display: 'block' }}
        />;
<Space>
  <Button
            type="primary"
onClick = {() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
icon = {< SearchOutlined />}
size = "small"
style = {{ width: 90 }}
          >
  Search
  </Button>
  < Button
onClick = {() => clearFilters && handleReset(clearFilters)}
size = "small"
style = {{ width: 90 }}
          >
  Clear
  </Button>
  < Button
type = "link"
size = "small"
onClick = {() => {
  confirm({ closeDropdown: false });
  setSearchText((selectedKeys as string[])[0]);
  setSearchedColumn(dataIndex);
}}
          >
  Reset table
    </Button>
    < Button
type = "link"
size = "small"
onClick = { close }
  >
  Close
  </Button>
  </Space>
  </div>
    ),
filterIcon: (filtered: any) => (
  <SearchOutlined style= {{ color: filtered ? '#1890ff' : undefined }} />
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
          highlightStyle= {{ backgroundColor: '#ffc069', padding: 0 }}
searchWords = { [searchText]}
autoEscape
textToHighlight = { text? text.toString() : ''}
  />
      ) : (
  text
),
  });

const columns = [
  {
    title: t('Household ID'),
    dataIndex: 'household_id',
    width: '15%',
    ...getColumnSearchProps('household_id'),
  },
  {
    title: t('Caregiver Name'),
    dataIndex: 'name',
    width: '15%',
    ...getColumnSearchProps('name'),
  },
  {
    title: t('Household Details'),
    dataIndex: 'address',
    width: '30%',
    ...getColumnSearchProps('address'),
    render: (text: string) => <div style={{ whiteSpace: 'pre-line' }}> { text } </div>,
    },
{
  title: t('Case Worker'),
    dataIndex: 'caseworker_name',
      width: '15%',
      ...getColumnSearchProps('caseworker_name'),
    },
{
  title: t('Applied Filters & Search'),
    dataIndex: 'appliedFilters',
      width: '20%',
        render: (text: string, record: Household) => {
          // Get applied sub-population filters
          const appliedFilters = Object.entries(subPopulationFilters)
            .filter(([key, value]) => value !== 'all') // Only show filters that are applied
            .map(([key]) => subPopulationFilterLabels[key as keyof typeof subPopulationFilterLabels]) // Get labels for applied filters
            .join(', ');

          // Get the graduation filter value
          const graduationFilter = filters.find(filter => filter.key === "de_registration_reason")?.value || "";

          // Combine search text, applied filters, and graduation filter
          const searchValue = searchText ? `${searchText}` : '';
          const filtersText = appliedFilters ? `${appliedFilters}` : '';
          const graduationText = graduationFilter ? `Graduation: ${graduationFilter}` : '';

          // Combine all into a single string
          const combinedText = [searchValue, filtersText, graduationText].filter(Boolean).join(' | ');

          // Render the combined text in a Tag
          return (
            <Tag color= { appliedFilters || searchText || graduationFilter ? 'cyan' : 'black'
        }>
          { combinedText }
          </Tag>
        );
},
    },
{
  title: t('Actions'),
    width: '10%',
      dataIndex: '',
        render: (text: string, record: BasicTableRow) => (
          <BaseSpace>
          <BaseButton type= "primary" onClick = {() => handleView(record.household_id)
}>
  { t('View') }
  </BaseButton>
  </BaseSpace>
      ),
    },
  ];

useEffect(() => {
  const lowerCaseQuery = searchText.toLowerCase();
  const deRegReasonFilter = filters.find(filter => filter.key === "de_registration_reason")?.value || "";

  const filtered = households.filter((household) => {
    const matchesSearch =
      (household.household_id?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (household.caregiver_name?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (household.homeaddress?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (household.ward?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (household.caseworker_name?.toLowerCase() || '').includes(lowerCaseQuery);

    const matchesDeRegReason =
      deRegReasonFilter === "" || household.de_registration_reason === deRegReasonFilter;

    return matchesSearch && matchesDeRegReason;
  });

  setFilteredHouseholds(filtered);
}, [searchText, households, filters]);

useEffect(() => {
  const mappedData: BasicTableRow[] = filteredHouseholds.map((household, index) => ({
    key: index,
    name: household.caregiver_name,
    address: `
        Address: ${household.homeaddress || 'Not Applicable'}
        Facility: ${household.facility || 'Not Applicable'}
        Province: ${household.province || 'Not Applicable'}
        District: ${household.district || 'Not Applicable'}
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
  <Row justify= "space-between" align = "middle" style = {{ marginBottom: '16px' }}>
    <Col>
    <Tooltip title={ t('You can search by Household ID, Caregiver Name, Caseworker Name, and other fields.') }>
      <S.SearchInput
              placeholder={ t('Global Search') }
value = { searchQuery }
onChange = {(e) => setSearchQuery(e.target.value)}
style = {{ marginRight: '16px' }}
            />
  </Tooltip>
  </Col>
  < Col span = { 24} >
    <h5 style={ { fontSize: '20px', margin: '16px 16px 8px 0' } }> { t('Filter by Sub Population') } </h5>
      < Row align = "middle" style = {{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
      {
        Object.entries(subPopulationFilterLabels).map(([key, label]) => (
          <div key= { key } style = {{ marginRight: '16px', marginBottom: '1px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} >
        <span style={ { fontSize: '12px' } }> { label } </span>
          < Select
style = {{ width: '100px' }}
value = { subPopulationFilters[key as keyof typeof subPopulationFilters]}
onChange = {(newValue) => handleSubPopulationFilterChange(key as keyof typeof subPopulationFilters, newValue)}
        >
  <Select.Option value="all" > { t('All') } </Select.Option>
    < Select.Option value = "yes" > { t('Yes') } </Select.Option>
      < Select.Option value = "no" > { t('No') } </Select.Option>
        </Select>
        </div>
    ))}
<div style={ { display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' } }>
  <div style = { { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } }>
    <span style={ { fontSize: '12px', paddingBottom: "0px" } }> { t('Filter by Graduation') } < Tag color = "cyan" > New < /Tag> </span >
      <span>
      <Select
  style={ { width: 300, marginLeft: 1 } }
value = {
  Array.isArray(filters) && filters.find((filter) => filter.key === 'de_registration_reason')?.value || undefined
}
onChange = {(value) => handleSubPopFilterChange('de_registration_reason', value)}
placeholder = "Select Option"
dropdownRender = {(menu) => (
  <div style= {{ fontWeight: 'normal' }}>
    { menu }
    </div>
  )}
>
  <Select.Option value="Graduated (Household has met the graduation benchmarks in ALL domains)" > Met ALL graduation benchmarks </Select.Option>
    < Select.Option value = "Exited without graduation" > Exited without graduation </Select.Option>
      < Select.Option value = "Transferred to other OVC program" > Transferred to other OVC program </Select.Option>
        < Select.Option value = "Lost to follow-up" > Lost to follow - up </Select.Option>
          < Select.Option value = "Passed on" > Passed on </Select.Option>
            < Select.Option value = "Aging without transition plan" > Aging without transition plan </Select.Option>
              < Select.Option value = "Moved (Relocated)" > Moved(Relocated) </Select.Option>
                < Select.Option value = "Other" > Other </Select.Option>
                  </Select>
                  </span>
                  </div>
                  </div>
                  </Row>
                  </Col>
                  < Col style = {{ marginTop: '16px' }}>
                    <ExportWrapper>
                    <Space>
                    {/* Button to clear all filters and search */ }
                    < Button type = "default" onClick = { clearAllFiltersAndSearch } >
                      { t('Clear All Filters') }
                      </Button>
{/* Button to export to CSV */ }
<Button type="primary" onClick = { exportToCSV } >
  { t('Export to CSV') }
  </Button>
  </Space>
  </ExportWrapper>
  </Col>

  </Row>
  < BaseTable
columns = { columns }
dataSource = { tableData.data }
pagination = { tableData.pagination }
loading = { tableData.loading }
  />
  </div>
  );
};
