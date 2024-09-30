import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { notificationController } from '@app/controllers/notificationController';
import { Steps } from './StepForm.styles';
import { Step1 } from './Steps/Step1';
import { Step2 } from './Steps/Step2';
import { Step3 } from './Steps/Step3';
import { Step4 } from './Steps/Step4';
import { Step5 } from './Steps/Step5';
import { Step6 } from './Steps/Step6';
import { Step7 } from './Steps/Step7';
import { Step8 } from './Steps/Step8';
import { Step9 } from './Steps/Step9';

const apiUrl = `${process.env.REACT_APP_BASE_URL}/items`;
const collectionName = 'case_management';

export const StoresStepForm = () => {

  const [current, setCurrent] = useState(0);
  const [form] = BaseForm.useForm();

  const [fields, setFields] = useState([

    { name: 'date_of_assessment', value: '' },
    { name: 'list_of_district_participants', value: '' },
    { name: 'province', value: '' },
    { name: 'district', value: '' },

    //Guidelines start 
    { name: 'childActI', value: 'Does your Office have Children`s Code Act No. 12 of 2022?' },
    { name: 'childActIResponse', value: '' },
    { name: 'childActII', value: 'Have you been oriented on the Children`s Code Act No. 12 0f 2022?' },
    { name: 'childActIIResponse', value: '' },
    { name: 'childActIII', value: 'Have you read and understood the Children`s Code Act No.12 of 2022?' },
    { name: 'childActIIIResponse', value: '' },

    { name: 'gBVActI', value: 'Does your office have the Anti-GBV Act?' },
    { name: 'gBVActIResponse', value: '' },
    { name: 'gBVActII', value: 'Have you been oriented on the Anti-GBV Act?' },
    { name: 'gBVActIIResponse', value: '' },
    { name: 'gBVActIII', value: 'Have you read and understood the AntiG-BV Act?' },
    { name: 'gbVActIIIResponse', value: '' },

    { name: 'antHTActI', value: 'Does your office have the Anti-Human Trafficking Act?' },
    { name: 'antHTActIResponse', value: '' },
    { name: 'antHTActII', value: 'Have you been oriented on the Anti- Human Trafficking Act?' },
    { name: 'antHTActIIResponse', value: '' },
    { name: 'antHTActIII:', value: 'Have you read and understood the Anti- Human Trafficking Act?' },
    { name: 'antHTActIIIResponse', value: '' },

    { name: 'imigrationAct', value: 'Does your office have the Imigration and Deportation Act?' },
    { name: 'imigrationActResponse', value: '' },
    { name: 'imigrationActOriented', value: 'Have you been oriented on the Imigration and Deportation Act?' },
    { name: 'imigrationActOrientedResponse', value: '' },
    { name: 'readImigrationAct', value: 'Have you read and understood the Imigration and Deportation Act?' },
    { name: 'readImigrationResponse', value: '' },

    { name: 'marriageAct', value: 'Does your office have the Marriage Act?' },
    { name: 'marriageActResponse', value: '' },
    { name: 'marriageActOriented', value: 'Have you been oriented on the Marriage Act?' },
    { name: 'marriageActOrientedResponse', value: '' },
    { name: 'readMarriageAct', value: 'Have you read and understood the Marriage Act?' },
    { name: 'readMarriageActResponse', value: '' },

    { name: 'correctionalServiceAct', value: 'Does your office have the Zambia Correctional Service Act No. 37 of 2021?' },
    { name: 'correctionalServiceActResponse', value: '' },
    { name: 'correctionalServiceActOriented', value: 'Have you been oriented on the Zambia Correctional Service Act No. 37 of 2021?' },
    { name: 'correctionalServiceActOrientedResponse', value: '' },
    { name: 'readCorrectionalServiceAct', value: 'Have you read and understood the Zambia Correctional Service Act No. 37 of 2021?' },
    { name: 'readCorrectionalServiceActResponse', value: '' },

    { name: 'alCareGuidelines', value: 'Does your Office have the Alternative Care Guidelines?' },
    { name: 'alGuidelinesResponse', value: '' },
    { name: 'alCareGuidelinesOriented', value: 'Have you been oriented on the Alternative Care Guidelines?' },
    { name: 'alGuidelinesOrientedResponse', value: '' },
    { name: 'readAlCareGuidelines', value: 'Have you read and understood the Alternative Care Guidelines?' },
    { name: 'readAlGuidelinesResponse', value: '' },

    { name: 'nlCareFramework', value: 'Does your office have the National Alternative Care Framework?' },
    { name: 'nlCareFrameworkResponse', value: '' },
    { name: 'nlCareFrameworkOriented', value: 'Have you been oriented on the National Alternative Care Framework?' },
    { name: 'nlCareFrameworkOrientedResponse', value: '' },
    { name: 'readNlCareFramework', value: 'Have you read and understood the National Alternative Care Framework?' },
    { name: 'readNlCareFrameworkResponse', value: '' },

    { name: 'safeGuardFramework', value: 'Does your Office have the Child Safeguarding Framework?' },
    { name: 'safeGuardFrameworkResponse', value: '' },
    { name: 'safeGuardFrameworkOriented', value: 'Have you been oriented on the Child Safeguarding Framework?' },
    { name: 'safeGuardFrameworkOrientedResponse', value: '' },
    { name: 'readSafeGuardFramework', value: 'Have you read and understood the Child Safeguarding Framework?' },
    { name: 'readSafeGuardFrameworkResponse', value: '' },

    { name: 'childPolicy', value: 'Does your office have the Child Safeguarding Policy?' },
    { name: 'childPolicyResponse', value: '' },
    { name: 'childPolicyOriented', value: 'Have you been oriented on the Child Safeguarding Policy?' },
    { name: 'childPolicyOrientedResponse', value: '' },
    { name: 'readChildPolicy', value: 'Have you read and understood the Child Safeguarding Policy?' },
    { name: 'readChildPolicyResponse', value: '' },
    { name: 'signedChildPolicyI', value: 'Have you signed the Child Safeguarding Code of conduct?' },
    { name: 'signedChildPolicyIResponse', value: '' },

    { name: 'childFacilitiesGuide', value: 'Does your Office have Minimum Standard for Child Care Facilities Guidelines?' },
    { name: 'childFacilityGuideResponse', value: '' },
    { name: 'childFacilityGuideOriented', value: 'Have you read or been oriented and understand the Minimum Standard for Child Care Facilities Guidelines?' },
    { name: 'childFacilityGuideOrientedResponse', value: '' },
    { name: 'readChildFacilityGuide', value: 'Have you read and understood the Minimum Standard for Child Care Facilities Guidelines?' },
    { name: 'readChildFacilityGuideResponse', value: '' },

    { name: 'childParticipate', value: 'Does your Office have Child Participation Framework?' },
    { name: 'childParticipateResponse', value: '' },
    { name: 'childParticipateOriented', value: 'Have you read or been oriented and understood the Child Participation Framework?' },
    { name: 'childParticipateOrientedResponse', value: '' },
    { name: 'readChildParticipate', value: 'Have you read and understood the Child Participation Framework?' },
    { name: 'readChildParticipateResponse', value: '' },

    { name: 'childMarriage', value: 'Does your Office have Ending Child Marriage Guidelines?' },
    { name: 'childMarriageResponse', value: '' },
    { name: 'childMarriageOriented', value: 'Have you read or been oriented and understood the Ending Child Marriage Guidelines?' },
    { name: 'childMarriageOrientedResponse', value: '' },
    { name: 'readChildMarriage', value: 'Does your Office have Persons with Disabilities Act No 6 of 2021' },
    { name: 'readChildMarriageResponse', value: '' },

    { name: 'disabilityAct', value: 'Does your Office have Persons with Disabilities Act No 6 of 2021' },
    { name: 'disabilityActResponse', value: '' },
    { name: 'disabilityActOriented', value: 'Have you been oriented the Persons with Disabilities Act No 6 of 2021' },
    { name: 'disabilityActOrientedResponse', value: '' },
    { name: 'readDisabilityAct', value: 'Have you read and understood the Persons with Disabilities Act No 6 of 2021' },
    { name: 'readDisabilityActResponse', value: '' },

    { name: 'agingPolicy', value: 'Does your office have the Aging Policy?' },
    { name: 'agingPolicyResponse', value: '' },
    { name: 'agingPolicyOriented', value: 'Have you been oriented on the Aging Policy?' },
    { name: 'agingPolicyOrientedResponse', value: '' },
    { name: 'readAgingPolicy', value: 'Have you read and understood the Aging Policy?' },
    { name: 'readAgingPolicyResponse', value: '' },

    { name: 'foodSecurity', value: 'Does your Office have Food Security Pack Guidelines of 2019?' },
    { name: 'foodSecurityResponse', value: '' },
    { name: 'foodSecurityOriented', value: 'Have you been oriented on the Food Security Pack Guidelines of 2019?' },
    { name: 'foodSecurityOrientedResponse', value: '' },
    { name: 'readFoodSecurity', value: 'Have you read and understood the Food Security Pack Guidelines of 2019?' },
    { name: 'readFoodSecurityResponse', value: '' },

    { name: 'liveliHoodGuide', value: 'Does your Office have Livelihood and Empowerment Guidelines?' },
    { name: 'liveliHoodGuideResponse', value: '' },
    { name: 'liveliHoodGuideOriented', value: 'Have you been oriented on the Livelihood and Empowerment Guidelines?' },
    { name: 'liveliHoodGuideOrientedResponse', value: '' },
    { name: 'readLiveliHoodGuide', value: 'Have you read and understood the Livelihood and Empowerment Guidelines?' },
    { name: 'readLiHoodGuideResponse', value: '' },

    { name: 'nutritionGuide', value: 'Does your Office have Nutrition Sensitive Social Protection Guidelines?' },
    { name: 'nutritionGuideResponse', value: '' },
    { name: 'nutritionGuideOriented', value: 'Have you been oriented the Nutrition Sensitive Social Protection Guidelines?' },
    { name: 'nutritionGuideOrientedResponse', value: '' },
    { name: 'readNutritionGuide', value: 'Have you read and understood the Nutrition Sensitive Social Protection Guidelines?' },
    { name: 'readNutritionGuideResponse', value: '' },

    { name: 'socialCashGuide', value: 'Does your Office have Social Cash Transfer Guidelines?' },
    { name: 'socialCashGuideResponse', value: '' },
    { name: 'socialCashGuideOriented', value: 'Have you been oriented the Social Cash Transfer Guidelines?' },
    { name: 'socialCashGuideOrientedResponse', value: '' },
    { name: 'readSocialCashGuide', value: 'Have you read and understood the Social Cash Transfer Guidelines?' },
    { name: 'readSocialCashGuideResponse', value: '' },

    { name: 'pWASGuidelines', value: 'Does your Office have PWAS Guidelines?' },
    { name: 'pWASGuidelinesResponse', value: '' },
    { name: 'pWASGuidelinesOriented', value: 'Have you been oriented PWAS Guidelines?' },
    { name: 'pWASGuidelinesOrientedResponse', value: '' },
    { name: 'readPWASGuidelines', value: 'Have you read and understood PWAS Guidelines?' },
    { name: 'readPWASGuidelinesResponse', value: '' },
    //Guidelines end

    //Processes start
    { name: 'practiceProcessesQ1a', value: '1.a. Do you review all the consent/ascent forms on file duly signed?' },
    { name: 'practiceProcessesQ1aResponse', value: '' },
    { name: 'practiceProcessQ1aComment', value: '' },

    { name: 'practiceProcessesQ1b', value: '1.b. Have you ascertained to ensure that case workers conform with case management guidelines and principles?' },
    { name: 'practiceProcessesQ1bResponse', value: '' },
    { name: 'practiceProcessQ1bComment', value: '' },

    { name: 'practiceProcessesQ2i', value: '2.i. Do you have individual files for; Children CCF, Children in conflict with the law, adoption, foster care, migrant, circumstantial, VAC and GBV?' },
    { name: 'practiceProcessesQ2iResponse', value: '' },
    { name: 'practiceProcessQ2iComment', value: '' },

    { name: 'practiceProcessesQ2ii', value: '2.ii. Do you review case management forms to check whether case workers are using up-to-date forms?' },
    { name: 'practiceProcessesQ2iiResponse', value: '' },
    { name: 'practiceProcessQ2iiComment', value: '' },

    { name: 'practiceProcessesQ2iii', value: '2.ii.Do you review case management forms to check for completeness, timeliness, consistency, and accuracy of information filled in forms?' },
    { name: 'practiceProcessesQ2iiiResponse', value: '' },
    { name: 'practiceProcessQ2iiiComment', value: '' },

    { name: 'practiceProcessesQ2iv', value: '2.iii. Do you review the identification and assessment form to ensure that the forms are completed in discussion with the client?' },
    { name: 'practiceProcessesQ2ivResponse', value: '' },
    { name: 'practiceProcessQ2ivComment', value: '' },

    { name: 'practiceProcessesQ2v', value: '2.iv. Do you review Case plans to ensure they are developed jointly with child and caregiver (where possible and appropriate)?' },
    { name: 'practiceProcessesQ2vResponse', value: '' },
    { name: 'practiceProcessQ2vComment', value: '' },

    { name: 'practiceProcessesQ2vi', value: '2.v. Do you review the case follow-up to check VCA access to services and progress status for clients receiving services?' },
    { name: 'practiceProcessesQ2viResponse', value: '' },
    { name: 'practiceProcessQ2viComment', value: '' },

    { name: 'practiceProcessesQ2vii', value: '2.vi. Are cases closed based on case closure criteria as outlined in Form 4?' },
    { name: 'practiceProcessesQ2viiResponse', value: '' },
    { name: 'practiceProcessQ2viiComment', value: '' },

    { name: 'practiceProcessesQ3a', value: '3.a. Do you check whether case classification is applied as outlined in the CCM guidelines and SOPs for identification & assessment consistently?' },
    { name: 'practiceProcessesQ3aResponse', value: '' },

    { name: 'practiceProcessesQ3b', value: '3.b. Were there high risk cases escalated to the district in the quarter? (Probe: How many?)' },
    { name: 'practiceProcessesQ3bResponse', value: '' },

    { name: 'practiceProcessesQ3c', value: '3.c. Were any statutory cases referred to the community for Community Case Management?' },
    { name: 'practiceProcessesQ3cResponse', value: '' },

    { name: 'practiceProcessesQ4', value: '4. Were cases identified and addressed through case management process? (Probe: How many?)' },
    { name: 'practiceProcessesQ4Response', value: '' },

    { name: 'practiceProcessesQ5', value: '5. Are the cases handled in the stipulated timeline?' },
    { name: 'practiceProcessesQ5Response', value: '' },
    //Processes end

    //Capacity start
    { name: 'capacityKnowledgeQ1', value: '1. Have case workers, supervisors and managers been trained in the approved MCDSS guidelines and training materials by a recognized trainer? Probe: When were the case workers last trained?' },
    { name: 'capacityKnowledgeQ1Response', value: '' },
    { name: 'date', value: '' },
    { name: 'dswo', value: '' },
    { name: 'dcdo', value: '' },
    { name: 'cdo', value: '' },
    { name: 'other', value: '' },

    { name: 'capacityKnowledgeQ2i', value: '2.i. Do case workers meet the criteria as defined? (i.e trained in child safeguarding & signed Code of conduct)?' },
    { name: 'capacityKnowledgeQ2iResponse', value: '' },
    { name: 'capacityKnowledgeQ2iComment', value: '' },

    { name: 'capacityKnowledgeQ2ii', value: '2.ii. Are all case workers applying child safeguarding principles (tailored to case management)?' },
    { name: 'capacityKnowledgeQ2iiResponse', value: '' },
    { name: 'capacityKnowledgeQ2iiComment', value: '' },

    { name: 'capacityKnowledgeQ2iii', value: '2.iii. Were all case workers oriented/trained on Child safeguarding?' },
    { name: 'capacityKnowledgeQ2iiiResponse', value: '' },

    { name: 'capacityKnowledgeQ3', value: '3. Have all case workers signed the code of conduct commitment form?' },
    { name: 'capacityKnowledgeQ3Response', value: '' },

    { name: 'capacityKnowledgeQ4', value: '4. Are all case workers compliant to child safeguarding principles? (Probe: Are there any Case workers reported for non-compliance?' },
    { name: 'capacityKnowledgeQ4Response', value: '' },
    { name: 'capacityKnowledgeQ4Comment', value: '' },

    { name: 'capacityKnowledgeQ1Cwacs', value: '' },
    { name: 'capacityKnowledgeQ1CDAs', value: '' },
    { name: 'capacityKnowledgeQ1Assistants', value: '' },
    { name: 'capacityKnowledgeQ1Cwacsi', value: '' },
    { name: 'capacityKnowledgeQ1CDAsii', value: '' },
    { name: 'capacityKnowledgeQ1Assistantsiii', value: '' },
    //Capacity end

    //Supervision start
    { name: 'supervisionMentorshipQ1i', value: '1.i. Have you been supervising and mentoring CDAs using the standardized supervision and mentorship tool?' },
    { name: 'supervisionMentorshipQ1iResponse', value: '' },
    { name: 'supervisionMentorshipQ1iComment', value: '' },

    { name: 'supervisionMentorshipQ1ii', value: '1.ii. Do you follow case management supervision & mentorship Plan?' },
    { name: 'supervisionMentorshipQ1iiResponse', value: '' },
    { name: 'supervisionMentorshipQ1iiComment', value: '' },

    { name: 'supervisionMentorshipQ1iii', value: '1.iii. Have CDAs been supervising and mentoring CWACs using the standardized supervision and mentorship tool?' },
    { name: 'supervisionMentorshipQ1iiiResponse', value: '' },
    { name: 'supervisionMentorshipQ1iiiComment', value: '' },

    { name: 'supervisionMentorshipQ1iv', value: '1.iv. Do they follow a case management supervision & mentorship Plan?' },
    { name: 'supervisionMentorshipQ1ivResponse', value: '' },
    { name: 'supervisionMentorshipQ1ivComment', value: '' },

    { name: 'supervisionMentorshipQ2i', value: '2.i Do you have a workplan and budget for statutory case management?' },
    { name: 'supervisionMentorshipQ2iResponse', value: '' },
    { name: 'supervisionMentorshipQ2iComment', value: '' },

    { name: 'supervisionMentorshipQ2ii', value: '2.ii Was the budget approved for statutory case management?' },
    { name: 'supervisionMentorshipQ2iiResponse', value: '' },
    { name: 'supervisionMentorshipQ2iiComment', value: '' },

    { name: 'supervisionMentorshipQ2iii', value: '2.iii Where resources disbursed as planned and budgeted for statutory case management?' },
    { name: 'supervisionMentorshipQ2iiiResponse', value: '' },
    { name: 'supervisionMentorshipQ2iiiComment', value: '' },

    { name: 'supervisionMentorshipQ2iv', value: '2.iv Do you have a workplan and budget for community case management?' },
    { name: 'supervisionMentorshipQ2ivResponse', value: '' },
    { name: 'supervisionMentorshipQ2ivComment', value: '' },

    { name: 'supervisionMentorshipQ2v', value: '2.v Was the budget approved for community case management?' },
    { name: 'supervisionMentorshipQ2vResponse', value: '' },
    { name: 'supervisionMentorshipQ2vComment', value: '' },

    { name: 'supervisionMentorshipQ2vi', value: '2.vi Where resources disbursed as planned and budgeted for community case management?' },
    { name: 'supervisionMentorshipQ2viResponse', value: '' },
    { name: 'supervisionMentorshipQ2viComment', value: '' },

    { name: 'supervisionMentorshipQ2vii', value: '2.vii Do your CDAs have access to materials for implementation of case management? i.e.• Tablet• Data Bundles• Bicycles• CCM Forms• Boots• Raincoats• Umbrella• T-shirt• ID• PPEs' },
    { name: 'supervisionMentorshipQ2viiResponse', value: '' },
    { name: 'supervisionMentorshipQ2viiComment', value: '' },

    { name: 'supervisionMentorshipQ2viii', value: '2.viii Do your CWACs have access to materials for implementation of case management? i.e. CM-Forms, ID, Phone and airtime' },
    { name: 'supervisionMentorshipQ2viiiResponse', value: '' },
    { name: 'supervisionMentorshipQ2viiiComment', value: '' },
    //Supervision end

    // Coordination and referral start
    { name: 'coordinationReferralQ1i', value: '1.i Does your district have a service directory? Probe: When was it last updated?' },
    { name: 'coordinationReferralQ1iResponse', value: '' },
    { name: 'coordinationReferralQ1iComment', value: '' },

    { name: 'coordinationReferralQ1ii', value: '1.ii Is your district using the service directory for coordination and bi-directional referral? Probe: used at both district and sub-center level?' },
    { name: 'coordinationReferralQ1iiResponse', value: '' },
    { name: 'coordinationReferralQ1iiComment', value: '' },

    { name: 'coordinationReferralQ2i', value: '2.i Were coordination meetings held by your district? (Probe: Should be held at least once per quarter)' },
    { name: 'coordinationReferralQ2iResponse', value: '' },
    { name: 'coordinationReferralQ2iComment', value: '' },

    { name: 'coordinationReferralQ2ii', value: '2.ii Were case conferences conducted for complex cases?' },
    { name: 'coordinationReferralQ2iiResponse', value: '' },
    { name: 'coordinationReferralQ2iiComment', value: '' },

    { name: 'coordinationReferralQ2iii', value: '2.iii Were case reviews/BID panels held jointly with partners including CCFs, relevant institutions and NGO service providers?' },
    { name: 'coordinationReferralQ2iiiResponse', value: '' },
    { name: 'coordinationReferralQ2iiiComment', value: '' },

    { name: 'coordinationReferralQ2iv', value: '2.iv Were case conferences conducted by stakeholders successful? (Probe for challenges that were faced, if any)' },
    { name: 'coordinationReferralQ2ivResponse', value: '' },
    { name: 'coordinationReferralQ2ivComment', value: '' },

    { name: 'coordinationReferralQ2v', value: '2.v Is there a selected district-level coordination structure used for implementation of VCA community case management?' },
    { name: 'coordinationReferralQ2vResponse', value: '' },
    { name: 'coordinationReferralQ2vComment', value: '' },

    { name: 'coordinationReferralQ2vi', value: '2.vi Is there a district workplan (with clear milestones) for the district-level coordination structure?' },
    { name: 'coordinationReferralQ2viResponse', value: '' },
    { name: 'coordinationReferralQ2viComment', value: '' },
    // Coordination and referral end

    // Data management start
    { name: 'dataManagementQ1i', value: '1.i Is there Case Management Information System in place?' },
    { name: 'dataManagementQ1iResponse', value: '' },

    { name: 'dataManagementQ1ii', value: '1.ii Do you have access to an updated Case Management Information System?' },
    { name: 'dataManagementQ1iiResponse', value: '' },

    { name: 'dataManagementQ1iii', value: '1.iii Is data from the Case management information system being used for decision making and service provision?' },
    { name: 'dataManagementQ1iiiResponse', value: '' },

    { name: 'dataManagementQ2i', value: '2.i Have you been trained in the use of Case Management Information System?' },
    { name: 'dataManagementQ2iResponse', value: '' },

    { name: 'dataManagementQ2ii', value: '2.ii Are you using the Case management MIS in following a clear implementation strategy (including how to sustain it)?' },
    { name: 'dataManagementQ2iiResponse', value: '' },
    // Data management end

    // Reporting start
    { name: 'reportingQ1', value: '1. Do you have a case management reporting system in place?' },
    { name: 'reportingQ1Response', value: '' },

    { name: 'reportingQ2', value: '2. Is the Community Caseworker report to the CDA submitted on a monthly basis?' },
    { name: 'reportingQ2Response', value: '' },
    { name: 'reportingQ2Comment', value: '' },

    { name: 'reportingQ3', value: '3. Is the CDA report to the District submitted on quarterly basis?' },
    { name: 'reportingQ3Response', value: '' },
    { name: 'reportingQ3Comment', value: '' },

  ]);
  const [isChildActIYes, setIsChildActIYes] = useState(false);
  const [showGbv, setShowGbv] = useState(false);
  const [showAntHTA, setShowAntHTA] = useState(false);
  const [imigratioNAct, setImigrationAct] = useState(false);
  const [marriagEAct, setMarriageAct] = useState(false);
  const [correctionalAct, setCorrectionalAct] = useState(false);
  const [alCareGuidelinesAct, setAlCareGuidelinesAct] = useState(false);
  const [nlCareFrameworkAct, setNlCareFrameworkAct] = useState(false);
  const [safeGuardFrameworkAct, setSafeGuardFrameworkAct] = useState(false);
  const [childPolicyAct, setChildPolicyAct] = useState(false);
  const [childFacilitiesGuideAct, setChildFacilitiesGuideAct] = useState(false);
  const [childParticipateAct, setChildParticipateAct] = useState(false);
  const [childMarriageAct, setChildMarriageAct] = useState(false);
  const [disabilitYAct, setDisabilityAct] = useState(false);
  const [agingPolicyAct, setAgingPolicyAct] = useState(false);
  const [foodSecurityAct, setFoodSecurityAct] = useState(false);
  const [liveliHoodGuideAct, setLiveliHoodGuideAct] = useState(false);
  const [nutritionGuideAct, setNutritionGuideAct] = useState(false);
  const [socialCashGuideAct, setSocialCashGuideAct] = useState(false);
  const [pWASGuidelinesAct, setPWASGuidelinesAct] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleChange = (fieldName: string, value: any) => {
    const updatedFields = fields.map(field =>
      field.name === fieldName ? { ...field, value } : field
    );
    setFields(updatedFields);

    if (fieldName === 'childActIResponse' && value === 100) {
      setIsChildActIYes(true);
    } else if (fieldName === 'childActIResponse') {
      setIsChildActIYes(false);
    }
    if (fieldName === 'gBVActIResponse' && value === 100) {
      setShowGbv(true);
    } else if (fieldName === 'gBVActIResponse') {
      setShowGbv(false);
    }

    if (fieldName === 'antHTActIResponse' && value === 100) {
      setShowAntHTA(true);
    } else if (fieldName === 'antHTActIResponse') {
      setShowAntHTA(false);
    }
    if (fieldName === 'imigrationActResponse' && value === 100) {
      setImigrationAct(true);
    } else if (fieldName === 'imigrationActResponse') {
      setImigrationAct(false);
    }
    if (fieldName === 'marriageActResponse' && value === 100) {
      setMarriageAct(true);
    } else if (fieldName === 'marriageActResponse') {
      setMarriageAct(false);
    }
    if (fieldName === 'correctionalServiceActResponse' && value === 100) {
      setCorrectionalAct(true);
    } else if (fieldName === 'correctionalServiceActResponse') {
      setCorrectionalAct(false);
    }
    if (fieldName === 'alGuidelinesResponse' && value === 100) {
      setAlCareGuidelinesAct(true);
    } else if (fieldName === 'alGuidelinesResponse') {
      setAlCareGuidelinesAct(false);
    }
    if (fieldName === 'nlCareFrameworkResponse' && value === 100) {
      setNlCareFrameworkAct(true);
    } else if (fieldName === 'nlCareFrameworkResponse') {
      setNlCareFrameworkAct(false);
    }
    if (fieldName === 'safeGuardFrameworkResponse' && value === 100) {
      setSafeGuardFrameworkAct(true);
    } else if (fieldName === 'safeGuardFrameworkResponse') {
      setSafeGuardFrameworkAct(false);
    }
    if (fieldName === 'childPolicyResponse' && value === 100) {
      setChildPolicyAct(true);
    } else if (fieldName === 'childPolicyResponse') {
      setChildPolicyAct(false);
    }
    if (fieldName === 'childFacilityGuideResponse' && value === 100) {
      setChildFacilitiesGuideAct(true);
    } else if (fieldName === 'childFacilityGuideResponse') {
      setChildFacilitiesGuideAct(false);
    }
    if (fieldName === 'childParticipateResponse' && value === 100) {
      setChildParticipateAct(true);
    } else if (fieldName === 'childParticipateResponse') {
      setChildParticipateAct(false);
    }
    if (fieldName === 'childMarriageResponse' && value === 100) {
      setChildMarriageAct(true);
    } else if (fieldName === 'childMarriageResponse') {
      setChildMarriageAct(false);
    }
    if (fieldName === 'disabilityActResponse' && value === 100) {
      setDisabilityAct(true);
    } else if (fieldName === 'disabilityActResponse') {
      setDisabilityAct(false);
    }
    if (fieldName === 'agingPolicyResponse' && value === 100) {
      setAgingPolicyAct(true);
    } else if (fieldName === 'agingPolicyResponse') {
      setAgingPolicyAct(false);
    }
    if (fieldName === 'foodSecurityResponse' && value === 100) {
      setFoodSecurityAct(true);
    } else if (fieldName === 'foodSecurityResponse') {
      setFoodSecurityAct(false);
    }
    if (fieldName === 'liveliHoodGuideResponse' && value === 100) {
      setLiveliHoodGuideAct(true);
    } else if (fieldName === 'liveliHoodGuideResponse') {
      setLiveliHoodGuideAct(false);
    }
    if (fieldName === 'nutritionGuideResponse' && value === 100) {
      setNutritionGuideAct(true);
    } else if (fieldName === 'nutritionGuideResponse') {
      setNutritionGuideAct(false);
    }
    if (fieldName === 'socialCashGuideResponse' && value === 100) {
      setSocialCashGuideAct(true);
    } else if (fieldName === 'socialCashGuideResponse') {
      setSocialCashGuideAct(false);
    }
    if (fieldName === 'pWASGuidelinesResponse' && value === 100) {
      setPWASGuidelinesAct(true);
    } else if (fieldName === 'pWASGuidelinesResponse') {
      setPWASGuidelinesAct(false);
    }
  };

  const next = () => {
    form.validateFields().then(() => {
      setCurrent(current + 1);
    });
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onFinish = () => {
    setIsLoading(true);
    const formData: Record<string, any> = {};

    fields.forEach(field => {
      formData[field.name] = field.value;
    });

    // Include the Likert scales text in the formData
    formData['childActI'] = fields.find(field => field.name === 'childActI')?.value || '';
    formData['childActII'] = fields.find(field => field.name === 'childActII')?.value || '';
    formData['childActIII'] = fields.find(field => field.name === 'childActIII')?.value || '';

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.post(`${apiUrl}/${collectionName}`, formData, { headers })
      .then(response => {
        notificationController.success({ message: t('common.success') });
        setIsLoading(false);
        setCurrent(0);
        form.resetFields();
      })
      .catch(error => {
        console.error('Error:', error);
        notificationController.error({ message: t('common.error') });
        setIsLoading(false);
      });
  };

  const steps = [
    { title: t('Assessee Info') },
    { title: t('Legislation  and Guidelines') },
    { title: t('Practice and Processes') },
    { title: t('Capacity and Knowledge') },
    { title: t('Supervision & Mentorship') },
    { title: t('Coordination and Referral') },
    { title: t('Data Management') },
    { title: t('Reporting') },
    { title: t('Final Section') },
  ];

  const formFieldsUi = [
    <Step1 key="1" handleChange={handleChange} />,
    <Step2
      key="2"
      handleChange={handleChange}
      isChildActIYes={isChildActIYes}
      showGbv={showGbv}
      showAntHTA={showAntHTA}
      imigratioNAct={imigratioNAct}
      marriagEAct={marriagEAct}
      correctionalAct={correctionalAct}
      alCareGuidelinesAct={alCareGuidelinesAct}
      nlCareFrameworkAct={nlCareFrameworkAct}
      safeGuardFrameworkAct={safeGuardFrameworkAct}
      childPolicyAct={childPolicyAct}
      childFacilitiesGuideAct={childFacilitiesGuideAct}
      childParticipateAct={childParticipateAct}
      childMarriageAct={childMarriageAct}
      disabilitYAct={disabilitYAct}
      agingPolicyAct={agingPolicyAct}
      foodSecurityAct={foodSecurityAct}
      liveliHoodGuideAct={liveliHoodGuideAct}
      nutritionGuideAct={nutritionGuideAct}
      socialCashGuideAct={socialCashGuideAct}
      pWASGuidelinesAct={pWASGuidelinesAct}
    />,
    <Step3  key="3" handleChange={handleChange} />,
    <Step4  key="4" handleChange={handleChange} />,
    <Step5  key="5" handleChange={handleChange} />,
    <Step6  key="6" handleChange={handleChange} />,
    <Step7  key="7" handleChange={handleChange} />,
    <Step8  key="8" handleChange={handleChange} />,
    <Step9 key="9" formValues={fields} />,
  ];  

  return (
    <BaseForm
      form={form}
      onFinish={onFinish}
    >
      <Steps size="small" current={current} items={steps} />

      <div>{formFieldsUi[current]}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {current > 0 && (
          <BaseButton type="default" onClick={prev}>
            {t('forms.stepFormLabels.previous')}
          </BaseButton>
        )}
        {current < steps.length - 1 && (
          <BaseButton type="primary" onClick={next}>
            {t('Next Section')}
          </BaseButton>
        )}
        {current === steps.length - 1 && (
          <BaseButton type="primary" onClick={onFinish} loading={isLoading}>
            {t('Submit Final Section')}
          </BaseButton>
        )}
      </div>
    </BaseForm>
  );
};

export default StoresStepForm;