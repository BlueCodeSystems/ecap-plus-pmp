/* eslint-disable prettier/prettier */
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Skeleton, Typography, Divider, Alert, Tag, Badge, Row, Col, Button, Tooltip } from 'antd';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
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

interface Vcas {
  firstname: string;
  lastname: string;
  caregiver_name: string;
  vca_gender: string;
  province: string;
  district: string;
  cwac: string;
  date_created: string;
  last_interacted_with: string;
  year: number;
  village: string;
  ward: string;
  cwac_member_name: string;
  risk_level?: string;
  abym: string;
  acceptance: string;
  agyw: string;
  art_number: string;
  been_tested_last_year: string;
  birthdate: string;
  birthdateapprox: string;
  calhiv: string;
  caregiver_art_number: string;
  caregiver_birth_date: string;
  caregiver_hiv_status: string;
  caregiver_nrc: string;
  caregiver_phone: string;
  caregiver_sex: string;
  case_status: string;
  caseworker_name: string;
  caseworker_phone: string;
  cfsw: string;
  child_adolescent_in_aged_headed_household: string;
  child_adolescent_in_child_headed_household: string;
  child_adolescent_in_chronically_ill_headed_household: string;
  child_adolescent_in_female_headed_household: string;
  child_adolescent_living_with_disability: string;
  child_been_tested_for_hiv: string;
  child_ever_experienced_sexual_violence: string;
  art_check_box: string | null;
  baseentityid: string;
  clientapplicationversion: string;
  clientdatabaseversion: string;
  consent_check_box: string;
  csv: string;
  date_edited: string;
  date_edited_check: string;
  date_enrolled: string;
  date_last_vl: string | null;
  date_next_vl: string;
  date_offered_enrollment: string;
  date_referred: string;
  date_screened: string;
  date_started_art: string;
  date_subpop2: string | null;
  datecreated: string;
  dateedited: string;
  de_registration_date: string | null;
  deathdateapprox: string;
  deleted: string | null;
  facility: string;
  hei: string;
  hiv_test_date: string | null;
  homeaddress: string;
  household_id: string;
  id: string;
  identifiers: string;
  is_biological: string | null;
  is_biological_child: string;
  is_hiv_positive: string;
  is_index: string;
  is_mother_adhering_to_treatment_wlhiv: string | null;
  is_mother_currently_on_treatment_wlhiv: string | null;
  is_mother_virally_suppressed_wlhiv: string | null;
  is_pregnant_breastfeeding: string | null;
  is_the_child_caregiver_an_fsw: string;
  landmark: string;
  level_mmd: string;
  member_type: string | null;
  mother_art_number_wlhiv: string | null;
  partner: string;
  pbfw: string;
  physical_address: string | null;
  reason: string | null;
  received_birth_certificate: string | null;
  received_results_last_hiv_test: string | null;
  receiving_art: string | null;
  relation: string;
  relationships: string;
  school: string;
  school_name: string | null;
  screening_location: string;
  serverversion: string;
  survivors_of_other_form_of_violence: string;
  takes_drugs_to_prevent_other_diseases: string | null;
  takes_tb_preventive_therapy: string | null;
  tb_screening: string | null;
  time_art: string | null;
  time_result: string | null;
  time_vl: string | null;
  uid: string;
  under_5_malnourished: string;
  updated_status: string;
  virally_suppressed: string | null;
  vl_last_result: string | null;
  vl_next_result: string | null;
  vl_suppressed: string;
}
interface PersonalInfoProps {
  profileData?: Vcas;
}
export const VcaPersonalInfo: React.FC<PersonalInfoProps> = ({ profileData }) => {
  const location = useLocation();
  const { unique_id } = useParams<{ unique_id: string }>();
  const vca: Vcas | undefined = location.state?.vca;
  console.log(vca);
  const [isFieldsChanged, setFieldsChanged] = useState(false);
  const [isLoading, setLoading] = useState(false);

  // --- NEW: flagged records state ---
  const [flaggedMap, setFlaggedMap] = useState<Record<string, any>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);

  // Fetch active flagged records (non-resolved) and index them for quick lookup
  useEffect(() => {
    let mounted = true;
    const fetchFlags = async () => {
      setFlagsLoading(true);
      try {
        const base = process.env.REACT_APP_BASE_URL || 'https://ecapplus.server.dqa.bluecodeltd.com';
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${base}/items/flagged_forms_ecapplus_pmp?filter[status][_neq]=Resolved&limit=-1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const items: any[] = res.data?.data || res.data || [];
        const map: Record<string, any> = {};
        items.forEach((f: any) => {
          if (f.uid) map[f.uid] = f;
          if (f.unique_id) map[f.unique_id] = f;
          if (f.vca_id) map[f.vca_id] = f;
          if (f.household_id) map[f.household_id] = f;
          if (f.id) map[f.id] = f;
        });

        if (mounted) setFlaggedMap(map);
      } catch (err) {
        console.error('Error fetching flagged records (vca profile)', err);
      } finally {
        if (mounted) setFlagsLoading(false);
      }
    };

    fetchFlags();
    return () => {
      mounted = false;
    };
  }, []);

  // Use the Vca data directly for form initial values
  const [form] = BaseButtonsForm.useForm();
  const { t } = useTranslation();
  useEffect(() => {
    if (vca) {
      form.setFieldsValue({
        firstName: vca.firstname,
        lastName: vca.lastname,
      });
    }
  }, [vca, form]);
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
        pdf.save('Vca_Personal_Info.pdf');
      });
    }
  }, []);
  if (isLoading || !vca) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
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
      <BaseCol xs={24} md={span}>
        <InfoLabel>{label}</InfoLabel>
        <InfoValue>{value !== null && value !== undefined ? value : 'Not Applicable'}</InfoValue>
      </BaseCol>
    );
  };
  return (
    <Wrapper>
      {profileData && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title>{`${vca.firstname} ${vca.lastname}`}</Title>

              {/* Flag display: check flaggedMap by uid / unique_id / id / baseentityid / household_id */}
              {(() => {
                const keyId = vca.uid ?? (vca as any).unique_id ?? vca.id ?? vca.baseentityid ?? vca.household_id;
                const flag = keyId ? flaggedMap[keyId] : undefined;
                if (!flag) return null;

                const tooltipContent = (
                  <div style={{ maxWidth: 360, wordBreak: 'break-word' }}>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>{t('Comment')}</div>
                    <div style={{ whiteSpace: 'normal' }}>{flag.comment || '—'}</div>
                    {flag.date_created && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                        Created: {moment(flag.date_created).format('LLL')}
                      </div>
                    )}
                  </div>
                );

                return (
                  <Tooltip placement="topLeft" title={tooltipContent}>
                    <Tag color="red" style={{ fontWeight: 700, cursor: 'pointer' }}>Flagged Record</Tag>
                  </Tooltip>
                );
              })()}

            </div>

            <div>
              {/* right-side actions (kept same as original) */}
            </div>
          </div>
          <Divider />
          <Row>
            <Col span={24}>
              <Typography.Text strong>Household ID </Typography.Text> {vca.household_id}
            </Col>
            <Col span={24}>
              <Typography.Text strong>Unique ID </Typography.Text> {unique_id}
            </Col>
            <Col span={24}>
              <Typography.Text strong>Case status </Typography.Text>
              <Badge
                count={vca.case_status === '1' || vca.case_status === "yes" ? 'Active' : 'Inactive'}
                style={{ fontWeight: 'bold', backgroundColor: vca.case_status === '1' || vca.case_status === "yes" ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col span={24}>
              <Typography.Text strong>Partner</Typography.Text> {vca.partner}
            </Col>
            <Col span={24}>
              <Typography.Text strong>Date enrolled </Typography.Text>
              {vca.date_enrolled}
            </Col>
          </Row>
          <br />
          <br />
          <br />
        </>
      )}
      <BaseCard>
        <BaseButtonsForm
          form={form}
          name="info"
          loading={isLoading}
          initialValues={{
            firstName: vca.firstname,
            lastName: vca.lastname,
          }}
          isFieldsChanged={isFieldsChanged}
          setFieldsChanged={setFieldsChanged}
          onFieldsChange={() => setFieldsChanged(true)}
          onFinish={onFinish}
        >
          <BaseRow gutter={{ xs: 10, md: 15, xl: 30 }}>
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('VCA Personal Information')}</SectionTitle>
            </BaseCol>
            {renderCol('Birthdate', vca.birthdate, 8)}
            {renderCol('Gender', vca.vca_gender, 8)}
            {renderCol('Province', vca.province, 8)}
            {renderCol('District', vca.district, 8)}
            {renderCol('Ward', vca.ward, 8)}
            {renderCol('Home Address', vca.homeaddress, 8)}
            {renderCol('Physical Address', vca.physical_address, 8)}
            {renderCol('Art Number', vca.art_number, 8)}
            {renderCol('HIV Test Date', vca.hiv_test_date, 8)}
            {renderCol('Been Tested Last Year', vca.been_tested_last_year, 8)}
            {renderCol('Is Biological', vca.is_biological, 8)}
            {renderCol('Is Biological Child', vca.is_biological_child, 8)}
            {renderCol('Is HIV Positive', vca.is_hiv_positive, 8)}
            {renderCol('Is Index', vca.is_index, 8)}
            {renderCol('Received Results Last HIV Test', vca.received_results_last_hiv_test, 8)}
            {renderCol('Receiving ART', vca.receiving_art, 8)}
            {renderCol('Screening Location', vca.screening_location, 8)}
            {renderCol('Date Last VL', vca.date_last_vl, 8)}
            {renderCol('Date Next VL', vca.date_next_vl, 8)}
            <Divider />
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('Enrollment Details')}</SectionTitle>
            </BaseCol>
            {renderCol('Date Offered Enrollment', vca.date_offered_enrollment, 8)}
            {renderCol('Date Referred', vca.date_referred, 8)}
            {renderCol('Facility', vca.facility, 8)}
            {renderCol('School', vca.school, 8)}
            {renderCol('School Name', vca.school_name, 8)}
            <Divider />
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('Current Caregiver Information')}</SectionTitle>
            </BaseCol>
            {renderCol('Name', vca.caregiver_name, 8)}
            {renderCol('Gender', vca.caregiver_sex, 8)}
            {renderCol('ART Number', vca.caregiver_art_number, 8)}
            {renderCol('Birth Date', vca.caregiver_birth_date, 8)}
            {renderCol('HIV Status', vca.caregiver_hiv_status, 8)}
            {renderCol('Relationship to child', vca.relation, 8)}
            {renderCol('NRC', vca.caregiver_nrc, 8)}
            {renderCol('Phone', vca.caregiver_phone, 8)}
            {renderCol('Is Mother Adhering to Treatment WLHIV', vca.is_mother_adhering_to_treatment_wlhiv, 8)}
            {renderCol('Is Mother Currently on Treatment WLHIV', vca.is_mother_currently_on_treatment_wlhiv, 8)}
            {renderCol('Is Mother Virally Suppressed WLHIV', vca.is_mother_virally_suppressed_wlhiv, 8)}
            {renderCol('Is Pregnant/Breastfeeding', vca.is_pregnant_breastfeeding, 8)}
            {renderCol('Is the Child Caregiver an FSW', vca.is_the_child_caregiver_an_fsw, 8)}
            {renderCol('Reason', vca.reason, 8)}
            <Divider />
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('Sub Populations')}</SectionTitle>
            </BaseCol>
            {renderCol('ABYM', vca.abym, 8)}
            {renderCol('Acceptance', vca.acceptance, 8)}
            {renderCol('AGYW', convertToYesNo(vca.agyw), 8)}
            {renderCol('Birthdate Approx', vca.birthdateapprox, 8)}
            {renderCol('CALHIV', convertToYesNo(vca.calhiv), 8)}
            {renderCol('CFSW', convertToYesNo(vca.cfsw), 8)}
            {renderCol('Child Adolescent in Aged-Headed Household', vca.child_adolescent_in_aged_headed_household, 8)}
            {renderCol('Child Adolescent in Child-Headed Household', vca.child_adolescent_in_child_headed_household, 8)}
            {renderCol('Child Adolescent in Chronically Ill Headed Household', vca.child_adolescent_in_chronically_ill_headed_household, 8)}
            {renderCol('Child Adolescent in Female-Headed Household', vca.child_adolescent_in_female_headed_household, 8)}
            {renderCol('Child Adolescent Living with Disability', vca.child_adolescent_living_with_disability, 8)}
            {renderCol('Child Been Tested for HIV', vca.child_been_tested_for_hiv, 8)}
            {renderCol('Child Ever Experienced Sexual Violence', vca.child_ever_experienced_sexual_violence, 8)}
            {renderCol('Consent Check Box', vca.consent_check_box, 8)}
            {renderCol('CSV', convertToYesNo(vca.csv), 8)}
            {renderCol('HEI', convertToYesNo(vca.hei), 8)}
            {renderCol('Landmark', vca.landmark, 8)}
            {renderCol('Level MMD', vca.level_mmd, 8)}
            {renderCol('Member Type', vca.member_type, 8)}
            {renderCol('Mother ART Number WLHIV', vca.mother_art_number_wlhiv, 8)}
            {renderCol('PBFW', vca.pbfw, 8)}
            {renderCol('Received Birth Certificate', vca.received_birth_certificate, 8)}
            {renderCol('Survivors of Other Forms of Violence', vca.survivors_of_other_form_of_violence, 8)}
            {renderCol('Takes Drugs to Prevent Other Diseases', vca.takes_drugs_to_prevent_other_diseases, 8)}
            {renderCol('Takes TB Preventive Therapy', vca.takes_tb_preventive_therapy, 8)}
            {renderCol('TB Screening', vca.tb_screening, 8)}
            {renderCol('Time ART', vca.time_art, 8)}
            {renderCol('Time Result', vca.time_result, 8)}
            {renderCol('Time VL', vca.time_vl, 8)}
            {renderCol('Under 5 Malnourished', vca.under_5_malnourished, 8)}
            {renderCol('Updated Status', vca.updated_status, 8)}
            {renderCol('Virally Suppressed', vca.virally_suppressed, 8)}
            {renderCol('VL Last Result', vca.vl_last_result, 8)}
            {renderCol('VL Next Result', vca.vl_next_result, 8)}
            {renderCol('VL Suppressed', vca.vl_suppressed, 8)}
            <Divider />
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('History')}</SectionTitle>
            </BaseCol>
            {renderCol('Date Edited', vca.date_edited, 8)}
            {renderCol('Date Edited Check', convertToYesNo(vca.date_edited_check), 8)}
            {renderCol('Date Screened', vca.date_screened, 8)}
            {renderCol('Date Started ART', vca.date_started_art, 8)}
            {renderCol('Date Subpop2', vca.date_subpop2, 8)}
            {renderCol('Date Edited', isoToDate(vca.dateedited).toLocaleDateString(), 8)}
            {renderCol('De-Registration Date', vca.de_registration_date, 8)}
            {renderCol('Death Date Approx', vca.deathdateapprox, 8)}
            <Divider />
            <BaseCol span={24}>
              <SectionTitle level={5}>{t('Caseworker Information')}</SectionTitle>
            </BaseCol>
            {renderCol('Name', vca.caseworker_name, 8)}
            {renderCol('Phone', vca.caseworker_phone, 8)}
          </BaseRow>
        </BaseButtonsForm>
      </BaseCard>
    </Wrapper>
  );
};

export default VcaPersonalInfo;
