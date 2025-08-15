/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// Update the import path below to the correct relative path for HouseholdProfile
import { HouseholdProfile } from '../components/profile/profileCard/profileFormNav/nav/PersonalInfo/HouseholdProfile';
import Typography from 'antd/lib/typography/Typography';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { message } from 'antd';

const HouseholdProfilePage: React.FC = () => {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [casePlans, setCasePlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        };

        const [
          profileRes,
          membersRes,
          casePlansRes,
          servicesRes,
          referralsRes,
          flaggedRes
        ] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/profile`, { headers }).catch(() => ({ data: null })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/family`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/case-plans`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/services`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/referrals`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/caregiver/flagged-records`, { headers }).catch(() => ({ data: [] })),
        ]);

        // Some endpoints return { data: { data: ... } }, others return data directly.
        const normalise = (res: any) => {
          if (!res) return null;
          return res.data?.data ?? res.data ?? null;
        };

        setProfile(normalise(profileRes));
        setMembers(normalise(membersRes) ?? []);
        setCasePlans(normalise(casePlansRes) ?? []);
        setServices(normalise(servicesRes) ?? []);
        setReferrals(normalise(referralsRes) ?? []);
        setFlaggedRecords(normalise(flaggedRes) ?? []);
      } catch (error) {
        console.error('Error fetching caregiver export data:', error);
        message.error(t('Error fetching profile data'));
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [t]);

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
      message.warning(t('Profile data not loaded yet.'));
      return;
    }

    setExporting(true);
    message.loading({ content: t('Preparing export…'), key: 'export' });

    try {
      const zip = new JSZip();
      const payload = buildExportPayload();

      zip.file('profile.json', JSON.stringify(payload.profile, null, 2));
      zip.file('family.json', JSON.stringify(payload.family, null, 2));
      zip.file('casePlans.json', JSON.stringify(payload.casePlans, null, 2));
      zip.file('services.json', JSON.stringify(payload.services, null, 2));
      zip.file('referrals.json', JSON.stringify(payload.referrals, null, 2));
      zip.file('flaggedRecords.json', JSON.stringify(payload.flaggedRecords, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });

      // build a safe filename
      const nameFromProfile =
        profile?.name ||
        profile?.caregiver_name ||
        profile?.household_name ||
        profile?.household_id ||
        profile?.id ||
        'caregiver_profile';

      const safeName = String(nameFromProfile).replace(/[^\w\-]+/g, '_').slice(0, 120);
      const fileName = `${safeName}_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`;

      saveAs(content, fileName);

      message.success({ content: t('Export completed'), key: 'export', duration: 2 });
    } catch (err) {
      console.error('Export failed', err);
      message.error({ content: t('Export failed'), key: 'export', duration: 4 });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Typography style={{ fontWeight: 'bold', fontSize: '25px', display: 'flex', alignItems: 'center' }}>
        {t('Caregiver Profile')}{' '}
        <BaseButton
          onClick={handleExport}
          type="primary"
          style={{ marginLeft: 16 }}
          disabled={exporting || loadingData || !profile}
        >
          {exporting ? t('Exporting…') : t('Export Profile')}
        </BaseButton>
      </Typography>

      <HouseholdProfile />
    </>
  );
};

export default HouseholdProfilePage;
