import React, { useCallback, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Skeleton, Typography, Divider, Tag, Badge, Row, Col, Button, Tooltip } from 'antd';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { notificationController } from '@app/controllers/notificationController';
import styled from 'styled-components';
import { convertToYesNo, isoToDate } from '@app/utils/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileExcelFilled } from '@ant-design/icons';
import moment from 'moment';

const SectionTitle = styled(Typography.Title)`
  font-size: 18px;
  color: #004080;
  margin-bottom: 10px;
`;

const InfoLabel = styled(Typography.Text)`
  font-weight: bold;
  color: #006baf;
`;

const InfoValue = styled(Typography.Text)`
  display: block;
  margin-bottom: 8px;
`;

const Wrapper = styled.div`
  width: 100%;
  text-transform: capitalize; 
`;

const Title = styled(Typography.Title)`
  font-size: 22px;
  color: #004080;
`;

const Subtitle = styled(Typography.Text)`
  font-size: 16px;
  color: #004080;
`;

interface PersonalInfoFormValues {
  firstName: string;
  lastName: string;
}

const initialPersonalInfoValues: PersonalInfoFormValues = {
  firstName: '',
  lastName: '',
};

interface Household {
  household_id: string;
  province: string;
  facility: string;
  ward: string;
  vca_gender: string;
  acceptance: string;
  date_enrooled: string;
  active_on_treatment: string | null;
  adolescent_birthdate: string;
  agyw: string;
  approved_family: string;
  art_check_box: string | null;
  art_number: string | null;
  beds: string;
  biological_children: string | null;
  calhiv: string;
  caregiver_art_number: string | null;
  caregiver_birthdate: string;
  caregiver_hiv_status: string;
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_sex: string;
  case_status: string;
  caseworker_name: string;
  caseworker_phone: string;
  cfsw: string;
  child_ever_experienced_sexual_violence: string;
  child_mmd: string | null;
  children_violence_six_months: string;
  client_result: string | null;
  client_screened: string | null;
  consent_check_box: string;
  contact_number: string;
  csv: string;
  cwlhiv: string;
  date_edited: string;
  date_edited_check: string;
  date_enrolled: string;
  date_hiv_known: string | null;
  date_offered_enrollment: string;
  date_referred: string;
  date_screened: string;
  date_started_art: string | null;
  de_registration_date: string | null;
  de_registration_reason: string | null;
  district: string | null;
  education: string;
  emergency_name: string;
  enrolled_date: string | null;
  entry_type: string;
  fam_source_income: string;
  hei: string;
  homeaddress: string;
  index_check_box: string;
  is_biological_mother_of_child_living_with_hiv: string | null;
  is_on_hiv_treatment: string | null;
  is_the_child_caregiver_an_fsw: string;
  malaria_itns: string;
  marital_status: string;
  monthlyexpenses: string;
  number_of_pregnant_women: string | null;
  partner: string | null;
  pregnant_woment: string | null;
  provider_id: string;
  relation: string;
  relationship: string | null;
  school: string;
  screened: string;
  screening_date: string;
  screening_location: string;
  screening_location_home: string;
  takes_drugs_to_prevent_other_diseases: string | null;
  tpt_client_eligibility: string | null;
  tpt_client_initiated: string | null;
  unique_id: string;
  violence_six_months: string;
  viral_load_results_on_file: string | null;
  vl_check_box: string | null;
}

interface PersonalInfoProps {
  profileData?: any;
}

export const CaregiverPersonalInfo: React.FC<PersonalInfoProps> = ({ profileData }) => {
  const location = useLocation();
  const household: Household | undefined = location.state?.household;

  const user = useAppSelector((state) => state.user.user);
  const [isFieldsChanged, setFieldsChanged] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const userFormValues = useMemo(
    () => (user ? { firstName: user.first_name, lastName: user.last_name } : initialPersonalInfoValues),
    [user]
  );

  const [form] = BaseButtonsForm.useForm();
  const { t } = useTranslation();

  const onFinish = useCallback(
    (values: any) => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setFieldsChanged(false);
        notificationController.success({ message: t('common.success') });
      }, 600);
    },
    [t]
  );

  if (isLoading || !household) {
    return (
      <div
        style= {{
      display: 'flex',
        flexDirection: 'column',
          justifyContent: 'center',
            alignItems: 'center',
        }
  }
      >
    <Skeleton active />
    </div>
    );
  }

