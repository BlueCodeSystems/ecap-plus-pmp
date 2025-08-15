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
  reason: string;
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

export const TreeTableArchived: React.FC = () => {
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
  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [vcaProfile, setVcaProfile] = useState<Vca | null>(null);
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
        setLoadingUserData(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, []);

  const [filters, setFilters] = useState([
    { key: 'reason', value: '' }
  ]);

  // Unified fetch function (single source of truth)
  const fetchVcas = async (isInitialFetch: boolean = false) => {
    if (!user) return;

    try {
      // set table loading
      setTableData(prev => ({ ...prev, loading: true }));

      const filterValue = filters.find((filter) => filter.key === 'reason')?.value || '';
      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const response = await axios.get(
        `${base}/child/vcas-archived-register/${user.location}`,
        {
          params: { reason: filterValue }
        }
      );

      const data: Vca[] = Array.isArray(response.data?.data) ? response.data.data : [];

      if (isInitialFetch) {
        setInitialVcas(prev => prev.length === 0 ? data : prev);
      }

      setVcas(data);
      setFilteredVcas(data);

      // Map to table rows immediately so BaseTable has data to render
      const mappedData: TableDataItem[] = data.map((vca, index) => ({
        key: index,
        unique_id: vca.uid,
        name: `${vca.firstname || ''} ${vca.lastname || ''}`.trim(),
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

      setTableData(prev => ({ ...prev, data: mappedData, pagination: { ...prev.pagination, current: 1 }, loading: false }));
      console.log('Fetched VCAs:', data);
    } catch (error) {
      console.error('Error fetching VCAs data:', error);
      setTableData(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch once when user becomes available (initial)
  useEffect(() => {
    if (!user) return;
    fetchVcas(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch when filters change (not initial)
  useEffect(() => {
    if (!user) return;
    fetchVcas(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // --- NEW: fetch active flagged records (keyed by vca uid / vca_id / unique_id) ---
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
          if (f.unique_id) map[f.unique_id] = f;
          if (f.uid) map[f.uid] = f;
        });

        if (mounted) setFlaggedMap(map);
      } catch (err) {
        console.error('Error fetching flagged records (archived VCA table)', err);
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
      // Combine all searchable fields into a single string
      const searchableFields = [
        vca.uid, // Unique ID
        vca.firstname,
        vca.lastname,
        vca.vca_gender,
        vca.homeaddress,
        vca.facility,
        vca.province,
        vca.district,
        vca.ward,
        vca.calhiv,
        vca.hei,
        vca.cwlhiv,
        vca.agyw,
        vca.csv,
        vca.cfsw,
        vca.abym,
        vca.vl_suppressed,
        vca.child_adolescent_in_aged_headed_household,
        vca.child_adolescent_in_chronically_ill_headed_household,
        vca.child_adolescent_in_child_headed_household,
        vca.child_adolescent_living_with_disability,
        vca.child_adolescent_in_female_headed_household,
        vca.under_5_malnourished,
        vca.pbfw,
        vca.reason,
      ].filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Check if the search query matches any part of the combined searchable fields
      const matchesSearch = searchableFields.includes(lowerCaseQuery);

      // Check if the record matches the sub-population filters
      const matchesSubPopulationFilters = Object.entries(subPopulationFilters).every(([filterKey, value]) => {
        if (value === 'all') return true;

        let dataKey = filterKey;
        if (filterKey in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[filterKey as keyof typeof filterKeyToDataKey];
        }

        const vcaValue = vca[dataKey as keyof Vca];
        if (vcaValue === null || vcaValue === undefined) return false;
        if (value === 'yes') return vcaValue === '1' || vcaValue === 'true' || vcaValue === 1 || vcaValue === true;
        return vcaValue === '0' || vcaValue === 'false' || vcaValue === 0 || vcaValue === false;
      });

      // Check if the record matches the graduation filter
      const graduationFilterValue = filters.find(filter => filter.key === "reason")?.value || '';
      const matchesGraduationFilter = graduationFilterValue === '' || vca.reason === graduationFilterValue;

      // Return true if the record matches all conditions
      return matchesSearch && matchesSubPopulationFilters && matchesGraduationFilter;
    });

    // Update the filteredVcas state with the filtered results
    setFilteredVcas(filtered);

    // Map the filtered data to the table format
    const mappedData: TableDataItem[] = filtered.map((vca, index) => ({
      key: index,
      unique_id: vca.uid,
      name: `${vca.firstname || ''} ${vca.lastname || ''}`.trim(),
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

    // Update the table data state and reset pagination to the first page
    setTableData(prev => ({
      data: mappedData,
      pagination: { ...prev.pagination, current: 1 },
      loading: false
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, vcas, subPopulationFilters, filters]);

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
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Exports all currently filtered VCAs as a single JSON file
  const handleExport = async () => {
    try {
      const payload = {
        vcas: filteredVcas || [],
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const filename = `vcas_profiles_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error exporting profiles (global export):', err);
    }
  };

  // --- NEW: per-row export handler (CSV) ---
  const handleExportProfile = async (uid: string) => {
    try {
      setExportingUid(uid);
      const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Try to get the VCA row data from current state
      const selectedVca = vcas.find((v) => v.uid === uid) || null;
      const householdId = selectedVca?.household_id || (selectedVca && (selectedVca.household?.household_id || selectedVca.household)) || undefined;

      const tryPaths = async (paths: string[]) => {
        for (const p of paths) {
          try {
            const res = await axios.get(p, { headers });
            if (res?.status === 200 && (res.data?.data || res.data)) return res.data?.data ?? res.data;
          } catch (e) {
            // ignore and try next
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

  const handleTableChange = (pagination: Pagination) => {
    setTableData((prev) => ({ ...prev, pagination }));
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
      name: `${vca.firstname || ''} ${vca.lastname || ''}`.trim(),
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

    // Clear search input fields (if visible)
    if (searchInput.current && (searchInput.current as any).input) {
      (searchInput.current as any).input.value = '';
    }
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
          onChange={(e) => {
            const searchValue = e.target.value;
            setSelectedKeys(searchValue ? [searchValue] : []);

            // If the dataIndex is 'address', determine which subfield is being searched
            if (dataIndex === 'address') {
              const subfields = ['homeaddress', 'facility', 'province', 'district', 'ward'];
              let matchedSubfield = '';

              if (searchValue && vcas.length > 0) {
                const firstVca = vcas[0];
                for (const subfield of subfields) {
                  const val = firstVca[subfield as keyof Vca];
                  if (val && val.toString().toLowerCase().includes(searchValue.toLowerCase())) {
                    matchedSubfield = subfield.charAt(0).toUpperCase() + subfield.slice(1);
                    break;
                  }
                }
              }

              setHouseholdSearchField(matchedSubfield);
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
                clearFilters();
                setSearchText('');
                setSearchedColumn('');
                setColumnFilters((prevFilters) => {
                  const newFilters = { ...prevFilters };
                  delete newFilters[dataIndex];
                  return newFilters;
                });
                if (dataIndex === 'address') {
                  setHouseholdSearchField('');
                }
                confirm({ closeDropdown: false });
              }
            }}
            style={{ width: 125 }}
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
    onFilter: (value: string | number | boolean, record: { [x: string]: any }) => {
      const fieldValue = record[dataIndex];
      const filterValue = value.toString().toLowerCase();

      if (dataIndex === 'address') {
        const addressFields = Object.values(record.address || {}).filter(Boolean);
        const addressString = addressFields.join(' ').toLowerCase();

        if (record.address?.ward?.toLowerCase().includes(filterValue)) {
          return true;
        }

        return addressString.includes(filterValue);
      }

      if (dataIndex === 'unique_id' || dataIndex === 'gender' || dataIndex === 'age') {
        return fieldValue ? fieldValue.toString().toLowerCase() === filterValue : false;
      }

      return fieldValue ? fieldValue.toString().toLowerCase().includes(filterValue) : false;
    },
    render: (text: any, record: TableDataItem) => {
      if (dataIndex === 'address') {
        const addressFields = [
          `Address: ${record.address.homeaddress || ''}`,
          `Facility: ${record.address.facility || ''}`,
          `Province: ${record.address.province || ''}`,
          `District: ${record.address.district || ''}`,
          `Ward: ${record.address.ward || ''}`,
        ].filter((field) => !field.endsWith(': '));

        return (
          <div>
            {addressFields.map((field, index) => (
              <div key={index}>
                {searchedColumn === dataIndex && searchText && field.toLowerCase().includes(searchText.toLowerCase()) ? (
                  <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0}}
                    searchWords={[searchText]}
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
        const keyId = record.unique_id ?? (record as any).vca_id ?? (record as any).uid ?? (record as any).id;
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
        const appliedSubPopulationFilters = Object.entries(subPopulationFilters)
          .filter(([key, value]) => value !== 'all')
          .map(([key]) => subPopulationFilterLabels[key as keyof typeof subPopulationFilterLabels]);

        const graduationFilter = filters.find(filter => filter.key === "reason")?.value || "";

        const appliedColumnFilters = Object.entries(columnFilters)
          .filter(([key, value]) => value !== '')
          .map(([key, value]) => {
            if (key === 'address') {
              return `${householdSearchField}: ${value}`;
            } else {
              return `${key}: ${value}`;
            }
          });

        const allAppliedFilters = [
          ...appliedSubPopulationFilters,
          ...(graduationFilter ? [`${graduationFilter}`] : []),
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
          <Tooltip title={t('You can search by Unique ID, Full Name, Gender, and other fields.')}>
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
            {/* Filter by Graduation */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
               <span style={{ fontSize: '12px', paddingBottom: "0px", textAlign: "center" }}>
                  {t('Filter by Graduation')}
               </span>
                <span>
                  <Select
                    style={{ width: 300, marginLeft: 1 }}
                    value={
                      Array.isArray(filters) && filters.find((filter) => filter.key === 'reason')?.value || undefined
                    }
                    onChange={(value) => handleSubPopFilterChange('reason', value)}
                    placeholder="Select Option"
                    dropdownRender={(menu) => (
                      <div style={{ fontWeight: 'normal' }}>
                        {menu}
                      </div>
                    )}
                  >
                                       <Select.Option value="Graduated (Household has met the graduation benchmarks in ALL domains)">
                      Met ALL graduation benchmarks
                    </Select.Option>
                    <Select.Option value="Exited without graduation">
                      Exited without graduation
                    </Select.Option>
                    <Select.Option value="Transferred to other OVC program">
                      Transferred to other OVC program
                    </Select.Option>
                    <Select.Option value="Lost to follow-up">
                      Lost to follow-up
                    </Select.Option>
                    <Select.Option value="Passed on">
                      Passed on
                    </Select.Option>
                    <Select.Option value="Aging without transition plan">
                      Aging without transition plan
                    </Select.Option>
                    <Select.Option value="Moved (Relocated)">
                      Moved (Relocated)
                    </Select.Option>
                    <Select.Option value="Other">
                      Other
                    </Select.Option>
                  </Select>
                </span>
              </div>
            </div>
          </Row>
        </Col>
        <Col>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        columns={columns}
        dataSource={tableData.data}
        pagination={tableData.pagination}
        loading={tableData.loading}
        scroll={{ x: 1000 }}
        style={{ overflowX: 'auto' }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default TreeTableArchived;
