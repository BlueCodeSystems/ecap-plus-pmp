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

interface Step7Props {
  handleChange: (fieldName: string, value: string | number) => void;
}

export const Step7: React.FC<Step7Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  const [likertResponses, setLikertResponses] = useState({
    dataManagementQ1iResponse: '',
    dataManagementQ1iiResponse: '',
    dataManagementQ1iiiResponse: '',
    dataManagementQ2iResponse: '',
    dataManagementQ2iiResponse: '',
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
      <Typography style={{ fontWeight: 'bold' }}>Data Management</Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="dataManagementQ1iResponse"
        label="1.i Is there Case Management Information System in place?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('dataManagementQ1iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="dataManagementQ1iiResponse"
        label="1.ii Do you have access to an updated Case Management Information System?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('dataManagementQ1iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="dataManagementQ1iiiResponse"
        label="1.iii Is data from the Case management information system being used for decision making and service provision?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('dataManagementQ1iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="dataManagementQ2iResponse"
        label="2.i Have you been trained in the use of Case Management Information System?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('dataManagementQ2iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="dataManagementQ2iiResponse"
        label="2.ii Are you using the Case management MIS in following a clear implementation strategy (including how to sustain it)?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('dataManagementQ2iiResponse')}
        />
      </WideFormItem>
    </S.FormContent>
  );
};

export default Step7;
