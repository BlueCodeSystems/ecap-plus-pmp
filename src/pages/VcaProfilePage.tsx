import React from 'react';
import { useTranslation } from 'react-i18next';
import { VcaProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/VcaProfile';
import Typography from 'antd/lib/typography/Typography';

const VcaProfilePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
   <Typography style={{ fontWeight: "bold", fontSize: "25px" }}>VCA Profile</Typography>
     <VcaProfile />
    </>
  );
};

export default VcaProfilePage;
