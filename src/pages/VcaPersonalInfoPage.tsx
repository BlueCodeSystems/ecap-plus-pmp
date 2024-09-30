import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { VcaPersonalInfo } from '@app/components/profile/profileCard/ProfileInfo/VcaPersonalInfo';

const VcaPersonalInfoPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t('profile.nav.personalInfo.title')}</PageTitle>
      <VcaPersonalInfo />
    </>
  );
};

export default VcaPersonalInfoPage;
