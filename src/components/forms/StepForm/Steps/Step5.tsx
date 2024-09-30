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

interface Step5Props {
  handleChange: (fieldName: string, value: string | number) => void;
}

export const Step5: React.FC<Step5Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  const [likertResponses, setLikertResponses] = useState({
    supervisionMentorshipQ1iResponse: '',
    supervisionMentorshipQ1iComment: '',
    supervisionMentorshipQ1iiResponse: '',
    supervisionMentorshipQ1iiComment: '',
    supervisionMentorshipQ1iiiResponse: '',
    supervisionMentorshipQ1iiiComment: '',
    supervisionMentorshipQ1ivResponse: '',
    supervisionMentorshipQ1ivComment: '',
    supervisionMentorshipQ2iResponse: '',
    supervisionMentorshipQ2iComment: '',
    supervisionMentorshipQ2iiResponse: '',
    supervisionMentorshipQ2iiComment: '',
    supervisionMentorshipQ2iiiResponse: '',
    supervisionMentorshipQ2iiiComment: '',
    supervisionMentorshipQ2ivResponse: '',
    supervisionMentorshipQ2ivComment: '',
    supervisionMentorshipQ2vResponse: '',
    supervisionMentorshipQ2vComment: '',
    supervisionMentorshipQ2viResponse: '',
    supervisionMentorshipQ2viComment: '',
    supervisionMentorshipQ2viiResponse: '',
    supervisionMentorshipQ2viiComment: '',
    supervisionMentorshipQ2viiiResponse: '',
    supervisionMentorshipQ2viiiComment: '',
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
      <Typography style={{ fontWeight: 'bold' }}>Supervision and Mentorship</Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="supervisionMentorshipQ1iResponse"
        label="1.i. Have you been supervising and mentoring CDAs using the standardized supervision and mentorship tool?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ1iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ1iiResponse"
        label="1.ii. Do you follow case management supervision & mentorship Plan?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ1iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ1iiiResponse"
        label="1.iii. Have CDAs been supervising and mentoring CWACs using the standardized supervision and mentorship tool?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ1iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ1ivResponse"
        label="1.iv. Do they follow a case management supervision & mentorship Plan?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ1ivResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2iResponse"
        label="2.i. Do you have a workplan and budget for statutory case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2iiResponse"
        label="2.ii. Was the budget approved for statutory case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2iiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2iiiResponse"
        label="2.iii. Were resources disbursed as planned and budgeted for statutory case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2ivResponse"
        label="2.iv. Do you have a workplan and budget for community case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2ivResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2vResponse"
        label="2.v. Was the budget approved for community case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2vResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2viResponse"
        label="2.vi. Were resources disbursed as planned and budgeted for community case management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2viResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2viiResponse"
        label="2.vii. Do your CDAs have access to materials for implementation of case management? (e.g., Tablet, Data Bundles, etc.)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2viiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="supervisionMentorshipQ2viiiResponse"
        label="2.viii. Do your CWACs have access to materials for implementation of case management? (e.g., CM-Forms, ID, etc.)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('supervisionMentorshipQ2viiiResponse')}
        />
      </WideFormItem>
    </S.FormContent>
  );
};

export default Step5;
