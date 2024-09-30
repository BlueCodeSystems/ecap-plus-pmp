import React, { useState, useEffect, useCallback } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Tooltip, Space, Row, Col, Select } from 'antd';
import { BasicTableRow, Pagination } from 'api/table.api';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Vca {
  uid: string;
  firstname: string;
  lastname: string;
  birthdate: string;
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_hiv_status: string;
  caregiver_birth_date: string;
  household_id: string;
  homeaddress: string | null;
  facility: string;
  province: string;
  district: string;
  ward: string;
  screening_location: string;
  date_enrolled: string;
  date_created: string;
  date_last_vl: string | null;
  date_next_vl: string | null;
  vca_gender: string;
  is_hiv_positive: string;
  vl_suppressed: string;
}

interface User {
  location: string;
}

const initialPagination: Pagination = {
  current: 1,
  pageSize: 100,
};

export const BasicTable: React.FC = () => {
  const [vcas, setVcas] = useState<Vca[]>([]);
  const [filteredVcas, setFilteredVcas] = useState<Vca[]>([]);
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const [subPopulationFilters, setSubPopulationFilters] = useState({
    calhiv: 'all',
    hei: 'all',
    cwlhiv: 'all',
    agyw: 'all',
    csv: 'all',
    cfsw: 'all',
    abym: 'all',
  });

  const [otherFilters, setOtherFilters] = useState({
    gender: 'all',
    virallySupressed: 'all',
    age: '',
    facility: '',
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

  const otherFilterLabels = {
    gender: 'Gender',
    virallySupressed: 'Virally Suppressed',
    age: 'Age',
    facility: 'Facility',
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
    const fetchData = async () => {
      if (!user) return;

      try {
        setTableData((prev) => ({ ...prev, loading: true }));
        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/child/household-members-register`
        );
        setVcas(response.data.data);
        localStorage.setItem('vcas', JSON.stringify(response.data.data));
      } catch (error) {
        console.error('Error fetching VCAs data:', error);
      } finally {
        setLoading(false);
        setTableData((prev) => ({ ...prev, loading: true }));
      }
    };

    fetchData();
  }, [user]);

  // Apply search filtering
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = vcas.filter((vca) => 
      (vca.uid?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (vca.firstname?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (vca.lastname?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (vca.homeaddress?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (vca.ward?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (vca.vca_gender?.toLowerCase() || '').includes(lowerCaseQuery) 
    );
    setFilteredVcas(filtered);
  }, [searchQuery, vcas]);
  
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = vcas.filter((vca) => {
      const matchesSearch = 
        (vca.uid?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.firstname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.lastname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.homeaddress?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.ward?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.vca_gender?.toLowerCase() || '').includes(lowerCaseQuery);

      const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === 'all') return true;
        const vcaValue = vca[key as keyof Vca];
        return value === 'yes' ? vcaValue === '1' || vcaValue === 'true' || vcaValue === true
                                : vcaValue === '0' || vcaValue === 'false' || vcaValue === false;
      });

      const matchesOtherFilters = Object.entries(otherFilters).every(([key, value]) => {
        if (value === 'all' || value === '') return true;
        
        if (key === 'gender') {
          return vca.vca_gender.toLowerCase() === value.toLowerCase();
        }
        
        if (key === 'virallySupressed') {
          if (value === 'suppressed') {
            return vca.vl_suppressed === 'yes';
          } else if (value === 'notSuppressed') {
            return vca.vl_suppressed === 'no';
          }
        }
        
        if (key === 'age') {
          const age = calculateAge(vca.birthdate);
          return age === parseInt(value as string);
        }
        
        if (key === 'facility') {
          return (vca.facility?.toLowerCase() || '').includes(value.toLowerCase());
        }

        return true;
      });

      return matchesSearch && matchesSubPopulationFilters && matchesOtherFilters;
    });
    setFilteredVcas(filtered);
  }, [searchQuery, vcas, subPopulationFilters, otherFilters]);

  useEffect(() => {
    const mappedData = filteredVcas.map((vca, index) => ({
      key: index,
      unique_id: vca.uid,
      name: `${vca.firstname} ${vca.lastname}`,
      gender: vca.vca_gender,
      age: calculateAge(vca.birthdate),
      address: (
        <div>
          <div>Address: {vca.homeaddress || 'Unknown'}</div>
          <div>Facility: {vca.facility || 'Unknown'}</div>
          <div>Province: {vca.province || 'Unknown'}</div>
          <div>District: {vca.district || 'Unknown'}</div>
          <div>Ward: {vca.ward || 'Unknown'}</div>
        </div>
      )
    }));
  
    setTableData({ data: mappedData, pagination: initialPagination, loading: false });
  }, [filteredVcas]);

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

  const handleSubPopulationFilterChange = (filterName: keyof typeof subPopulationFilters, value: string) => {
    setSubPopulationFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const handleOtherFilterChange = (filterName: keyof typeof otherFilters, value: string) => {
    setOtherFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const exportToCSV = () => {
    const fields = ['uid', 'firstname', 'lastname', 'vca_gender', 'homeaddress', 'province', 'district', 'ward', 'calhiv', 'hei', 'cwlhiv', 'agyw', 'csv', 'cfsw', 'abym'];
    const parser = new Parser({ fields });
    const csv = parser.parse(filteredVcas);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'vcas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['ID', 'First Name', 'Last Name', 'Gender', 'Age', 'Address', 'Province', 'District', 'Ward'];
    const tableRows: any[] = [];

    filteredVcas.forEach((vca) => {
      const rowData = [
        vca.uid,
        vca.firstname,
        vca.lastname,
        vca.vca_gender,
        calculateAge(vca.birthdate),
        vca.homeaddress,
        vca.province,
        vca.district,
        vca.ward,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    doc.save('vca.pdf');
  };

  const handleView = (uid: string) => {
    const selectedVca = vcas.find((vca) => vca.uid === uid);
    navigate(`/profile/member-profile/${encodeURIComponent(uid)}`, { state: { vca: selectedVca } });
  };

  const columns = [
    {
      title: t('Unique ID'),
      dataIndex: 'unique_id',
      width: '15%',
    },
    {
      title: t('Full Name'),
      dataIndex: 'name',
      width: '20%',
    },
    {
      title: t('Gender'),
      dataIndex: 'gender',
      width: '10%',
    },
    {
      title: t('Age'),
      dataIndex: 'age',
      width: '10%',
    },
    {
      title: t('Household Details'),
      dataIndex: 'address',
      width: '35%',
    },
    {
      title: t('Actions'),
      width: '10%',
      dataIndex: '',
      render: (text: string, record: BasicTableRow) => (
        <BaseSpace>
          <BaseButton type="primary" onClick={() => handleView(record.unique_id)}>
            {t('View')}
          </BaseButton>
        </BaseSpace>
      ),
    },
  ];

  return (
    <div style={{ margin: '20px', textTransform: 'capitalize' }}>
      <Space direction="vertical" style={{ width: '100%'}}>
        <Row gutter={[16, 16]} >
          {/* Column for the sub-population filters */}
          <Col span={16}>
            <h3>{t('Filter by Sub Population')}</h3>
            <Row gutter={[16, 16]} style={{fontSize: "12px" }}>
              {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <Col key={key} span={6}>
                  <Space direction="vertical" size="small">
                    <span>{label}</span>
                    <Select
                      style={{ width: '100%',  }}
                      value={subPopulationFilters[key as keyof typeof subPopulationFilters]}
                      onChange={(newValue) => handleSubPopulationFilterChange(key as keyof typeof subPopulationFilters, newValue)}
                    >
                      <Select.Option value="all">{t('All')}</Select.Option>
                      <Select.Option value="yes">{t('Yes')}</Select.Option>
                      <Select.Option value="no">{t('No')}</Select.Option>
                    </Select>
                  </Space>
                </Col>
              ))}
            </Row>
          </Col>

         {/* Search input */}
          <Col span={8} style={{fontSize: "12px" }}>
            <Tooltip title={t('You can search by Unique ID, Name, Gender, Ward, and other fields.')}>
              <S.SearchInput
                style={{ width: '100%' }}
                placeholder={t('Search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Tooltip>
          </Col>
          
        </Row>

        {/* Column for the other filters */}
        <Row>
        <Col span={24} style={{ marginTop: '20px',  marginBottom: '20px'}}>
            <h3>{t('Other Filters')}</h3>
            <Row gutter={[16, 16]} style={{fontSize: "12px" }}>
              {Object.entries(otherFilterLabels).map(([key, label]) => (
                <Col key={key} span={6}>
                  <Space direction="vertical" size="small" >
                    <span>{label}</span>
                    {key === 'gender' ? (
                      <Select
                        style={{ width: '100%', fontSize: "12px"  }}
                        value={otherFilters[key as keyof typeof otherFilters]}
                        onChange={(newValue) => handleOtherFilterChange(key as keyof typeof otherFilters, newValue)}
                      >
                        <Select.Option value="all">{t('All')}</Select.Option>
                        <Select.Option value="female">{t('Female')}</Select.Option>
                        <Select.Option value="male">{t('Male')}</Select.Option>
                      </Select>
                    ) : key === 'virallySupressed' ? (
                      <Select
                        style={{ width: '100%', fontSize: "12px"  }}
                        value={otherFilters[key as keyof typeof otherFilters]}
                        onChange={(newValue) => handleOtherFilterChange(key as keyof typeof otherFilters, newValue)}
                      >
                        <Select.Option value="all">{t('All')}</Select.Option>
                        <Select.Option value="suppressed">{t('Suppressed')}</Select.Option>
                        <Select.Option value="notSuppressed">{t('Not Suppressed')}</Select.Option>
                      </Select>
                    ) : (
                      <Input
                        style={{ width: '100%', fontSize: "12px"  }}
                        value={otherFilters[key as keyof typeof otherFilters]}
                        onChange={(e) => handleOtherFilterChange(key as keyof typeof otherFilters, e.target.value)}
                        placeholder={t(`Enter ${key}`)}
                      />
                    )}
                  </Space>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Export buttons */}
        {tableData.data.length > 0 && (
          <Row justify="end" style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                <Button type="primary" onClick={exportToCSV}>
                  {t('Export CSV')}
                </Button>
                <Button type="primary" onClick={exportToPDF}>
                  {t('Export PDF')}
                </Button>
              </Space>
            </Col>
          </Row>
        )}


        {/* Table */}
        <BaseTable
          bordered
          dataSource={tableData.data}
          columns={columns}
          pagination={tableData.pagination}
          onChange={(pagination) => {}}
          loading={tableData.loading}
          tableLayout="fixed"
        />
      </Space>
    </div>
  );
};
