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

interface Step4Props {
  handleChange: (fieldName: string, value: string | number) => void;
}

export const Step4: React.FC<Step4Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  const [likertResponses, setLikertResponses] = useState({
    capacityKnowledgeQ1Response: '',
    capacityKnowledgeQ2iResponse: '',
    capacityKnowledgeQ2iComment: '',
    capacityKnowledgeQ2iiResponse: '',
    capacityKnowledgeQ2iiComment: '',
    capacityKnowledgeQ2iiiResponse: '',
    capacityKnowledgeQ3Response: '',
    capacityKnowledgeQ4Response: '',
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
      <Typography style={{ fontWeight: 'bold' }}>	Standard 1: Case workers, supervisors<br /> and managers are trained in the approved<br /> MCDSS case management guidelines and <br />training materials, at least every three years, by <br />trainers recognized by MCDSS</Typography>
      <Typography style={{ fontWeight: 'bold' }}>Assessment Question (based on Standards)</Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="capacityKnowledgeQ1Response"
        label="1. Have case workers, supervisors and managers been trained in the approved MCDSS guidelines and training materials by a recognized trainer? Probe: When were the case workers last trained?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ1Response')}
        />
      </WideFormItem>

      <WideFormItem
        name="capacityKnowledgeQ2iResponse"
        label="2.i. Do case workers meet the criteria as defined? (i.e trained in child safeguarding & signed Code of conduct)?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ2iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="capacityKnowledgeQ2iiResponse"
        label="2.ii. Are all case workers applying child safeguarding principles (tailored to case management)?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ2iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="capacityKnowledgeQ2iiiResponse"
        label="2.iii. Were all case workers oriented/trained on Child safeguarding?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ2iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="capacityKnowledgeQ3Response"
        label="3. Have all case workers signed the code of conduct commitment form?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ3Response')}
        />
      </WideFormItem>

      <WideFormItem
        name="capacityKnowledgeQ4Response"
        label="4. Are all case workers compliant to child safeguarding principles?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('capacityKnowledgeQ4Response')}
        />
      </WideFormItem>
    </S.FormContent>
  );
};

export default Step4;
