/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton, Tag, Typography } from 'antd';
import axios from 'axios';
import TreeTableArchived from '@app/components/tables/TreeTable/TreeTableArchived';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const VcasArchivedRegisterPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [vcaProfile, setVcaProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);

 useEffect(() => {
  const fetchUserData = async () => {
    try {
      setLoadingUserData(true);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulated delay

      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const userResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, { headers });
      setUser(userResponse.data.data);

      // Fetch archived VCA profile & related data (update endpoints accordingly)
      const vcaRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca-archived/profile`, { headers });
      const servicesRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca-archived/services`, { headers });
      const referralsRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca-archived/referrals`, { headers });
      const flaggedRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca-archived/flagged`, { headers });

      setVcaProfile(vcaRes.data);
      setServices(servicesRes.data);
      setReferrals(referralsRes.data);
      setFlaggedRecords(flaggedRes.data);

    } catch (error) {
      console.error('Error fetching VCA data:', error);
    } finally {
      setLoadingUserData(false);
      setLoadingTable(false);
    }
  };

  fetchUserData();
}, []);
 
const buildExportPayload = () => ({
  profile: vcaProfile,
  services,
  referrals,
  flagged: flaggedRecords,
});

  const handleExport = async () => {
  const payload = buildExportPayload();
  const zip = new JSZip();

  zip.file('profile.json', JSON.stringify(payload.profile, null, 2));
  zip.file('services.json', JSON.stringify(payload.services, null, 2));
  zip.file('referrals.json', JSON.stringify(payload.referrals, null, 2));
  zip.file('flaggedRecords.json', JSON.stringify(payload.flagged, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${payload.profile?.name || 'archived_vca_profile'}_export.zip`);
};

const content = (
  <>
    <Typography.Title level={4}>
      {loadingUserData ? <Skeleton.Input active size="small" /> : `${user?.location || ''} District VCAs Archived Register`}
    </Typography.Title>

    <Tag color="volcano">
      Note: Only deregistered VCAs are shown.
    </Tag>

    <br />
    <br />


    <br />
    <br />
  </>
);

  return (
    <>
      {content}
      {loadingTable ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <TreeTableArchived/>
      )}
    </>
  );
};

export default VcasArchivedRegisterPage;