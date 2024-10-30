import React from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useAppSelector } from '@app/hooks/reduxHooks';
import { BASE_COLORS } from '@app/styles/themes/constants';
import { BaseButton as BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useNavigate } from 'react-router-dom';

export const GitHubButton: React.FC = (props) => {
  const theme = useAppSelector((state) => state.theme.theme);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add any necessary logout logic here
    navigate('/logout');
  };

  return (
    <Button
      type="primary"
      $isDark={theme === 'dark'}
      onClick={handleLogout}
      {...props}
    >
     <LogoutOutlined />
      Logout
    </Button>
  );
};

const Button = styled(BaseButton)<{ $isDark: boolean }>`
  color: ${(props) => BASE_COLORS[props.$isDark ? 'white' : 'black']};
  background: ${(props) => BASE_COLORS[props.$isDark ? 'black' : 'white']};
  border-radius: 50px;
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;

  &:hover,
  &:active,
  &:focus {
    color: ${(props) => BASE_COLORS[props.$isDark ? 'black' : 'white']};
    background: ${(props) => BASE_COLORS[props.$isDark ? 'white' : 'black']};
  }
`;

const GithubIcon = styled(LogoutOutlined)`
  font-size: 1.5rem;
  vertical-align: middle;
`;
