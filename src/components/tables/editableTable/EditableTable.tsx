import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input, InputRef, Button, Tooltip, Space, Row, Col, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import styled from 'styled-components';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { BasicTableRow, Pagination } from 'api/table.api';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { Parser } from 'json2csv';


interface Service {
  id: string;
  name: string;
  // add other service fields if needed
}

interface Referral {
  id: string;
  type: string;
  date: string;
  // add other referral fields if needed
}

interface Household {
  household_id: string;
  caregiver_name: string;
  homeaddress: string;
  facility: string;
  province: string;
  district: string;
  ward: string;
  caseworker_name: string;
  services?: Service[];     // <-- added optional services array
  referrals?: Referral[];   // <-- added optional referrals array
  [key: string]: any;       // loosened to allow arrays too
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

const subPopulationFilterLabels = {
  calhiv: 'CALHIV',
  hei: 'HEI',
  cwlhiv: 'CWLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
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
  const [subPopulationFilters, setSubPopulationFilters] = useState(initialSubPopulationFilters);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

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
        const response = await axios.get(
         `https://ecapplus.server.dqa.bluecodeltd.com/household/all-households/${user?.location}?include=services,referrals`
   );
    setHouseholds(response.data.data);

      } catch (error) {
        console.error('Error fetching households data:', error);
      } finally {
        setTableData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchHouseholds();
  }, [user]);

  const clearAllFiltersAndSearch = () => {
    setSearchText('');
    setSearchQuery('');
    setSearchedColumn('');
    setSubPopulationFilters(initialSubPopulationFilters);
  };

  const exportToCSV = () => {
  try {
    const exportData = filteredHouseholds.map((hh) => ({
      household_id: hh.household_id,
      caregiver_name: hh.caregiver_name,
      homeaddress: hh.homeaddress,
      facility: hh.facility,
      province: hh.province,
      district: hh.district,
      ward: hh.ward,
      caseworker_name: hh.caseworker_name,
      service_list: hh.services?.map(s => s.name).join('; ') || '',
      referral_list: hh.referrals?.map(r => `${r.type}@${r.date}`).join('; ') || '',
    }));

    const parser = new Parser();
    const csvData = parser.parse(exportData);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'households_data.csv';
    link.click();
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

  // const handleSubPopFilterChange = (filterType: string, value: string) => {
  //   setFilters(prevFilters => {
  //     return prevFilters.map(filter => {
  //       if (filter.key === filterType) {
  //         return { ...filter, value: value };
  //       }
  //       return filter;
  //     });
  //   });
  // };

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };
  const handleTableChange = (pagination: Pagination) => {
    setTableData((prev) => ({ ...prev, pagination }));
  };

  const handleSubPopulationFilterChange = (filterName: keyof typeof subPopulationFilters, value: string) => {
    setSubPopulationFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  // Updated filtering logic to handle both global search and column-specific search
  useEffect(() => {
    const applyFilters = () => {
      return households.filter((household) => {
        // Global search
        const matchesGlobalSearch = searchQuery
          ? Object.values(household).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
          )
          : true;

        // Column-specific search
        // const matchesColumnSearch = searchText
        //   ? searchedColumn
        //     ? household[searchedColumn]?.toString().toLowerCase().includes(searchText.toLowerCase())
        //     : true
        //   : true;

        // Sub-population filters
        const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(
          ([key, value]) => {
            if (value === 'all') return true;
            const vcaValue = household[key];
            return value === 'yes'
              ? vcaValue === '1' || vcaValue === 'true'
              : vcaValue === '0' || vcaValue === 'false';
          }
        );

        return matchesGlobalSearch && matchesSubPopulationFilters; // && matchesColumnSearch;
      });
    };

    const filtered = applyFilters();
    setFilteredHouseholds(filtered);
  }, [searchQuery, searchText, searchedColumn, households, subPopulationFilters]);

  // Map filtered households to table data
  useEffect(() => {
    const mappedData: BasicTableRow[] = filteredHouseholds.map((household, index) => ({
      key: index,
      name: household.caregiver_name,
      age: 0, // Add a default age value or replace with actual data if available
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
  }, [filteredHouseholds, searchText]);

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
       <S.SearchInput
          className="column-filter"
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            handleSearch(selectedKeys as string[], confirm, dataIndex);
            // Update columnFilters state when a filter is applied
            setColumnFilters((prevFilters) => ({
              ...prevFilters,
              [dataIndex]: (selectedKeys[0] as string) || '',
            }));
          }}
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
                handleReset(clearFilters); // Clear the column-specific filter
                setSearchText(''); // Clear the search text
                setSearchedColumn(''); // Clear the searched column
                // Remove the column filter from columnFilters state
                setColumnFilters((prevFilters) => {
                  const newFilters = { ...prevFilters };
                  delete newFilters[dataIndex];
                  return newFilters;
                });
                confirm({ closeDropdown: false }); // Keep the dropdown open
              }
            }}
            style={{ width: 130 }}
          >
            Reset column
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
  
    onFilter: (value: string | number | boolean, record: Household) => {
      const fieldValue = dataIndex in record ? record[dataIndex as keyof Household] : '';
      if (fieldValue !== null) {
        return fieldValue ? fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase()) : false;
      }
      return false;
    },
    render: (text: string, record: Household) => {
      const searchTextForColumn = columnFilters[dataIndex] || '';
  
      if (dataIndex === 'address') {
        // Split the address into its components
        const addressFields = [
          `Address: ${record.homeaddress}`,
          `Facility: ${record.facility}`,
          `Province: ${record.province}`,
          `District: ${record.district}`,
          `Ward: ${record.ward}`,
        ];
  
        return (
          <div>
            {addressFields.map((field, index) => (
              <div key={index}>
                {searchTextForColumn ? (
                  <Highlighter
                    highlightStyle={{ backgroundColor: '#FFC069', padding: 0 }}
                    searchWords={[searchTextForColumn]}
                    autoEscape
                    textToHighlight={field}
                  />
                ) : (
                  field
                )}
              </div>
            ))}
          </div>
        );
      }
  
      // Highlight search text for other columns
      return searchTextForColumn ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchTextForColumn]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      );
    },
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
      render: (text: string) => <div style={{ whiteSpace: 'pre-line' }}> {text} </div>,
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
         // Collect column-specific filters
         const appliedColumnFilters = Object.entries(columnFilters)
         .filter(([key, value]) => value !== '')
         .map(([key, value]) => {
           if (key === 'address') {
             // Format Household Details filters based on the specific field being searched
             return `${value}`;
           } else {
             // Format other columns as "Search Text"
             return `${value}`;
           }
         });

       // Combine all applied filters into a single array
       const allAppliedFilters = [
         ...appliedFilters,
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
      render: (_: any, record: BasicTableRow) => (
        <BaseSpace>
          <BaseButton type="primary" onClick={() => handleView(record.household_id)
          }>
            {t('View')}
          </BaseButton>
        </BaseSpace>
      ),
    },
  ];

  const handleView = (household_id: string) => {
    const selectedHousehold = households.find(household => household.household_id === household_id);
    console.log("households object::", selectedHousehold);
    navigate(`/profile/household-profile/${encodeURIComponent('KLA/KSI/38313151')}`, { state: { household: selectedHousehold } });
  };
