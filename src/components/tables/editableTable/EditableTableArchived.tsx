/* eslint-disable prettier/prettier */
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

export const EditableTableArchived: React.FC = () => {
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
  const [columnFilterClear, setColumnFilterClear] = useState<string>('');

  const [filters, setFilters] = useState([
    { key: 'de_registration_reason', value: '' }
  ]);

  // --- NEW: flagged records state ---
  const [flaggedMap, setFlaggedMap] = useState<Record<string, any>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);

  // --- NEW: exporting state for per-row export ---
  const [exportingUid, setExportingUid] = useState<string | null>(null);

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

        const filterValue = filters.find(filter => filter.key === 'de_registration_reason')?.value || '';

        const response = await axios.get(
          `https://ecapplus.server.dqa.bluecodeltd.com/household/all-households-archived/${user?.location}`,
          {
            params: {
              de_registration_reason: filterValue,
            },
          }
        );

        setHouseholds(Array.isArray(response.data?.data) ? response.data.data : []);
        setFilteredHouseholds(Array.isArray(response.data?.data) ? response.data.data : []);
        console.log('Fetched households with filter:', response.data.data);
      } catch (error) {
        console.error('Error fetching households data:', error);
      } finally {
        setTableData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchHouseholds();
  }, [user, filters]);

  // --- NEW: fetch active flagged records once (keyed by household_id) ---
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
        console.error('Error fetching flagged records (archived)', e);
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

    // Reset the graduation filter
    setFilters([
      { key: 'de_registration_reason', value: '' }
    ]);
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
      URL.revokeObjectURL(link.href);
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
  const handleTableChange = (pagination: Pagination) => {
    setTableData((prev) => ({ ...prev, pagination }));
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
      <div style={{ padding: 8 }}>
        <Input
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
    filterIcon: (filtered: any) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string | number | boolean, record: { [x: string]: any; }) => {
      const fieldValue = record[dataIndex];
      return fieldValue ? fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase()) : false;
    },
    onFilterDropdownVisibleChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (

        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text || ''}
        />
      ) : (
        text
      ),
  });

  // --- NEW: export profile for a household (csv, includes family members, case plans, services, referrals, flags) ---
  const handleExportProfile = async (householdId: string) => {
    try {
      setExportingUid(householdId);
      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Helpers: try multiple possible paths for each resource and return the first successful array/object
      const tryPaths = async (paths: string[]) => {
        for (const p of paths) {
          try {
            const res = await axios.get(p, { headers });
            if (res?.status === 200 && (res.data?.data || res.data)) {
              return res.data?.data ?? res.data;
            }
          } catch (e) {
            // ignore and try next
          }
        }
        return null;
      };

      // Candidate endpoints (fallbacks). These are best-effort guesses — if your backend uses different endpoints update them.
      const householdPaths = [
        `${base}/household/get-household/${householdId}`,
        `${base}/household/household/${householdId}`,
        `${base}/household/${householdId}`,
        `${base}/household/view/${householdId}`,
        `${base}/household/${householdId}/profile`,
        `${base}/household_profile/${householdId}`,
      ];

      const familyPaths = [
        `${base}/household/family-members/${householdId}`,
        `${base}/family-members/${householdId}`,
        `${base}/household/${householdId}/family-members`,
        `${base}/member/household/${householdId}`,
      ];

      const casePlanPaths = [
        `${base}/case-plans?filter[household_id][_eq]=${householdId}&limit=-1`,
        `${base}/case_plans?filter[household_id][_eq]=${householdId}&limit=-1`,
        `${base}/household/${householdId}/case-plans`,
        `${base}/household/${householdId}/case_plans`,
      ];

      const servicesPaths = [
        `${base}/services?filter[household_id][_eq]=${householdId}&limit=-1`,
        `${base}/household/${householdId}/services`,
        `${base}/household/${householdId}/service_history`,
      ];

      const referralsPaths = [
        `${base}/referrals?filter[household_id][_eq]=${householdId}&limit=-1`,
        `${base}/household/${householdId}/referrals`,
      ];

      const flagsPaths = [
        `${base}/items/flagged_forms_ecapplus_pmp?filter[household_id][_eq]=${householdId}&limit=-1`,
        `${base}/items/flagged_forms_ecapplus_pmp?filter[household_id][_eq]=${householdId}`,
      ];

      // Fetch everything in parallel using the tryPaths helper
      const [householdRes, familyRes, casePlansRes, servicesRes, referralsRes, flagsRes] = await Promise.all([
        tryPaths(householdPaths),
        tryPaths(familyPaths),
        tryPaths(casePlanPaths),
        tryPaths(servicesPaths),
        tryPaths(referralsPaths),
        tryPaths(flagsPaths),
      ]);

      // Build payload arrays (fall back to in-memory data if API calls didn't return)
      const householdRecord: any = householdRes ?? households.find(h => h.household_id === householdId) ?? null;
      const familyMembers: any[] = Array.isArray(familyRes) ? familyRes : (familyRes ? [familyRes] : []);
      const casePlans: any[] = Array.isArray(casePlansRes) ? casePlansRes : (casePlansRes ? [casePlansRes] : []);
      const services: any[] = Array.isArray(servicesRes) ? servicesRes : (servicesRes ? [servicesRes] : []);
      const referrals: any[] = Array.isArray(referralsRes) ? referralsRes : (referralsRes ? [referralsRes] : []);

      // flagged: prefer flaggedMap preloaded; else use API result
      let flagged: any = flaggedMap[householdId] ?? null;
      if (!flagged && flagsRes) {
        if (Array.isArray(flagsRes) && flagsRes.length > 0) flagged = flagsRes[0];
        else if (flagsRes) flagged = flagsRes;
      }

      // We'll construct a "tall" CSV where each row is a key/value pair with a section label.
      // Columns: section, profile_id, entity, entity_id, key, value
      const rows: any[] = [];

      const pushObjectAsRows = (section: string, profileId: string | undefined, entityName: string, entityId: string | undefined, obj: any) => {
        if (!obj) return;
        // If obj is an array (e.g., list of members) we'll create one group header per item then push its keys
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => {
            const itemId = (item && (item.id || item._id || item.member_id || item.household_id)) || `${entityName}-${idx}`;
            rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: '__item_start__', value: '' });
            Object.entries(item).forEach(([k, v]) => {
              let val = '';
              try {
                val = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
              } catch (e) {
                val = String(v);
              }
              rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: k, value: val });
            });
            rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: '__item_end__', value: '' });
          });
        } else {
          const item = obj;
          const itemId = (item && (item.id || item._id || item.member_id || item.household_id)) || entityId || '';
          rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: '__item_start__', value: '' });
          Object.entries(item || {}).forEach(([k, v]) => {
            let val = '';
            try {
              val = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
            } catch (e) {
              val = String(v);
            }
            rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: k, value: val });
          });
          rows.push({ section, profile_id: profileId || householdId, entity: entityName, entity_id: itemId, key: '__item_end__', value: '' });
        }
      };

      // Household
      pushObjectAsRows('Household', householdId, 'Household', householdRecord?.household_id || householdId, householdRecord || {});

      // Family members
      pushObjectAsRows('Family Member', householdId, 'FamilyMember', undefined, familyMembers.length ? familyMembers : []);

      // Case plans
      pushObjectAsRows('Case Plan', householdId, 'CasePlan', undefined, casePlans.length ? casePlans : []);

      // Services
      pushObjectAsRows('Service', householdId, 'Service', undefined, services.length ? services : []);

      // Referrals
      pushObjectAsRows('Referral', householdId, 'Referral', undefined, referrals.length ? referrals : []);

      // Flagged
      pushObjectAsRows('Flagged Record', householdId, 'Flag', undefined, flagged ? [flagged] : []);

      // Add an export metadata row
      rows.unshift({ section: 'Export Metadata', profile_id: householdId, entity: 'ExportInfo', entity_id: '', key: 'exportedAt', value: new Date().toISOString() });

      // Create CSV
      const fields = ['section', 'profile_id', 'entity', 'entity_id', 'key', 'value'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `household_profile_${householdId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error exporting household profile', err);
      // As a final fallback, export the minimal in-memory household and flagged record as CSV
      try {
        const householdRecord = households.find(h => h.household_id === householdId) || {};
        const flagged = flaggedMap[householdId] || null;
        const rowsFallback: any[] = [];
        rowsFallback.push({ section: 'Household', profile_id: householdId, entity: 'Household', entity_id: householdId, key: 'household_id', value: householdRecord.household_id || '' });
        Object.entries(householdRecord || {}).forEach(([k, v]) => rowsFallback.push({ section: 'Household', profile_id: householdId, entity: 'Household', entity_id: householdId, key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }));
        if (flagged) {
          rowsFallback.push({ section: 'Flagged Record', profile_id: householdId, entity: 'Flag', entity_id: flagged.id || '', key: 'comment', value: flagged.comment || '' });
        }
        const parserFallback = new Parser({ fields: ['section', 'profile_id', 'entity', 'entity_id', 'key', 'value'] });
        const csvFallback = parserFallback.parse(rowsFallback);
        const blob = new Blob([csvFallback], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `household_profile_${householdId}_fallback.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (err2) {
        console.error('Fallback export also failed', err2);
      }
    } finally {
      setExportingUid(null);
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
      render: (text: string) => <div style={{ whiteSpace: 'pre-line' }}>{text}</div>,
    },
    {
      title: t('Case Worker'),
      dataIndex: 'caseworker_name',
      width: '15%',
      ...getColumnSearchProps('caseworker_name'),
    },
    // --- NEW: Flag column ---
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

        // Collect the graduation filter (if applied)
        const graduationFilter = filters.find(filter => filter.key === 'de_registration_reason')?.value || '';

        // Collect column-specific filters
        const appliedColumnFilters = Object.entries(columnFilters)
          .filter(([key, value]) => value !== '')
          .map(([key, value]) => {
            if (key === 'address') {
              // Format Household Details filters based on the specific field being searched
              return `${value}`;
            } else {
              // Format other columns as "Column Name: Search Text"
              return `${value}`;
            }
          });

        // Combine all applied filters into a single array
        const allAppliedFilters = [
          ...appliedFilters,
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
      render: (text: string, record: BasicTableRow) => (
        <BaseSpace>
          <BaseButton type="primary" onClick={() => handleView(record.household_id)}>
            {t('View')}
          </BaseButton>

          <BaseButton
            type="default"
            onClick={() => handleExportProfile(record.household_id)}
            disabled={exportingUid === record.household_id}
          >
            {exportingUid === record.household_id ? t('Exporting...') : t('Export Profile')}
          </BaseButton>
        </BaseSpace>
      ),
    },
  ];

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase(); // Use searchQuery for global search
    const lowerCaseSearchText = searchText.toLowerCase(); // Use searchText for column-specific search
    const deRegReasonFilter = filters.find(filter => filter.key === 'de_registration_reason')?.value || '';

    const filtered = households.filter((household) => {
      // Global search (searchQuery)
      const matchesGlobalSearch =
        (household.household_id?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.caregiver_name?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.homeaddress?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.ward?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (household.caseworker_name?.toLowerCase() || '').includes(lowerCaseQuery);

      // Graduation filter
      const matchesDeRegReason =
        deRegReasonFilter === '' || household.de_registration_reason === deRegReasonFilter;

      return matchesGlobalSearch && matchesDeRegReason;
    });

    setFilteredHouseholds(filtered);
  }, [searchQuery, searchText, searchedColumn, households, filters]);

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

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', paddingBottom: "0px" }}>{t('Filter by Graduation')}
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
                    <Select.Option value="Graduated (Household has met the graduation benchmarks in ALL domains)" > Met ALL graduation benchmarks </Select.Option>
                    <Select.Option value="Exited without graduation" > Exited without graduation </Select.Option>
                    <Select.Option value="Transferred to other OVC program" > Transferred to other OVC program </Select.Option>
                    <Select.Option value="Lost to follow-up" > Lost to follow - up </Select.Option>
                    <Select.Option value="Passed on" > Passed on </Select.Option>
                    <Select.Option value="Aging without transition plan" > Aging without transition plan </Select.Option>
                    <Select.Option value="Moved (Relocated)" > Moved(Relocated) </Select.Option>
                    <Select.Option value="Other" > Other </Select.Option>
                  </Select>
                </span>
              </div>
            </div>
          </Row>
        </Col>
        <Col style={{ marginTop: '16px' }}>
          <ExportWrapper>
            <Space>
              {/* Button to clear all filters and search */}
              <Button type="primary" onClick={clearAllFiltersAndSearch} >
                {t('Clear Filters')}
              </Button>
              {/* Button to export to CSV */}
              <Button type="primary" onClick={exportToCSV} >
                {t('Export to CSV')}
              </Button>
            </Space>
          </ExportWrapper>
        </Col>
      </Row>
      <BaseTable
        columns={columns}
        dataSource={tableData.data}
        pagination={tableData.pagination}
        loading={tableData.loading}
        scroll={{ x: 1000 }}
        style={{ overflowX: 'auto' }}
        onChange={handleTableChange} // Add this line to handle table pagination
      />
    </div>
  );
};

export default EditableTableArchived;
