/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Input, InputRef, Button, Tooltip, Row, Col, Select, Space, Modal, Typography, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import { BasicTableRow, Pagination } from '@app/api/table.api';
import { useNavigate } from 'react-router-dom';
import { FilterDropdownProps } from 'antd/lib/table/interface';
import styled from 'styled-components';
import { Parser } from 'json2csv';
import { SearchInput } from '@app/components/common/inputs/SearchInput/SearchInput.styles';

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
  household_id?: string;
  [key: string]: any;
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

  // --- NEW: flagged records state ---
  const [flaggedMap, setFlaggedMap] = useState<Record<string, any>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);

  // --- NEW: per-row exporting state ---
  const [exportingUid, setExportingUid] = useState<string | null>(null);

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
    { key: 'reason', value: '' }
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

  // --- NEW: fetch active flagged records once (keyed by vca uid and possible vca_id) ---
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
          if (f.vca_id) map[f.vca_id] = f;
          if (f.unique_id) map[f.unique_id] = f; // sometimes flagged records may store a unique id
          if (f.uid) map[f.uid] = f;
        });

        if (mounted) setFlaggedMap(map);
      } catch (e) {
        console.error('Error fetching flagged records (VCA table)', e);
      } finally {
        if (mounted) setFlagsLoading(false);
      }
    };

    fetchFlags();
    return () => { mounted = false; };
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

  // --- NEW: per-row export handler (CSV) ---
  const handleExportProfile = async (uid: string) => {
    try {
      setExportingUid(uid);
      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const selectedVca = vcas.find((v) => v.uid === uid) || null;
      const householdId = selectedVca?.household_id || (selectedVca && (selectedVca.household?.household_id || selectedVca.household)) || undefined;

      const tryPaths = async (paths: string[]) => {
        for (const p of paths) {
          try {
            const res = await axios.get(p, { headers });
            if (res?.status === 200 && (res.data?.data || res.data)) return res.data?.data ?? res.data;
          } catch (e) {
            // ignore
          }
        }
        return null;
      };

      const vcaPaths = [
        `${base}/child/vca/${uid}`,
        `${base}/child/vca/${uid}/profile`,
        `${base}/child/vcas/${uid}`,
        `${base}/child/${uid}`,
      ];

      const familyPaths = [
        `${base}/child/vca-family/${uid}`,
        ...(householdId ? [`${base}/household/family-members/${householdId}`, `${base}/family-members/${householdId}`] : []),
        `${base}/child/family-members/${uid}`,
      ];

      const casePlanPaths = [
        `${base}/case-plans?filter[uid][_eq]=${uid}&limit=-1`,
        `${base}/case_plans?filter[uid][_eq]=${uid}&limit=-1`,
        `${base}/case-plans?filter[vca_uid][_eq]=${uid}&limit=-1`,
        `${base}/child/${uid}/case-plans`,
      ];

      const servicesPaths = [
        `${base}/child/vca-services/${uid}`,
        `${base}/services?filter[uid][_eq]=${uid}&limit=-1`,
        `${base}/services?filter[vca_uid][_eq]=${uid}&limit=-1`,
      ];

      const referralsPaths = [
        `${base}/child/vca-referrals/${uid}`,
        `${base}/referrals?filter[vca_uid][_eq]=${uid}&limit=-1`,
      ];

      const flagsPaths = [
        `${base}/items/flagged_forms_ecapplus_pmp?filter[uid][_eq]=${uid}&limit=-1`,
        `${base}/items/flagged_forms_ecapplus_pmp?filter[vca_id][_eq]=${uid}&limit=-1`,
        `${base}/items/flagged_forms_ecapplus_pmp?filter[unique_id][_eq]=${uid}&limit=-1`,
        `${base}/items/flagged_forms_ecapplus_pmp?limit=-1`,
      ];

      const [vcaRes, familyRes, casePlansRes, servicesRes, referralsRes, flagsRes] = await Promise.all([
        tryPaths(vcaPaths),
        tryPaths(familyPaths),
        tryPaths(casePlanPaths),
        tryPaths(servicesPaths),
        tryPaths(referralsPaths),
        tryPaths(flagsPaths),
      ]);

      const vcaRecord: any = vcaRes ?? selectedVca ?? null;
      const familyMembers: any[] = Array.isArray(familyRes) ? familyRes : (familyRes ? [familyRes] : []);
      const casePlans: any[] = Array.isArray(casePlansRes) ? casePlansRes : (casePlansRes ? [casePlansRes] : []);
      const services: any[] = Array.isArray(servicesRes) ? servicesRes : (servicesRes ? [servicesRes] : []);
      const referrals: any[] = Array.isArray(referralsRes) ? referralsRes : (referralsRes ? [referralsRes] : []);

      // flagged: prefer flaggedMap preloaded; else use API result (flagsRes)
      let flagged: any = null;
      if (flaggedMap[uid]) flagged = flaggedMap[uid];
      else if (Array.isArray(flagsRes) && flagsRes.length > 0) flagged = flagsRes;
      else if (flagsRes) flagged = Array.isArray(flagsRes) ? flagsRes : [flagsRes];

      const rows: any[] = [];

      const pushObjectAsRows = (section: string, profileId: string | undefined, entityName: string, entityId: string | undefined, obj: any) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => {
            const itemId = (item && (item.id || item._id || item.member_id || item.uid || item.unique_id)) || `${entityName}-${idx}`;
            rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: '__item_start__', value: '' });
            Object.entries(item).forEach(([k, v]) => {
              let val = '';
              try { val = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); } catch (e) { val = String(v); }
              rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: k, value: val });
            });
            rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: '__item_end__', value: '' });
          });
        } else {
          const item = obj;
          const itemId = (item && (item.id || item._id || item.member_id || item.uid || item.unique_id)) || entityId || '';
          rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: '__item_start__', value: '' });
          Object.entries(item || {}).forEach(([k, v]) => {
            let val = '';
            try { val = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); } catch (e) { val = String(v); }
            rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: k, value: val });
          });
          rows.push({ section, profile_id: profileId || uid, entity: entityName, entity_id: itemId, key: '__item_end__', value: '' });
        }
      };

      // Build rows
      pushObjectAsRows('VCA', uid, 'VCA', vcaRecord?.uid || uid, vcaRecord || {});
      pushObjectAsRows('Family Member', uid, 'FamilyMember', undefined, familyMembers.length ? familyMembers : []);
      pushObjectAsRows('Case Plan', uid, 'CasePlan', undefined, casePlans.length ? casePlans : []);
      pushObjectAsRows('Service', uid, 'Service', undefined, services.length ? services : []);
      pushObjectAsRows('Referral', uid, 'Referral', undefined, referrals.length ? referrals : []);
      pushObjectAsRows('Flagged Record', uid, 'Flag', undefined, flagged ? flagged : []);

      // Export metadata
      rows.unshift({ section: 'Export Metadata', profile_id: uid, entity: 'ExportInfo', entity_id: '', key: 'exportedAt', value: new Date().toISOString() });

      const fields = ['section', 'profile_id', 'entity', 'entity_id', 'key', 'value'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vca_profile_${uid}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error exporting VCA profile', err);
      // Fallback: export minimal in-memory record as CSV
      try {
        const selectedVca = vcas.find((v) => v.uid === uid) || {};
        const flagged = flaggedMap[uid] || null;
        const rowsFallback: any[] = [];
        rowsFallback.push({ section: 'VCA', profile_id: uid, entity: 'VCA', entity_id: uid, key: 'uid', value: selectedVca.uid || '' });
        Object.entries(selectedVca || {}).forEach(([k, v]) => rowsFallback.push({ section: 'VCA', profile_id: uid, entity: 'VCA', entity_id: uid, key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }));
        if (flagged) rowsFallback.push({ section: 'Flagged Record', profile_id: uid, entity: 'Flag', entity_id: flagged.id || '', key: 'comment', value: flagged.comment || '' });
        const parserFallback = new Parser({ fields: ['section', 'profile_id', 'entity', 'entity_id', 'key', 'value'] });
        const csvFallback = parserFallback.parse(rowsFallback);
        const blob = new Blob([csvFallback], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vca_profile_${uid}_fallback.csv`;
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
        if (searchInput.current && (searchInput.current as any).input) {
          (searchInput.current as any).input.value = ''; // Clear the search input field
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
        <SearchInput
          className="column-filter"
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
    // --- NEW: Flag column ---
    {
      title: t('Flag'),
      dataIndex: 'flag',
      width: '8%',
      render: (_: any, record: TableDataItem) => {
        const keyId = record.unique_id;
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
        <Space size="middle">
          <BaseButton type="primary" onClick={() => handleView(record.unique_id)}>
            {t('View')}
          </BaseButton>

          <BaseButton
            type="default"
            onClick={() => handleExportProfile(record.unique_id)}
            disabled={exportingUid === record.unique_id}
          >
            {exportingUid === record.unique_id ? t('Exporting...') : t('Export Profile')}
          </BaseButton>
        </Space>
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