console.log("households object::",households);


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
        < Col span={24} >
          <h5 style={{ fontSize: '20px', margin: '16px 16px 8px 0' }}> {t('Filter by Sub Population')} </h5>
          < Row align="middle" style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            {
              Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <div key={key} style={{ marginRight: '16px', marginBottom: '1px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} >
                  <span style={{ fontSize: '12px' }}> {label} </span>
                  < Select
                    style={{ width: '100px' }}
                    value={subPopulationFilters[key as keyof typeof subPopulationFilters]}
                    onChange={(newValue) => handleSubPopulationFilterChange(key as keyof typeof subPopulationFilters, newValue)}
                  >
                    <Select.Option value="all" > {t('All')} </Select.Option>
                    < Select.Option value="yes" > {t('Yes')} </Select.Option>
                    < Select.Option value="no" > {t('No')} </Select.Option>
                  </Select>
                </div>
              ))}
            {
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <span style={{ fontSize: '12px', paddingBottom: "0px", textAlign: "center" }}>
      {t('Filter by Graduation')}
    </span>

    <span>
      <Select
        style={{ width: 300, marginLeft: 1 }}
        value={
          Array.isArray(filters) && filters.find((filter) => filter.key === 'de_registration_reason')?.value || undefined
        }
        onChange={(value) => handleSubPopFilterChange('de_registration_reason', value)}
        placeholder="Select Option"
        dropdownRender={(menu) => (
          <div style={{ fontWeight: 'normal' }}>
            {menu}
          </div>
        )}
      >
        <Select.Option value="Graduated (Household has met the graduation benchmarks in ALL domains)" >
          Met ALL graduation benchmarks
        </Select.Option>
        <Select.Option value="Exited without graduation" >
          Exited without graduation
        </Select.Option>
        <Select.Option value="Transferred to other OVC program" >
          Transferred to other OVC program
        </Select.Option>
        <Select.Option value="Lost to follow-up" >
          Lost to follow - up
        </Select.Option>
        <Select.Option value="Passed on" >
          Passed on
        </Select.Option>
        <Select.Option value="Aging without transition plan" >
          Aging without transition plan
        </Select.Option>
        <Select.Option value="Moved (Relocated)" >
          Moved(Relocated)
        </Select.Option>
        <Select.Option value="Other" >
          Other
        </Select.Option>
      </Select>
    </span>
  </div>
</div>
 }

          </Row>
        </Col>



        < Col >
          <ExportWrapper>
            <Space style={{ marginTop: '20px' }}>
              <Button type="primary" onClick={clearAllFiltersAndSearch} >
                {t('Clear Filters')}
              </Button>
              < Button type="primary" onClick={exportToCSV} >
                {t('Export to CSV')}
              </Button>
            </Space>

          </ExportWrapper>
        </Col>
      </Row>
      <BaseTable
        columns={columns}
        dataSource={tableData.data}
        scroll={{ x: 1000 }}
        pagination={tableData.pagination}
        loading={tableData.loading}
        style={{ overflowX: 'auto' }}
        onChange={handleTableChange} // Add this line to handle table pagination
      />
    </div>
  );
};