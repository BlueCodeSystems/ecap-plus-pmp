import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton, Typography, Alert, Row, Col, Button } from 'antd';
import { BaseCard } from '@app/components/common/BaseCard/BaseCard';
import styled from 'styled-components';
import axios from 'axios';

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
  margin-right: 20px;
  color: #333;
`;

const Wrapper = styled.div`
  width: 100%;
`;

const Title = styled(Typography.Title)`
  font-size: 22px;
  color: #004080;
`;

const Subtitle = styled(Typography.Text)`
  font-size: 16px;
  color: #004080;
`;

const ListItemWrapper = styled(Row)`
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid #e8e8e8;
  align-items: center;
`;

interface Household {
  firstname: string;
  lastname: string;
  birthdate: string;
  vca_gender: string;
  province: string;
  district: string;
  cwac: string;
  date_created: string;
  disability: string;
  relation: string;
  other_relationship: string | null;
  is_index: string | number;
  uid: string;
  household_id: string;
  ward: string;
  year: number;
}

interface Member {
  uid: string;
  firstname: string;
  lastname: string;
  birthdate: string;
  vca_gender: string;
  disability: string;
  relation: string;
}

export const HouseholdMembersInfo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const household: Household | undefined = location.state?.household;

  const [isLoading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (household && household.household_id) {
      setLoading(true);
      axios
        .get(`https://ecapplus.server.dqa.bluecodeltd.com/household/members/${household.household_id}`)
        .then((response) => {
          const fetchedMembers = response.data.data;
          setMembers(fetchedMembers);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'An error occurred while fetching members.');
          setLoading(false);
        });
    }
  }, [household]);

  const handleViewProfile = (uid: string) => {
    const member = members && members?.find((m) => String(m?.uid) === String(uid));
  
    if (member) {
      localStorage && localStorage?.setItem('selectedVCA', JSON?.stringify(member)); 
      navigate(`/profile/vca-profile/${uid}`, { state: { vca: member } });
    } else {
      console.error('Member not found with the given uid:', uid);
      setError('Member not found.');
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Alert
          message={`We encountered an error: ${error}. Refresh the page to see if the issue persists.`}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Wrapper>
      {household ? (
        <>
          <Title>Family Members</Title>
          <Subtitle>This section lists all family members in the household.</Subtitle>
          <br />
          <br />
          <BaseCard>
            {members.map((member) => (
              <ListItemWrapper key={member.uid} gutter={[16, 16]}>
                <Col span={8}>
                  <InfoValue>
                    {member?.uid} - {member?.firstname} {member?.lastname}
                  </InfoValue>
                </Col>
                <Col span={12}>
                  <Row>
                    <Col span={24}>
                      <InfoValue>Birthdate: {member?.birthdate}</InfoValue>
                    </Col>
                    <Col span={24}>
                      <InfoValue>Gender: {member?.vca_gender}</InfoValue>
                    </Col>
                    <Col span={24}>
                      <InfoValue>Disability: {member?.disability}</InfoValue>
                    </Col>
                    <Col span={24}>
                      <InfoValue>Relationship: {member?.relation}</InfoValue>
                    </Col>
                  </Row>
                </Col>
                <Col span={4}>
                  <Button 
                    type="primary" 
                    onClick={() => handleViewProfile(member.uid)}
                  >
                    View Profile
                  </Button>
                </Col>
              </ListItemWrapper>
            ))}
          </BaseCard>
        </>
      ) : (
        <Alert
          message="No household data available."
          type="warning"
          showIcon
        />
      )}
    </Wrapper>
  );
};