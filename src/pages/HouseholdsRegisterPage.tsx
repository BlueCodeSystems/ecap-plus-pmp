/* eslint-disable prettier/prettier */
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EditableTable } from '@app/components/tables/editableTable/EditableTable';
import { Skeleton, Tag, Typography } from 'antd';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const HouseholdsRegisterPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [casePlans, setCasePlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);

const handleExport = async () => {
  if (!profile) {
    alert('Profile data not loaded yet');
    return;
  }

  const zip = new JSZip();
  const payload = buildExportPayload();

  zip.file('profile.json', JSON.stringify(payload.profile, null, 2));
  zip.file('family.json', JSON.stringify(payload.family, null, 2));
  zip.file('casePlans.json', JSON.stringify(payload.casePlans, null, 2));
  zip.file('services.json', JSON.stringify(payload.services, null, 2));
  zip.file('referrals.json', JSON.stringify(payload.referrals, null, 2));
  zip.file('flaggedRecords.json', JSON.stringify(payload.flaggedRecords, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${profile.name || 'profile'}_export.zip`);
};

 useEffect(() => {
  const fetchAllData = async () => {
    try {
      setLoadingUserData(true);

      // 1. Fetch user data
      const userResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setUser(userResponse.data.data);

      // 2. Fetch household profile (adjust URL & response path accordingly)
      const profileResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setProfile(profileResponse.data);

      // 3. Fetch family members
      const familyResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/family`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setMembers(familyResponse.data);

      // 4. Fetch case plans (adjust endpoint)
      const casePlansResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/case-plans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setCasePlans(casePlansResponse.data);

      // 5. Fetch services (adjust endpoint)
      const servicesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/services`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setServices(servicesResponse.data);

      // 6. Fetch referrals (adjust endpoint)
      const referralsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/referrals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setReferrals(referralsResponse.data);

      // 7. Fetch flagged records (adjust endpoint)
      const flaggedResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/household/flagged-records`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setFlaggedRecords(flaggedResponse.data);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoadingUserData(false);
      setLoadingTable(false);
    }
  };

  fetchAllData();
}, []);

  const buildExportPayload = () => ({
  profile,
  family: members,
  casePlans,
  services,
  referrals,
  flaggedRecords,
});

 const content = (
  <Typography.Title level={4}>
    {loadingUserData ? (
      <Skeleton.Input active size="small" />
    ) : (
      `${user?.location || ''} District Households Register`
    )}
  </Typography.Title>
); // properly closed here

  return (
    <>
      {content}
      {loadingTable ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <EditableTable flaggedRecords={flaggedRecords}/>
      )}
    </>
  );
};

export default HouseholdsRegisterPage;
