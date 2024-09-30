import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import * as S from '../StepForm.styles';
import Likert from 'react-likert-scale';
import styled from 'styled-components';
import { CheckOutlined, SaveOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const WideFormItem = styled(BaseForm.Item)`
  width: 50%;
`;

const WideLikert = styled(Likert)`
  font-size: 14px;
`;

const SourceAndIndicatorsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  margin-right: 5%;
`;

const SourceIndicatorsItem = styled.div`
  margin: 5px;
  padding: 8px;
  max-width: 100%;
`;

interface Step6Props {
  handleChange: (fieldName: string, value: string | number) => void;
}

export const Step6: React.FC<Step6Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  const [likertResponses, setLikertResponses] = useState({
    coordinationReferralQ1iResponse: '',
    coordinationReferralQ1iComment: '',
    coordinationReferralQ1iiResponse: '',
    coordinationReferralQ1iiComment: '',
    coordinationReferralQ2iResponse: '',
    coordinationReferralQ2iComment: '',
    coordinationReferralQ2iiResponse: '',
    coordinationReferralQ2iiComment: '',
    coordinationReferralQ2iiiResponse: '',
    coordinationReferralQ2iiiComment: '',
    coordinationReferralQ2ivResponse: '',
    coordinationReferralQ2ivComment: '',
    coordinationReferralQ2vResponse: '',
    coordinationReferralQ2vComment: '',
    coordinationReferralQ2viResponse: '',
    coordinationReferralQ2viComment: '',
  });

  const likertScaleOptions = [
    { value: 100, text: t('Yes') },
    { value: 75, text: t('To a great extent') },
    { value: 50, text: t('To a good extent') },
    { value: 25, text: t('To some extent') },
    { value: 0, text: t('No') },
    { value: 'N/A', text: t('Not Applicable') },
  ];

  const handleLikertChange = (name: string) => (event: any) => {
    setLikertResponses((prevState) => ({
      ...prevState,
      [name]: event.value,
    }));
    handleChange(name, event.value);
  };

  return (
    <S.FormContent>
      <Typography style={{ fontWeight: 'bold' }}>Domain Area / Functional Area</Typography>
      <Typography style={{ fontWeight: 'bold' }}>Coordination and Referral</Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="coordinationReferralQ1iResponse"
        label="1.i Does your district have a service directory? (Probe: When was it last updated?)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ1iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ1iiResponse"
        label="1.ii Is your district using the service directory for coordination and bi-directional referral? (Probe: used at both district and sub-center level?)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ1iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2iResponse"
        label="2.i Were coordination meetings held by your district? (Probe: Should be held at least once per quarter)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2iiResponse"
        label="2.ii Were case conferences conducted for complex cases?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2iiiResponse"
        label="2.iii Were case reviews/BID panels held jointly with partners including CCFs, relevant institutions and NGO service providers?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2ivResponse"
        label="2.iv Were case conferences conducted by stakeholders successful? (Probe for challenges that were faced, if any)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2ivResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2vResponse"
        label="2.v Is there a selected district-level coordination structure used for implementation of VCA community case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2vResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="coordinationReferralQ2viResponse"
        label="2.vi Is there a district workplan (with clear milestones) for the district-level coordination structure?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('coordinationReferralQ2viResponse')}
        />
      </WideFormItem>
    </S.FormContent>
  );
};

export default Step6;