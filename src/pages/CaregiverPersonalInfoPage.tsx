import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { CaregiverPersonalInfo } from '@app/components/profile/profileCard/ProfileInfo/CaregiverPersonalInfo';

const CaregiverPersonalInfoPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t('profile.nav.personalInfo.title')}</PageTitle>
      <CaregiverPersonalInfo />
    </>
  );
};

export default CaregiverPersonalInfoPage;
