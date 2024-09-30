import React from 'react';
import { useAppSelector } from '@app/hooks/reduxHooks';
import * as S from './TopUpBalanceButton.styles';
import { Progress } from 'antd';

interface TopUpBalanceButtonProps {
  onClick: () => void;
  count: number;
}

export const TopUpBalanceButton: React.FC<TopUpBalanceButtonProps> = ({ onClick, count }) => {
  const { theme } = useAppSelector((state) => state.theme);

  return (
    <S.TopUpButton type={theme === 'dark' ? 'primary' : 'primary'} block onClick={onClick}>
      {count > 0 ? `${count}` : <Progress />}
    </S.TopUpButton>
  );
};
