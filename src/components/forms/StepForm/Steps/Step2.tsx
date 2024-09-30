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

interface Step2Props {
  handleChange: (fieldName: string, value: string) => void;
  isChildActIYes: boolean;
  showGbv: boolean;
  showAntHTA: boolean;
  imigratioNAct: boolean;
  marriagEAct: boolean;
  correctionalAct: boolean;
  alCareGuidelinesAct: boolean;
  nlCareFrameworkAct: boolean;
  safeGuardFrameworkAct: boolean;
  childPolicyAct: boolean;
  childFacilitiesGuideAct: boolean;
  childParticipateAct: boolean;
  childMarriageAct: boolean;
  disabilitYAct: boolean;
  agingPolicyAct: boolean;
  foodSecurityAct: boolean;
  liveliHoodGuideAct: boolean;
  nutritionGuideAct: boolean;
  socialCashGuideAct: boolean;
  pWASGuidelinesAct: boolean;
}

export const Step2: React.FC<Step2Props> = ({ handleChange,
  isChildActIYes,
  showGbv,
  showAntHTA,
  imigratioNAct,
  marriagEAct,
  correctionalAct,
  alCareGuidelinesAct,
  nlCareFrameworkAct,
  safeGuardFrameworkAct,
  childPolicyAct,
  childFacilitiesGuideAct,
  childParticipateAct,
  childMarriageAct,
  disabilitYAct,
  agingPolicyAct,
  foodSecurityAct,
  liveliHoodGuideAct,
  nutritionGuideAct,
  socialCashGuideAct,
  pWASGuidelinesAct, }) => {
  const { t } = useTranslation();

  // State to store likert scale responses
  const [likertResponses, setLikertResponses] = useState({
    childActIResponse: '',
    childActIIResponse: '',
    childActIIIResponse: ''
  });

  const standardBasedLikertScaleOptions = [
    { value: 100, text: t('Yes') },
    { value: 0, text: t('No') },
  ];

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
        Standard 1. Legislation and
        <br />Guidelines relating to VCAs adhered to
      </Typography> <Typography style={{ fontWeight: "bold" }}>
        Assessment Question (based on Standards)
      </Typography>
      <br />
      <Typography>
        <b>Preliminary Response(Self Assessment)</b>
      </Typography>
      <WideFormItem
        name="childActIResponse"
        label="1. Does your Office have Children's Code Act No. 12 of 2022?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('childActIResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {isChildActIYes && (
        <>
          <WideFormItem
            name="childActIIResponse"
            label="1.a Have you been oriented on the Children's Code Act No. 12 of 2022?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childActIIResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="childActIIIResponse"
            label="1.b Have you read and understood the Children's Code Act No. 12 of 2022?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childActIIIResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="gBVActIResponse"
        label="2. Does your office have the Anti-GBV Act?"
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('gBVActIResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {showGbv && (
        <>
          <WideFormItem
            name="gBVActIIResponse"
            label="2.a Have you been oriented on the Anti-GBV Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('gBVActIIResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="gbVActIIIResponse"
            label="2.b Have you read and understood the Anti-GBV Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('gbVActIIIResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="antHTActIResponse"
        label="3. Does your office have the Anti-Human Trafficking Act?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('antHTActIResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {showAntHTA && (
        <>
          <WideFormItem
            name="antHTActIIResponse"
            label="3.a Have you been oriented on the Anti- Human Trafficking Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('antHTActIIResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="antHTActIIIResponse"
            label="3.b Have you read and understood the Anti- Human Trafficking Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('antHTActIIIResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="imigrationActResponse"
        label="4. Does your office have the Imigration and Deportation Act?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('imigrationActResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {imigratioNAct && (
        <>
          <WideFormItem
            name="imigrationActOrientedResponse"
            label="4.a Have you been oriented on the Imigration and Deportation Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('imigrationActOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readImigrationResponse"
            label="2.b Have you read and understood the Imigration and Deportation Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readImigrationResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="marriageActResponse"
        label="5. Does your office have the Marriage Act?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('marriageActResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {marriagEAct && (
        <>
          <WideFormItem
            name="marriageActOrientedResponse"
            label="5.a Have you been oriented on the Marriage Act?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('marriageActOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readMarriageActResponse"
            label="5.b "
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readMarriageActResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="correctionalServiceActResponse"
        label="6. Does your office have the Zambia Correctional Service Act No. 37 of 2021?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('correctionalServiceActResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {correctionalAct && (
        <>
          <WideFormItem
            name="correctionalServiceActOrientedResponse"
            label="6.a Have you been oriented on the Zambia Correctional Service Act No. 37 of 2021?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('correctionalServiceActOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readCorrectionalServiceActResponse"
            label="6.b Have you read and understood the Zambia Correctional Service Act No. 37 of 2021?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readCorrectionalServiceActResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="alGuidelinesResponse"
        label="7. Does your Office have the Alternative Care Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('alGuidelinesResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {alCareGuidelinesAct && (
        <>
          <WideFormItem
            name=""
            label="7.a 'Have you been oriented on the Alternative Care Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('')}
            />
          </WideFormItem>
          <WideFormItem
            name="readAlGuidelinesResponse"
            label="7.b Have you read and understood the Alternative Care Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readAlGuidelinesResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="nlCareFrameworkResponse"
        label="8. Does your office have the National Alternative Care Framework?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('nlCareFrameworkResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {nlCareFrameworkAct && (
        <>
          <WideFormItem
            name="nlCareFrameworkOrientedResponse"
            label="2.a Have you been oriented on the National Alternative Care Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('nlCareFrameworkOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readNlCareFrameworkResponse"
            label="8.b Have you read and understood the National Alternative Care Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readNlCareFrameworkResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="safeGuardFrameworkResponse"
        label="9. Does your Office have the Child Safeguarding Framework?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('safeGuardFrameworkResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {safeGuardFrameworkAct && (
        <>
          <WideFormItem
            name="safeGuardFrameworkOrientedResponse"
            label="9.a Have you been oriented on the Child Safeguarding Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('safeGuardFrameworkOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readSafeGuardFrameworkResponse"
            label="9.b Have you read and understood the Child Safeguarding Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readSafeGuardFrameworkResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="childPolicyResponse"
        label="10. Does your office have the Child Safeguarding Policy?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('childPolicyResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {childPolicyAct && (
        <>
          <WideFormItem
            name="childPolicyOrientedResponse"
            label="10.a Have you been oriented on the Child Safeguarding Policy?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childPolicyOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readChildPolicyResponse"
            label="10.b Have you read and understood the Child Safeguarding Policy?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readChildPolicyResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="signedChildPolicyIResponse"
            label="10.c Have you signed the Child Safeguarding Code of conduct?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('signedChildPolicyIResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="childFacilityGuideResponse"
        label="11. Does your Office have Minimum Standard for Child Care Facilities Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('childFacilityGuideResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {childFacilitiesGuideAct && (
        <>
          <WideFormItem
            name="childFacilityGuideOrientedResponse"
            label="11.a Have you read or been oriented and understood the Minimum Standard for Child Care Facilities Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childFacilityGuideOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readChildFacilityGuideResponse"
            label="11.b Have you read and understood the Minimum Standard for Child Care Facilities Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readChildFacilityGuideResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="childParticipateResponse"
        label="12. Does your Office have Child Participation Framework?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('childParticipateResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {childParticipateAct && (
        <>
          <WideFormItem
            name="childParticipateOrientedResponse"
            label="12.a Have you read or been oriented and understood the Child Participation Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childParticipateOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readChildParticipateResponse"
            label="12.b Have you read and understood the Child Participation Framework?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readChildParticipateResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="childMarriageResponse"
        label="13. Does your Office have Ending Child Marriage Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('childMarriageResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {childMarriageAct && (
        <>
          <WideFormItem
            name="childMarriageOrientedResponse"
            label="13.a Have you read or been oriented and understood the Ending Child Marriage Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('childMarriageOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readChildMarriageResponse"
            label="13.b Does your Office have Persons with Disabilities Act No 6 of 2021?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readChildMarriageResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="disabilityActResponse"
        label="14. Does your Office have Persons with Disabilities Act No 6 of 2021?"
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('disabilityActResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {disabilitYAct && (
        <>
          <WideFormItem
            name="disabilityActOrientedResponse"
            label="14.a Have you been oriented the Persons with Disabilities Act No 6 of 2021?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('disabilityActOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readDisabilityActResponse"
            label="14.b Have you read and understood the Persons with Disabilities Act No 6 of 2021?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readDisabilityActResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="agingPolicyResponse"
        label="15. Does your office have the Aging Policy?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('agingPolicyResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {agingPolicyAct && (
        <>
          <WideFormItem
            name="agingPolicyOrientedResponse"
            label="15.a Have you been oriented on the Aging Policy?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('agingPolicyOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readAgingPolicyResponse"
            label="15.b Have you read and understood the Aging Policy?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readAgingPolicyResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="foodSecurityResponse"
        label="16. Does your Office have Food Security Pack Guidelines of 2019?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('foodSecurityResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {foodSecurityAct && (
        <>
          <WideFormItem
            name="foodSecurityOrientedResponse"
            label="16.a Have you been oriented on the Food Security Pack Guidelines of 2019?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('foodSecurityOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readFoodSecurityResponse"
            label="16.b Have you read and understood the Food Security Pack Guidelines of 2019?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readFoodSecurityResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="liveliHoodGuideResponse"
        label="17. Does your Office have Livelihood and Empowerment Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('liveliHoodGuideResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {liveliHoodGuideAct && (
        <>
          <WideFormItem
            name="liveliHoodGuideOrientedResponse"
            label="17.a Have you been oriented on the Livelihood and Empowerment Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('liveliHoodGuideOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readLiHoodGuideResponse"
            label="17.b Have you read and understood the Livelihood and Empowerment Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readLiHoodGuideResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="nutritionGuideResponse"
        label="18. Does your Office have Nutrition Sensitive Social Protection Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('nutritionGuideResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {nutritionGuideAct && (
        <>
          <WideFormItem
            name="nutritionGuideOrientedResponse"
            label="18.a Have you been oriented the Nutrition Sensitive Social Protection Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('nutritionGuideOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readNutritionGuideResponse"
            label="18.b Have you read and understood the Nutrition Sensitive Social Protection Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readNutritionGuideResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="socialCashGuideResponse"
        label="19. Does your Office have Social Cash Transfer Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('socialCashGuideResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {socialCashGuideAct && (
        <>
          <WideFormItem
            name="socialCashGuideOrientedResponse"
            label="19.a Have you been oriented the Social Cash Transfer Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('socialCashGuideOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readSocialCashGuideResponse"
            label="19.b Have you read and understood the Social Cash Transfer Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readSocialCashGuideResponse')}
            />
          </WideFormItem>
        </>
      )}

      <WideFormItem
        name="pWASGuidelinesResponse"
        label="20. Does your Office have PWAS Guidelines?"
       
      >
        <WideLikert
          responses={standardBasedLikertScaleOptions}
          onChange={handleLikertChange('pWASGuidelinesResponse')}
        />
        <SourceAndIndicatorsContainer>
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <Typography style={{ fontWeight: "bold" }}>Source Of Information/Means of Verification</Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <SourceIndicatorsItem>
                <SaveOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
                Check filed or saved copy
              </SourceIndicatorsItem>
            </div>
          </div>

          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
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
      {pWASGuidelinesAct && (
        <>
          <WideFormItem
            name="pWASGuidelinesOrientedResponse"
            label="20.a Have you been oriented PWAS Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('pWASGuidelinesOrientedResponse')}
            />
          </WideFormItem>
          <WideFormItem
            name="readPWASGuidelinesResponse"
            label="20.b Have you read and understood PWAS Guidelines?"
           
          >
            <WideLikert
              responses={likertScaleOptions}
              onChange={handleLikertChange('readPWASGuidelinesResponse')}
            />
          </WideFormItem>
        </>
      )}
    </S.FormContent>
  );
};