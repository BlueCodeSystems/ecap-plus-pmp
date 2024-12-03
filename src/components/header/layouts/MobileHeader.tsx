import React from 'react';
import { NotificationsDropdown } from '../components/notificationsDropdown/NotificationsDropdown';
import { ProfileDropdown } from '../components/profileDropdown/ProfileDropdown/ProfileDropdown';
import { HeaderSearch } from '../components/HeaderSearch/HeaderSearch';
import { SettingsDropdown } from '../components/settingsDropdown/SettingsDropdown';
import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import * as S from '../Header.styles';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  toggleSider: () => void;
  isSiderOpened: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSider, isSiderOpened }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add any necessary logout logic here
    navigate('/logout');
  };

  return (
    <BaseRow justify="space-between" align="middle">
      <BaseCol>
        <ProfileDropdown />
      </BaseCol>

      <BaseCol>
        <BaseRow align="middle">
          {/* <BaseCol>
            <NotificationsDropdown />
          </BaseCol> */}

          <BaseCol>
            <HeaderSearch />
          </BaseCol>

          <BaseCol>
            <SettingsDropdown />
          </BaseCol>

          <BaseCol>
            <Button
              type="primary"
              onClick={handleLogout}
              style={{ borderRadius: '50px', display: 'flex', alignItems: 'center' }}
            >
              <LogoutOutlined />
              Logout
            </Button>
          </BaseCol>
        </BaseRow>
      </BaseCol>

      <S.BurgerCol>
        <S.MobileBurger onClick={toggleSider} isCross={isSiderOpened} />
      </S.BurgerCol>
    </BaseRow>
  );
};
