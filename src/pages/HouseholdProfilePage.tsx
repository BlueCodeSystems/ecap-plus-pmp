import React from 'react';
import { useTranslation } from 'react-i18next';
import { HouseholdProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/HouseholdProfile';
import Typography from 'antd/lib/typography/Typography';

const HouseholdProfilePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
   <Typography style={{ fontWeight: "bold", fontSize: "25px" }}>Caregiver Profile</Typography>
      <HouseholdProfile />
    </>
  );
};

export default HouseholdProfilePage;
