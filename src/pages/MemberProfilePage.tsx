import React from 'react';
import { MemberProfile } from '@app/components/profile/profileCard/profileFormNav/nav/PersonalInfo/MemberProfile';
import Typography from 'antd/lib/typography/Typography';

const MemberProfilePage: React.FC = () => {

  return (
    <>
   <Typography style={{ fontWeight: "bold", fontSize: "25px" }}>Household Member Profile</Typography>
     <MemberProfile />
    </>
  );
};

export default MemberProfilePage;