const renderCol = (label: string, value: any, span: number = 6) => {
  // Check if the value is "no", false, or an empty string
  if (value === 'no' || value === 'No' || value === false || value === 'false' || value === null || value === '') {
    return null; // Don't render this column
  }

  return (
    <BaseCol xs= { 24} md = { span } >
      <InfoLabel>{ label } </InfoLabel>
      < InfoValue > { value !== null && value !== undefined ? value : 'Not Applicable'
}</InfoValue>
  </BaseCol>
    );
  };

// Ref to capture the section for PDF
const contentRef = useRef<HTMLDivElement>(null);

const exportToPDF = useCallback(() => {
  const input = contentRef.current;
  if (input) {
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190;
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

      // Save the PDF
      pdf.save('Caregiver_Personal_Info.pdf');
    });
  }
}, []);

if (isLoading || !household) {
  return (
    <div
        style= {{
    display: 'flex',
      flexDirection: 'column',
        justifyContent: 'center',
          alignItems: 'center',
        }
}
      >
  <Skeleton active />
  </div>
    );
  }

return (
  <Wrapper>
  { profileData && (
    <>
    <div style= {{ display: 'flex', justifyContent: 'space-between' }}>
      <Title>{ household.caregiver_name } </Title>

{/* <Tooltip title="Export Caregiver Profile and services">
              <Button type="ghost" onClick={exportToPDF} icon={<FileExcelFilled />}>
                {t('Export Profile')}
              </Button>
            </Tooltip> */}

</div>
  < Divider />
  <Row>
  <Col span={ 24 }>
    <Typography.Text strong > Household ID </Typography.Text> {household.household_id}
      </Col>
      < Col span = { 24} >
        <Typography.Text strong > Partner </Typography.Text> {household.partner}
        </Col>
        < Col span = { 24} >
          <Typography.Text strong > Date enrolled </Typography.Text>
{ household.date_enrolled }
</Col>
  < Col span = { 24} >
    <Typography.Text strong > Case status </Typography.Text>
      < Badge
count = { household.case_status === '1' || household.case_status === "yes" ? "Active" : "Closed" }
style = {{ fontWeight: 'bold', backgroundColor: household.case_status === '1' || household.case_status === "yes" ? '#52c41a' : '#ff4d4f' }}
              />
  </Col>
  </Row>
  </>
      )}
<BaseCard>
  <BaseButtonsForm
          form={ form }
name = "info"
loading = { isLoading }
initialValues = { userFormValues }
isFieldsChanged = { isFieldsChanged }
setFieldsChanged = { setFieldsChanged }
onFieldsChange = {() => setFieldsChanged(true)}
onFinish = { onFinish }
  >
  <BaseRow gutter={ { xs: 10, md: 15, xl: 30 } }>
    <Divider />
    < BaseCol span = { 24} >
{(household.case_status !== '1' && household.case_status !== 'yes') && (
  <>
    <SectionTitle level={5}>{t('Household Deregistration Information')}</SectionTitle>
    {renderCol('De-registration Reason', household.de_registration_reason)}
    {renderCol('De-registration Date', household.de_registration_date)}
    <Divider />
  </>
)}

  < Divider />
  <BaseCol span = { 24 } >
    <SectionTitle level={ 5 }> { t('Caregiver Personal Information') } </SectionTitle>
      </BaseCol>

{ renderCol('Province', household.province) }
{ renderCol('Facility', household.facility) }
{ renderCol('Ward', household.ward) }
{ renderCol('VCA Gender', household.vca_gender) }
{ renderCol('Relation', household.relation) }
{ renderCol('Active On Treatment', household.active_on_treatment) }
{ renderCol('Adolescent Birthdate', household.adolescent_birthdate) }
{ renderCol('AGYW', convertToYesNo(household.agyw)) }
{ renderCol('Approved Family', household.approved_family) }
{ renderCol('ART Check Box', household.art_check_box) }
{ renderCol('ART Number', household.art_number) }
{ renderCol('Beds', household.beds) }
{ renderCol('Biological Children', household.biological_children) }
{ renderCol('CALHIV', convertToYesNo(household.calhiv)) }
{ renderCol('Caregiver ART Number', household.caregiver_art_number) }
{ renderCol('Caregiver Birthdate', household.caregiver_birthdate) }
{ renderCol('Caregiver HIV Status', household.caregiver_hiv_status) }
{ renderCol('Caregiver Name', household.caregiver_name) }
{ renderCol('Caregiver Phone', household.caregiver_phone) }
{ renderCol('Caregiver Sex', household.caregiver_sex) }


<Divider />
  < BaseCol span = { 24} >
    <SectionTitle level={ 5 }> { t('Household Information') } </SectionTitle>
      </BaseCol>

{ renderCol('CFSW', convertToYesNo(household.cfsw)) }
{ renderCol('Child Ever Experienced Sexual Violence', household.child_ever_experienced_sexual_violence) }
{ renderCol('Child MMD', household.child_mmd) }
{ renderCol('Children Violence Six Months', household.children_violence_six_months) }
{ renderCol('Client Result', household.client_result) }
{ renderCol('Client Screened', household.client_screened) }
{ renderCol('Consent Check Box', household.consent_check_box) }
{ renderCol('Contact Number', household.contact_number) }
{ renderCol('C/SV', convertToYesNo(household.csv)) }
{ renderCol('CWLHIV', convertToYesNo(household.cwlhiv)) }
{ renderCol('District', household.district) }
{ renderCol('Education', household.education) }
{ renderCol('Emergency Name', household.emergency_name) }
{ renderCol('Enrolled Date', household.enrolled_date) }
{ renderCol('Entry Type', household.entry_type) }
{ renderCol('Family Source of Income', household.fam_source_income) }
{ renderCol('HEI', convertToYesNo(household.hei)) }
{ renderCol('Home Address', household.homeaddress) }
{ renderCol('Index Check Box', household.index_check_box) }
{ renderCol('Is Biological Mother of Child Living with HIV', household.is_biological_mother_of_child_living_with_hiv) }
{ renderCol('Is on HIV Treatment', household.is_on_hiv_treatment) }
{ renderCol('Is the Child Caregiver an FSW', household.is_the_child_caregiver_an_fsw) }
{ renderCol('Malaria ITNs', household.malaria_itns) }
{ renderCol('Marital Status', household.marital_status) }
{ renderCol('Monthly Expenses', household.monthlyexpenses) }
{ renderCol('Number of Pregnant Women', household.number_of_pregnant_women) }
{ renderCol('Partner', household.partner) }

<Divider />
  < BaseCol span = { 24} >
    <SectionTitle level={ 5 }> { t('Other Household Information') } </SectionTitle>
      </BaseCol>

{ renderCol('Pregnant Women', household.pregnant_woment) }
{ renderCol('Provider ID', household.provider_id) }}
{ renderCol('Acceptance', household.acceptance) }
{ renderCol('School', household.school) }
{ renderCol('Screened', household.screened) }
{ renderCol('Screening Date', household.screening_date) }
{ renderCol('Screening Location', household.screening_location) }
{ renderCol('Screening Location Home', household.screening_location_home) }
{ renderCol('Takes Drugs to Prevent Other Diseases', household.takes_drugs_to_prevent_other_diseases) }
{ renderCol('TPT Client Eligibility', household.tpt_client_eligibility) }
{ renderCol('TPT Client Initiated', household.tpt_client_initiated) }
<Divider />
  < BaseCol span = { 24} >
    <SectionTitle level={ 5 }> { t('Date History') } </SectionTitle>
      </BaseCol>
{ renderCol('Date Enrolled', household.date_enrolled) }
{ renderCol('Date HIV Known', household.date_hiv_known) }
{ renderCol('Date Offered Enrollment', household.date_offered_enrollment) }
{ renderCol('Date Referred', household.date_referred) }
{ renderCol('Date Screened', household.date_screened) }
{ renderCol('Date Started ART', household.date_started_art) }
<Divider />
  < BaseCol span = { 24} >
    <SectionTitle level={ 5 }> { t('Caseworker  Information') } </SectionTitle>
      </BaseCol>
{ renderCol('Caseworker Name', household.caseworker_name) }
{ renderCol('Caseworker Phone', household.caseworker_phone) }
</BaseRow>
  </BaseButtonsForm>
  </BaseCard>
  </Wrapper>
  );
};
