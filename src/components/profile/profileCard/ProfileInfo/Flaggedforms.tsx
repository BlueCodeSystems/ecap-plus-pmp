import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert } from 'antd';
import styled from 'styled-components';
import axios from 'axios';
import { notificationController } from '@app/controllers/notificationController';

const { Title } = Typography;
const { TextArea } = Input;

const apiUrl = `${process.env.REACT_APP_BASE_URL}/items`;
const collectionName = 'flagged_forms_ecapplus_pmp';

const Wrapper = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 40px auto;
  padding: 30px;
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`;

const FieldContainer = styled.div`
  margin-bottom: 20px;
`;

const FieldLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 5px;
`;

const FieldValue = styled.div`
  background-color: #f7f9fc;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 14px;
  color: #333333;
`;

export const FlaggedRecordForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const householdId = location?.state?.household?.household_id || 'Not Available';
  const caseworkerPhone = location?.state?.household?.caseworker_phone || 'Not Available';
  const caseworkerName = location?.state?.household?.caseworker_name || 'Not Available';
  const facility = location?.state?.household?.facility || 'Not Available';

  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [isExporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Export functionality
  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Access token is missing!');
      }

      // API call to export data
      const response = await axios.get(`${apiUrl}/${collectionName}/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          household_id: householdId,
        },
        responseType: 'blob', // Important for file download
      });

      // Create a blob URL for the downloaded file
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `flagged_forms_${householdId}.csv`;
      link.click();

      // Show success notification
      notificationController.success({
        message: 'Export Successful',
        description: 'The flagged forms have been exported successfully.',
      });
    } catch (err: any) {
      console.error('Failed to export the flagged forms:', err);
      setError(err.response?.data?.message || 'Failed to export the flagged forms. Please try again later.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Wrapper>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '30px' }}>
        Flagged Forms Details
      </Title>

      <FieldContainer>
        <FieldLabel>Household ID</FieldLabel>
        <FieldValue>{householdId}</FieldValue>
      </FieldContainer>

      <FieldContainer>
        <FieldLabel>Caseworker Phone</FieldLabel>
        <FieldValue>{caseworkerPhone}</FieldValue>
      </FieldContainer>

      <FieldContainer>
        <FieldLabel>Caseworker Name</FieldLabel>
        <FieldValue>{caseworkerName}</FieldValue>
      </FieldContainer>

      <FieldContainer>
        <FieldLabel>Facility</FieldLabel>
        <FieldValue>{facility}</FieldValue>
      </FieldContainer>

      <Form layout="vertical">
        <Form.Item>
          <Button
            type="primary"
            loading={isExporting}
            onClick={handleExport}
            block
          >
            Export Flagged Forms
          </Button>
        </Form.Item>

        {error && (
          <Alert
            message="Export Error"
            description={error}
            type="error"
            showIcon
            style={{ marginTop: '20px' }}
          />
        )}
      </Form>
    </Wrapper>
  );
};

export default FlaggedRecordForm;
