import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { StepForm } from '@app/components/forms/StepForm/StepForm';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { Typography } from 'antd';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
}

const AdvancedFormsPage: React.FC = () => {

  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <Typography style={{fontWeight: "bold", fontSize: "30px"}}>  {`${user?.location}`} District</Typography>
      <Typography style={{fontWeight: "bold", fontSize: "30px"}}>Case Management Department</Typography>
      <BaseRow gutter={[30, 30]}>
        <BaseCol xs={24} sm={24} md={24} lg={24} xl={24}>
          <BaseCard id="step-form" title={t('forms.stepForm')} padding="1.25rem">
            <StepForm />
          </BaseCard>
        </BaseCol>
      </BaseRow>
    </>
  );
};

export default AdvancedFormsPage;
