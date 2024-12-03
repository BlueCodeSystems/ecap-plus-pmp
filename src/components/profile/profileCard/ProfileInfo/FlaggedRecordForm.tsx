import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert } from 'antd';
import styled from 'styled-components';
import axios from 'axios';
import { notificationController } from '@app/controllers/notificationController';

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
  const caseworkerName = location?.state?.household?.caseworker_name || 'Not Available';
  const facility = location?.state?.household?.facility || 'Not Available';

  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data...');
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        console.log('User data fetched successfully:', response.data.data);
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (values: { comment: string }) => {
    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting comment...');
      console.log('Form values:', values);

      const token = localStorage.getItem('access_token');
      console.log('Access token:', token);

      if (!token) {
        throw new Error('Access token is missing!');
      }

      const verifier = user ? `${user.first_name} ${user.last_name}` : 'Unknown Verifier';
      console.log('Verifier:', verifier);

      const payload = {
        household_id: householdId,
        vca_id: vcaId,
        caseworker_phone: caseworkerPhone,
        caseworker_name: caseworkerName,
        facility,
        comment: values.comment,
        verifier,
      };
      console.log('Payload:', payload);

      const response = await axios.post(
        `${apiUrl}/${collectionName}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Comment submitted successfully:', response.data);

      // Show success notification
      notificationController.success({
        message: 'Comment Submitted',
        description: 'Your comment has been successfully posted.',
      });

      // Wait for the notification to disappear (e.g., 3 seconds)
      setTimeout(() => {
        navigate('/flagged-records', { state: { householdId } });
      }, 3000);
    } catch (err: any) {
      console.error('Failed to submit the comment:', err);
      setError(err.response?.data?.message || 'Failed to submit the comment to the server. Please try again later.');
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
      </Form>
    </Wrapper>
  );
};

export default FlaggedRecordForm;
