import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import * as S from '../StepForm.styles';
import Likert from 'react-likert-scale';
import styled from 'styled-components';
import { CheckOutlined, SaveOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const WideFormItem = styled(BaseForm.Item)`
  width: 50%; /* Increase width to fill the container */
`;

const WideLikert = styled(Likert)`
  font-size: 14px; /* Adjust font size as needed */
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

interface Step3Props {
  handleChange: (fieldName: string, value: string) => void;
}

export const Step3: React.FC<Step3Props> = ({ handleChange }) => {
  const { t } = useTranslation();

  // State to store likert scale responses
  const [likertResponses, setLikertResponses] = useState({
    practiceProcessesQ1aResponse: '',
    practiceProcessesQ1bResponse: '',
    practiceProcessesQ2iResponse: '',
    practiceProcessesQ2iiResponse: '',
    practiceProcessesQ2iiiResponse: '',
    practiceProcessesQ2ivResponse: '',
    practiceProcessesQ2vResponse: '',
    practiceProcessesQ2viResponse: '',
    practiceProcessesQ2viiResponse: '',
    practiceProcessesQ3aResponse: '',
    practiceProcessesQ3bResponse: '',
    practiceProcessesQ3cResponse: '',
    practiceProcessesQ4Response: '',
    practiceProcessesQ5Response: ''
  });

  const likertScaleOptions = [
    { value: 100, text: t('Yes') },
    { value: 75, text: t('To a great extent') },
    { value: 50, text: t('To a good extent') },
    { value: 25, text: t('To some extent') },
    { value: 0, text: t('No') },
    { value: "N/A", text: t('Not Applicable') },
  ];

  const handleLikertChange = (name: string) => (event: any) => {
    // Update likert scale response state
    setLikertResponses(prevState => ({
      ...prevState,
      [name]: event.value
    }));
    // Pass the likert scale response to the parent component
    handleChange(name, event.value);
  };

  return (
    <S.FormContent>
      <Typography style={{ fontWeight: "bold" }}>
        Domain Area / Functional Area
      </Typography>
      <Typography style={{ fontWeight: "bold" }}>
      Standard 2: Guiding principles are implemented as<br />outlined in the community case management guidelines
      </Typography> 
      <Typography style={{ fontWeight: "bold" }}>
        Assessment Question (based on Standards)
      </Typography>
      <br />
      <Typography>
        <b>Preliminary Response (Self Assessment)</b>
      </Typography>

      <WideFormItem
        name="practiceProcessesQ1aResponse"
        label="1.a. Do you review all the consent/ascent forms on file duly signed?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ1aResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}>
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>
          <div style={{ width: '50%' }}>
            <Typography style={{ fontWeight: "bold" }}>Indicators</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <CheckOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Physical copy of the Act or soft copy of the Act
              </SourceIndicatorsItem>
            </div>
          </div>
        </SourceAndIndicatorsContainer>
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ1bResponse"
        label="1.b. Have you ascertained to ensure that case workers conform with case management guidelines and principles?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ1bResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2iResponse"
        label="2.i. Do you have individual files for; Children CCF, Children in conflict with the law, adoption, foster care, migrant, circumstantial, VAC and GBV?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2iResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2iiResponse"
        label="2.ii. Do you review case management forms to check whether case workers are using upto date forms?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2iiResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}>
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>
          <div style={{ width: '50%' }}>
            <Typography style={{ fontWeight: "bold" }}>Indicators</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <CheckOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Physical copy of the Act or soft copy of the Act
              </SourceIndicatorsItem>
            </div>
          </div>
        </SourceAndIndicatorsContainer>
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2iiiResponse"
        label="2.iii. Do you review case management forms to check for completeness, timeliness, Consistency and accuracy of information filled in forms?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2iiiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2ivResponse"
        label="2.iv. Do you review the identification and assessment form to ensure that the forms are completed in discussion with the client?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2ivResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2vResponse"
        label="2.v. Do you review Case plans to ensure they are developed jointly with child and caregiver (where possible and appropriate)?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2vResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2viResponse"
        label="2.vi. Do you review the case follow-up to check VCA access to services and progress status for clients receiving services?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2viResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ2viiResponse"
        label="2.vii. Are cases closed based on case closure criteria as outlined in Form 4?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ2viiResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ3aResponse"
        label="3.a. Do you check whether case classification is applied as outlined in the CCM guidelines and SOPs for identification & assessment consistently?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ3aResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ3bResponse"
        label="3.b. Were there high risk cases escalated to the district in the quarter? (Probe: How many?)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ3bResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ3cResponse"
        label="3.c. Were any statutory cases referred to the community for Community Case Management?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ3cResponse')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ4Response"
        label="4. Were cases identified and addressed through case management process? (Probe: How many?)"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ4Response')}
        />
      </WideFormItem>

      <WideFormItem
        name="practiceProcessesQ5Response"
        label="5. Are the cases handled in the stipulated timeline?"
      >
        <WideLikert
          responses={likertScaleOptions}
          onChange={handleLikertChange('practiceProcessesQ5Response')}
        />
      </WideFormItem>

    </S.FormContent>
  );
};
