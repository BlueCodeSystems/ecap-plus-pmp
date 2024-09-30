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

interface Step8Props {
  handleChange: (fieldName: string, value: string | number) => void;
}

export const Step8: React.FC<Step8Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  const [likertResponses, setLikertResponses] = useState({
    reportingQ1Response: '',
    reportingQ2Response: '',
    reportingQ2Comment: '',
    reportingQ3Response: '',
    reportingQ3Comment: '',
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
      <Typography style={{ fontWeight: 'bold' }}>Reporting</Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="reportingQ1Response"
        label="1. Do you have a case management reporting system in place?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('reportingQ1Response')}
        />
      </WideFormItem>

      <WideFormItem
        name="reportingQ2Response"
        label="2. Is the Community Caseworker report to the CDA submitted on a monthly basis?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('reportingQ2Response')}
        />
      </WideFormItem>
      <WideFormItem
        name="reportingQ2Comment"
        label="Comments"
      >
        <input
          type="text"
          value={likertResponses.reportingQ2Comment}
          onChange={(e) => handleLikertChange('reportingQ2Comment')({ value: e.target.value })}
        />
      </WideFormItem>

      <WideFormItem
        name="reportingQ3Response"
        label="3. Is the CDA report to the District submitted on a quarterly basis?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('reportingQ3Response')}
        />
      </WideFormItem>
      <WideFormItem
        name="reportingQ3Comment"
        label="Comments"
      >
        <input
          type="text"
          value={likertResponses.reportingQ3Comment}
          onChange={(e) => handleLikertChange('reportingQ3Comment')({ value: e.target.value })}
        />
      </WideFormItem>
    </S.FormContent>
  );
};

export default Step8;
