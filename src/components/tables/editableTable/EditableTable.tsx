/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input, InputRef, Button, Tooltip, Space, Row, Col, Select, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import styled from 'styled-components';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { BasicTableRow, Pagination } from 'api/table.api';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { Parser } from 'json2csv'; 
import { saveAs } from 'file-saver';

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
  services?: Service[];
  referrals?: Referral[];
  [key: string]: any;
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
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>(
    {
      data: [],
      pagination: initialPagination,
      loading: false,
    }
  );
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [user, setUser] = useState<any | null>(null);
  const navigate = useNavigate();
  const searchInput = useRef<InputRef>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');
  const [subPopulationFilters, setSubPopulationFilters] = useState(initialSubPopulationFilters);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [flaggedMap, setFlaggedMap] = useState<Record<string, any>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [exportingUid, setExportingUid] = useState<string | null>(null);
  const [exportingGlobal, setExportingGlobal] = useState<boolean>(false);

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
      if (!user || !user.location) {
        console.log('User or user.location is not available:', user);
        setTableData((prev) => ({ ...prev, loading: false }));
        return;
      }
      try {
        setTableData((prev) => ({ ...prev, loading: true }));
        const params = Object.fromEntries(
          Object.entries(subPopulationFilters).map(([key, value]) => [
            key,
            value === 'all' ? '' : value === 'yes' ? '1' : '0'
          ])
        );
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com'}/household/all-households/${user.location}?include=services,referrals`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            params,
          }
        );
        const fetchedData = response.data.data || [];
        if (fetchedData.length === 0) {
          console.warn('API returned no data, using dummy data for testing');
          const dummyData: Household[] = [
            {
              household_id: 'DUMMY-001',
              caregiver_name: 'Test Caregiver',
              homeaddress: 'Test Address',
              facility: 'Test Facility',
              province: 'Test Province',
              district: 'Test District',
              ward: 'Test Ward',
              caseworker_name: 'Test Worker',
              calhiv: '1',
              hei: '0',
              cwlhiv: '0',
              agyw: '0',
              csv: '0',
              cfsw: '0',
              abym: '0',
              services: [{ id: 's1', name: 'Test Service' }],
              referrals: [{ id: 'r1', type: 'Test Referral', date: '2025-08-14' }],
            }
          ];
          setHouseholds(dummyData);
          setFilteredHouseholds(dummyData);
        } else {
          setHouseholds(fetchedData);
          setFilteredHouseholds(fetchedData);
        }
      } catch (error) {
        console.error('Error fetching households data:', error);
        message.error(t('Failed to fetch households'));
      } finally {
        setTableData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchHouseholds(); // Fixed: Changed from fetchUserData to fetchHouseholds
  }, [user, subPopulationFilters]);

  useEffect(() => {
    let mounted = true;
    const fetchFlags = async () => {
      setFlagsLoading(true);
      try {
        const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          `${base}/items/flagged_forms_ecapplus_pmp?filter[status][_neq]=Resolved&limit=-1`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );

        const items: any[] = res.data?.data || res.data || [];
        const map: Record<string, any> = {};
        items.forEach((f: any) => {
          if (f.household_id) map[f.household_id] = f;
        });

        if (mounted) setFlaggedMap(map);
      } catch (e) {
        console.error('Error fetching flagged records', e);
      } finally {
        if (mounted) setFlagsLoading(false);
      }
    };

    fetchFlags();
    return () => { mounted = false; };
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
      message.error(t('Export failed'));
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

  const handleTableChange = (pagination: Pagination) => {
    setTableData((prev) => ({ ...prev, pagination }));
  };

  const handleSubPopulationFilterChange = (filterName: keyof typeof subPopulationFilters, value: string) => {
    setSubPopulationFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  useEffect(() => {
    const applyFilters = () => {
      return households.filter((household) => {
        const matchesGlobalSearch = searchQuery
          ? Object.values(household).some(
              (value) =>
                value &&
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
          : true;

        const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(
          ([key, value]) => {
            if (value === 'all') return true;
            const vcaValue = household[key];
            return value === 'yes'
              ? vcaValue === '1' || vcaValue === true || vcaValue === 'true'
              : vcaValue === '0' || vcaValue === false || vcaValue === 'false';
          }
        );

        return matchesGlobalSearch && matchesSubPopulationFilters;
      });
    };

    const filtered = applyFilters();
    setFilteredHouseholds(filtered);
  }, [searchQuery, searchText, searchedColumn, households, subPopulationFilters]);

  useEffect(() => {
    const mappedData: BasicTableRow[] = filteredHouseholds.map((household, index) => ({
      key: index,
      name: household.caregiver_name || 'N/A',
      age: 0,
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
                handleReset(clearFilters);
                setSearchText('');
                setSearchedColumn('');
                setColumnFilters((prevFilters) => {
                  const newFilters = { ...prevFilters };
                  delete newFilters[dataIndex];
                  return newFilters;
                });
                confirm({ closeDropdown: false });
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

  const handleView = (household_id: string) => {
    const selectedHousehold = households.find(household => household.household_id === household_id);
    navigate(`/profile/household-profile/${encodeURIComponent(household_id)}`, { state: { household: selectedHousehold } });
  };

  const handleExportProfile = async (householdId: string) => {
    try {
      setExportingUid(householdId);
      message.loading({ content: t('Preparing export…'), key: `export-${householdId}` });

      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const household = households.find(h => h.household_id === householdId) || null;
      const services = household?.services ?? (await axios.get(`${base}/household/${encodeURIComponent(householdId)}/services`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []));
      const referrals = household?.referrals ?? (await axios.get(`${base}/household/${encodeURIComponent(householdId)}/referrals`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []));
      const family = await axios.get(`${base}/household/${encodeURIComponent(householdId)}/family`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []);
      const casePlans = await axios.get(`${base}/household/${encodeURIComponent(householdId)}/case-plans`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []);

      let flagged: any[] = [];
      const localFlag = householdId ? flaggedMap[householdId] : undefined;
      if (localFlag) {
        flagged = [localFlag];
      } else {
        const flaggedRes = await axios.get(`${base}/items/flagged_forms_ecapplus_pmp?limit=-1`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []);
        flagged = flaggedRes.filter((f: any) => f?.household_id === householdId || f?.unique_id === householdId || f?.uid === householdId);
      }

      const exportData = [
        {
          section: 'Household',
          household_id: household?.household_id || '',
          caregiver_name: household?.caregiver_name || '',
          homeaddress: household?.homeaddress || '',
          facility: household?.facility || '',
          province: household?.province || '',
          district: household?.district || '',
          ward: household?.ward || '',
          caseworker_name: household?.caseworker_name || '',
          calhiv: household?.calhiv || '',
          hei: household?.hei || '',
          cwlhiv: household?.cwlhiv || '',
          agyw: household?.agyw || '',
          csv: household?.csv || '',
          cfsw: household?.cfsw || '',
          abym: household?.abym || '',
        },
        ...family.map((member: any, index: number) => ({
          section: 'Family',
          family_member_index: index + 1,
          name: member.name || '',
          relationship: member.relationship || '',
          age: member.age || '',
          gender: member.gender || '',
          // Add other family member fields as needed
        })),
        ...casePlans.map((plan: any, index: number) => ({
          section: 'Case Plan',
          case_plan_index: index + 1,
          plan_id: plan.id || '',
          date_created: plan.date_created || '',
          goal: plan.goal || '',
          // Add other case plan fields as needed
        })),
        ...services.map((service: Service, index: number) => ({
          section: 'Service',
          service_index: index + 1,
          service_id: service.id || '',
          service_name: service.name || '',
        })),
        ...referrals.map((referral: Referral, index: number) => ({
          section: 'Referral',
          referral_index: index + 1,
          referral_id: referral.id || '',
          referral_type: referral.type || '',
          referral_date: referral.date || '',
        })),
        ...flagged.map((flag: any, index: number) => ({
          section: 'Flagged Record',
          flag_index: index + 1,
          flag_id: flag.id || '',
          comment: flag.comment || '',
          date_created: flag.date_created || '',
          status: flag.status || '',
        })),
      ];

      const fields = [
        'section',
        'household_id',
        'caregiver_name',
        'homeaddress',
        'facility',
        'province',
        'district',
        'ward',
        'caseworker_name',
        'calhiv',
        'hei',
        'cwlhiv',
        'agyw',
        'csv',
        'cfsw',
        'abym',
        'family_member_index',
        'name',
        'relationship',
        'age',
        'gender',
        'case_plan_index',
        'plan_id',
        'date_created',
        'goal',
        'service_index',
        'service_id',
        'service_name',
        'referral_index',
        'referral_id',
        'referral_type',
        'referral_date',
        'flag_index',
        'flag_id',
        'comment',
        'status',
      ];

      const parser = new Parser({ fields });
      const csvData = parser.parse(exportData);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

      const safeName = (household?.caregiver_name || householdId || 'household_profile')
        .toString()
        .replace(/[^\w\-]+/g, '_')
        .slice(0, 120);
      const fileName = `${safeName}_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

      saveAs(blob, fileName);

      message.success({ content: t('Export completed'), key: `export-${householdId}`, duration: 2 });
    } catch (err) {
      console.error('Error exporting household profile', err);
      message.error(t('Export failed'));
    } finally {
      setExportingUid(null);
    }
  };

  const handleExportAllFiltered = async () => {
    try {
      setExportingGlobal(true);
      message.loading({ content: t('Preparing export…'), key: 'export-all' });

      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const zip = new JSZip();

      for (const hh of filteredHouseholds) {
        const hhFolder = zip.folder(hh.household_id || 'unknown');
        const services = hh.services ?? (await axios.get(`${base}/household/${encodeURIComponent(hh.household_id)}/services`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []));
        const referrals = hh.referrals ?? (await axios.get(`${base}/household/${encodeURIComponent(hh.household_id)}/referrals`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []));
        const family = await axios.get(`${base}/household/${encodeURIComponent(hh.household_id)}/family`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []);
        const casePlans = await axios.get(`${base}/household/${encodeURIComponent(hh.household_id)}/case-plans`, { headers }).then(r => r.data?.data ?? r.data ?? []).catch(() => []);

        const flaggedLocal = hh.household_id ? flaggedMap[hh.household_id] : undefined;
        let flaggedArr: any[] = [];
        if (flaggedLocal) flaggedArr = [flaggedLocal];

        hhFolder?.file('household.json', JSON.stringify(hh, null, 2));
        hhFolder?.file('services.json', JSON.stringify(services ?? [], null, 2));
        hhFolder?.file('referrals.json', JSON.stringify(referrals ?? [], null, 2));
        hhFolder?.file('family.json', JSON.stringify(family ?? [], null, 2));
        hhFolder?.file('casePlans.json', JSON.stringify(casePlans ?? [], null, 2));
        hhFolder?.file('flaggedRecords.json', JSON.stringify(flaggedArr ?? [], null, 2));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const outName = `households_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`;
      saveAs(blob, outName);

      message.success({ content: t('Export completed'), key: 'export-all', duration: 2 });
    } catch (err) {
      console.error('Error exporting all households', err);
      message.error(t('Export failed'));
    } finally {
      setExportingGlobal(false);
    }
  };

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
      title: t('Flag'),
      dataIndex: 'flag',
      width: '8%',
      render: (_: any, record: BasicTableRow) => {
        const keyId = (record as any).household_id;
        const flag = keyId ? flaggedMap[keyId] : undefined;
        if (!flag) return null;

        const tooltipContent = (
          <div style={{ maxWidth: 360, wordBreak: 'break-word' }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>{t('Comment')}</div>
            <div style={{ whiteSpace: 'normal' }}>{flag.comment || '—'}</div>
            {flag.date_created && <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>Created: {new Date(flag.date_created).toLocaleString()}</div>}
          </div>
        );

        return (
          <Tooltip placement="topLeft" title={tooltipContent}>
            <Tag color="red" style={{ cursor: 'pointer' }}>{t('Flagged')}</Tag>
          </Tooltip>
        );
      }
    },
    {
      title: t('Applied Filters & Search'),
      dataIndex: 'appliedFilters',
      width: '20%',
      render: (text: string, record: Household) => {
        const appliedFilters = Object.entries(subPopulationFilters)
          .filter(([key, value]) => value !== 'all')
          .map(([key]) => subPopulationFilterLabels[key as keyof typeof subPopulationFilterLabels]);
        const appliedColumnFilters = Object.entries(columnFilters)
          .filter(([key, value]) => value !== '')
          .map(([key, value]) => {
            if (key === 'address') {
              return `${value}`;
            } else {
              return `${value}`;
            }
          });

        const allAppliedFilters = [
          ...appliedFilters,
          ...appliedColumnFilters,
        ];

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
          <BaseButton type="primary" onClick={() => handleView(record.household_id)}>
            {t('View')}
          </BaseButton>
          <BaseButton
            type="default"
            onClick={() => handleExportProfile(record.household_id)}
            disabled={exportingUid === record.household_id || exportingGlobal}
          >
            {exportingUid === record.household_id ? t('Exporting...') : t('Export Profile')}
          </BaseButton>
        </BaseSpace>
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
          <h5 style={{ fontSize: '20px', margin: '16px 16px 8px 0' }}> {t('Filter by Sub Population')} </h5>
          <Row align="middle" style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            {
              Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <div key={key} style={{ marginRight: '16px', marginBottom: '1px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} >
                  <span style={{ fontSize: '12px' }}> {label} </span>
                  <Select
                    style={{ width: '100px' }}
                    value={subPopulationFilters[key as keyof typeof subPopulationFilters]}
                    onChange={(newValue) => handleSubPopulationFilterChange(key as keyof typeof subPopulationFilters, newValue)}
                  >
                    <Select.Option value="all" > {t('All')} </Select.Option>
                    <Select.Option value="yes" > {t('Yes')} </Select.Option>
                    <Select.Option value="no" > {t('No')} </Select.Option>
                  </Select>
                </div>
              ))}
          </Row>
        </Col>
        <Col>
          <ExportWrapper>
            <Space style={{ marginTop: '20px' }}>
              <Button type="primary" onClick={clearAllFiltersAndSearch}>
                {t('Clear Filters')}
              </Button>
              <Button type="primary" onClick={exportToCSV}>
                {t('Export to CSV')}
              </Button>
              <Button
                type="primary"
                onClick={handleExportAllFiltered}
                disabled={exportingGlobal || !!exportingUid}
              >
                {exportingGlobal ? t('Exporting...') : t('Export All')}
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
        onChange={handleTableChange}
      /> 
    </div>
  );
};