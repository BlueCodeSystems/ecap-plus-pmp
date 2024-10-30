import React from 'react';
import { NotificationsDropdown } from '../components/notificationsDropdown/NotificationsDropdown';
import { ProfileDropdown } from '../components/profileDropdown/ProfileDropdown/ProfileDropdown';
import { HeaderSearch } from '../components/HeaderSearch/HeaderSearch';
import { SettingsDropdown } from '../components/settingsDropdown/SettingsDropdown';
import { HeaderFullscreen } from '../components/HeaderFullscreen/HeaderFullscreen';
import * as S from '../Header.styles';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import { useNavigate } from 'react-router-dom';
import { LogoutOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface DesktopHeaderProps {
  isTwoColumnsLayout: boolean;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ isTwoColumnsLayout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add any necessary logout logic here
    navigate('/logout');
  };

  const leftSide = isTwoColumnsLayout ? (
    <S.SearchColumn xl={16} xxl={17}>
      <BaseRow justify="space-between">
        <BaseCol xl={15} xxl={12}>
          <HeaderSearch />
        </BaseCol>
      </BaseRow>
    </S.SearchColumn>
  ) : (
    <>
      <BaseCol lg={10} xxl={8}>
        <HeaderSearch />
      </BaseCol>
      {/* <BaseCol>
        <Button
          type="primary"
          onClick={handleLogout}
          style={{ borderRadius: '50px', display: 'flex', alignItems: 'center' }}
        >
          <LogoutOutlined />
          Logout
        </Button>
      </BaseCol> */}
    </>
  );

  return (
    <BaseRow justify="space-between" align="middle">
      {leftSide}

      <S.ProfileColumn xl={8} xxl={7} $isTwoColumnsLayout={isTwoColumnsLayout}>
        <BaseRow align="middle" justify="end" gutter={[5, 5]}>
          <BaseCol>
            <BaseRow gutter={[{ xxl: 5 }, { xxl: 5 }]}>
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
              <BaseCol>
                <HeaderFullscreen />
              </BaseCol>
              <BaseCol>
                <NotificationsDropdown />
              </BaseCol>
              <BaseCol>
                <SettingsDropdown />
              </BaseCol>
            </BaseRow>
          </BaseCol>
          <BaseCol>
            <ProfileDropdown />
          </BaseCol>
        </BaseRow>
      </S.ProfileColumn>
    </BaseRow>
  );
};
