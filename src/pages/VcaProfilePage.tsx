import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Typography from 'antd/lib/typography/Typography';
import { VcaProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/VcaProfile';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

const [profile, setProfile] = useState<any>(null);
const [casePlans, setCasePlans] = useState<any[]>([]);
const [services, setServices] = useState<any[]>([]);
const [referrals, setReferrals] = useState<any[]>([]);
const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);

const VcaProfilePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
   <Typography style={{ fontWeight: "bold", fontSize: "25px" }}>Caregiver Profile</Typography>
      <HouseholdProfile />
    </>
  );
};

useEffect(() => {
  const fetchData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      };

      const profileRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca/profile`, { headers });
      setProfile(profileRes.data);

      const casePlanRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca/case-plans`, { headers });
      setCasePlans(casePlanRes.data);

      const servicesRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca/services`, { headers });
      setServices(servicesRes.data);

      const referralsRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca/referrals`, { headers });
      setReferrals(referralsRes.data);

      const flaggedRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/vca/flagged-records`, { headers });
      setFlaggedRecords(flaggedRes.data);

    } catch (err) {
      console.error('Error fetching export data:', err);
    }
  };

  fetchData();
}, []);
const buildExportPayload = () => ({
  profile,
  casePlans,
  services,
  referrals,
  flaggedRecords,
});

const handleExport = async () => {
  if (!profile) {
    alert('Profile not loaded yet.');
    return;
  }

  const zip = new JSZip();
  const payload = buildExportPayload();

  zip.file('profile.json', JSON.stringify(payload.profile, null, 2));
  zip.file('casePlans.json', JSON.stringify(payload.casePlans, null, 2));
  zip.file('services.json', JSON.stringify(payload.services, null, 2));
  zip.file('referrals.json', JSON.stringify(payload.referrals, null, 2));
  zip.file('flaggedRecords.json', JSON.stringify(payload.flaggedRecords, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${profile.name || 'vca_profile'}_export.zip`);
};
return (
  <>
    <Typography style={{ fontWeight: 'bold', fontSize: '25px' }}>
      VCA Profile{' '}
      <BaseButton type="primary" onClick={handleExport} style={{ marginLeft: 16 }}>
        Export Profile
      </BaseButton>
    </Typography>
    <VcaProfile />
  </>
);

export default VcaProfilePage;
