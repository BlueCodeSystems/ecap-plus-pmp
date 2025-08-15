/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Typography from 'antd/lib/typography/Typography';
import { UserManagementTreeTable } from '@app/components/tables/TreeTable/UserManagementTreeTable';
import { Tabs } from 'antd';

const { TabPane } = Tabs;

const UserManagementPage: React.FC = () => {

  const { t } = useTranslation();


  return (
    <>
      <Typography style={{ fontWeight: "bold", fontSize: "30px" }}> User Management Portal </Typography>
      <UserManagementTreeTable />
    </>
  );
};

export default UserManagementPage;
