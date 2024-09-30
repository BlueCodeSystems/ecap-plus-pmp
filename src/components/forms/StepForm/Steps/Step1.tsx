import React from 'react';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import { BaseInput } from '@app/components/common/inputs/BaseInput/BaseInput';
import { BaseDatePicker } from '@app/components/common/pickers/BaseDatePicker'; // Import BaseDatePicker
import styled from 'styled-components';
import * as S from '../StepForm.styles';

const NarrowInput = styled(BaseInput)`
  width: 50%; /* Adjust width as needed */
`;

const NarrowPicker = styled(BaseDatePicker)`
  width: 50%; /* Adjust width as needed */
`;

const NarrowFormItem = styled(BaseForm.Item)`
  width: 50%; /* Adjust width as needed */
`;

interface Step1Props {
  handleChange: (fieldName: string, value: string) => void;
}

export const Step1: React.FC<Step1Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  return (
    <S.FormContent>
      <NarrowFormItem
        name="date_of_assessment"
        label={t('Date of Assessment')}
        rules={[{ required: true, message: t('Date is a required field') }]}
      >
        <NarrowPicker format="YYYY-MM-DD" onChange={(date, dateString) => handleChange('date_of_assessment', dateString)} />
      </NarrowFormItem>
      <NarrowFormItem
        name="list_of_district_participants"
        label={t('List of district officers (Include your role)')}
        rules={[{ required: true, message: t('This is a required field') }]}
      >
        <S.StyledTextArea onChange={(e) => handleChange('list_of_district_participants', e.target.value)} />
      </NarrowFormItem>
      <NarrowFormItem
        name="province"
        label={t('Province')}
        rules={[{ required: true, message: t('Province is a required field') }]}
      >
        <NarrowInput onChange={(e) => handleChange('province', e.target.value)} />
      </NarrowFormItem>
      <NarrowFormItem
        name="district"
        label={t('District')}
        rules={[{ required: true, message: t('District is a required field') }]}
      >
        <NarrowInput onChange={(e) => handleChange('district', e.target.value)} />
      </NarrowFormItem>
    </S.FormContent>
  );
};