import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HouseholdProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/HouseholdProfile';
import Typography from 'antd/lib/typography/Typography';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

const HouseholdProfilePage: React.FC = () => {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [casePlans, setCasePlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        };

        const profileRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/profile`, { headers });
        setProfile(profileRes.data);

        const membersRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/family`, { headers });
        setMembers(membersRes.data);

        const casePlansRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/case-plans`, { headers });
        setCasePlans(casePlansRes.data);

        const servicesRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/services`, { headers });
        setServices(servicesRes.data);

        const referralsRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/referrals`, { headers });
        setReferrals(referralsRes.data);

        const flaggedRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/flagged-records`, { headers });
        setFlaggedRecords(flaggedRes.data);

      } catch (error) {
        console.error('Error fetching caregiver export data:', error);
      }
    };

    fetchData();
  }, []);
    const buildExportPayload = () => ({
    profile,
    family: members,
    casePlans,
    services,
    referrals,
    flaggedRecords,
  });

  const handleExport = async () => {
    if (!profile) {
      alert('Profile data not loaded yet.');
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
    saveAs(content, `${profile.name || 'caregiver_profile'}_export.zip`);
  };

 return (
  <>
    <Typography style={{ fontWeight: 'bold', fontSize: '25px' }}>
      Caregiver Profile{' '}
      <BaseButton onClick={handleExport} type="primary" style={{ marginLeft: 16 }}>
        Export Profile
      </BaseButton>
    </Typography>
    <HouseholdProfile />
  </>
);


export default HouseholdProfilePage;
