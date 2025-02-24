/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, message } from 'antd';
import styled from 'styled-components';
import axios from 'axios';
import { notificationController } from '@app/controllers/notificationController';
import { Name } from '@app/components/auth/LockForm/LockForm.styles';
import layout from 'antd/lib/layout';

const { Title } = Typography;
const { TextArea } = Input;

interface User {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  location: string;
  title: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  last_access: string;
  last_page: string;
  email: string;
  role: string;
}

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
  const vcaId = location?.state?.household?.vca_id || 'Not Available';
  const caseworkerPhone = location?.state?.household?.caseworker_phone || 'Not Available';
  const caregiverName = location?.state?.household?.caregiver_name || 'Not Available';
  const caseworkerName = location?.state?.household?.caseworker_name || 'Not Available';
  const facility = location?.state?.household?.facility || 'Not Available';

  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [isExporting, setExporting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Access token is missing!');

      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/items/${collectionName}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'flagged_forms_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      notificationController.success({
        message: 'Export Successful',
        description: 'The flagged forms have been successfully exported.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      notificationController.error({
        message: 'Export Failed',
        description: 'An error occurred while exporting flagged forms.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (values: { comment: string }) => {
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Access token is missing!');

      const verifier = user ? `${user.first_name} ${user.last_name}` : 'Unknown Verifier';
      const payload = {
        household_id: householdId,
        vca_id: vcaId,
        caseworker_phone: caseworkerPhone,
        caseworker_name: caseworkerName,
        caregiver_name: caregiverName,
        facility,
        comment: values.comment,
        verifier,
      };

      await axios.post(`${apiUrl}/${collectionName}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      notificationController.success({
        message: 'Comment Submitted',
        description: 'Your comment has been successfully posted.',
      });

      setTimeout(() => {
        navigate('/flagged-records', { state: { householdId } });
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit the comment to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '30px' }}>
        Add a Comment for the caseworker for this household
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

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="comment"
          label="Add a Comment"
          rules={[{ required: true, message: 'Please enter a comment!' }]}
        >
          <TextArea rows={4} placeholder="Enter your comment here..." />
        </Form.Item>

        {error && (
          <Alert
            message="Submission Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isSubmitting} block>
            Submit Comment
          </Button>
        </Form.Item>
        {/********
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
        ******/}
      </Form>
    </Wrapper>
  );
};

export default FlaggedRecordForm;
