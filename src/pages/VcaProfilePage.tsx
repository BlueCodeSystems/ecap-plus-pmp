/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Typography from 'antd/lib/typography/Typography';
import { VcaProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/VcaProfile';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { message } from 'antd';

const VcaProfilePage: React.FC = () => {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
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
          casePlansRes,
          servicesRes,
          referralsRes,
          flaggedRes
        ] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BASE_URL}/vca/profile`, { headers }).catch(() => ({ data: null })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/vca/case-plans`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/vca/services`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/vca/referrals`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_BASE_URL}/vca/flagged-records`, { headers }).catch(() => ({ data: [] }))
        ]);

        const normalize = (res: any) => (res == null ? null : res.data?.data ?? res.data ?? null);

        setProfile(normalize(profileRes));
        setCasePlans(normalize(casePlansRes) ?? []);
        setServices(normalize(servicesRes) ?? []);
        setReferrals(normalize(referralsRes) ?? []);
        setFlaggedRecords(normalize(flaggedRes) ?? []);
      } catch (err) {
        console.error('Error fetching VCA export data:', err);
        message.error(t('Error fetching VCA profile data'));
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [t]);

  const buildExportPayload = () => ({
    profile,
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
    message.loading({ content: t('Preparing export…'), key: 'vca_export' });

    try {
      const zip = new JSZip();
      const payload = buildExportPayload();

      zip.file('profile.json', JSON.stringify(payload.profile, null, 2));
      zip.file('casePlans.json', JSON.stringify(payload.casePlans, null, 2));
      zip.file('services.json', JSON.stringify(payload.services, null, 2));
      zip.file('referrals.json', JSON.stringify(payload.referrals, null, 2));
      zip.file('flaggedRecords.json', JSON.stringify(payload.flaggedRecords, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });

      // Safe filename
      const nameFromProfile =
        profile?.name ||
        profile?.fullname ||
        profile?.uid ||
        profile?.unique_id ||
        profile?.id ||
        'vca_profile';
      const safeName = String(nameFromProfile).replace(/[^\w\-]+/g, '_').slice(0, 120);
      const fileName = `${safeName}_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`;

      saveAs(content, fileName);

      message.success({ content: t('Export completed'), key: 'vca_export', duration: 2 });
    } catch (err) {
      console.error('Error exporting VCA profile', err);
      message.error({ content: t('Export failed'), key: 'vca_export', duration: 4 });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Typography style={{ fontWeight: 'bold', fontSize: '25px', display: 'flex', alignItems: 'center' }}>
        {t('VCA Profile')}{' '}
        <BaseButton
          onClick={handleExport}
          type="primary"
          style={{ marginLeft: 16 }}
          disabled={exporting || loadingData || !profile}
        >
          {exporting ? t('Exporting…') : t('Export Profile')}
        </BaseButton>
      </Typography>

      <VcaProfile />
    </>
  );
};

export default VcaProfilePage;
