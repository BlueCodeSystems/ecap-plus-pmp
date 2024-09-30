import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { MemberPersonalInfo } from '@app/components/profile/profileCard/ProfileInfo/MemberPersonalInfo';

const MemberPersonalInfoPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t('profile.nav.personalInfo.title')}</PageTitle>
      <MemberPersonalInfo />
    </>
  );
};

export default MemberPersonalInfoPage;
