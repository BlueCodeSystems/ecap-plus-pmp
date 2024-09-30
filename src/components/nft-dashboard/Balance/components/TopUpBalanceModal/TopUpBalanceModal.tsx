import React, { useState, useEffect } from 'react';
import { BaseModal } from '@app/components/common/BaseModal/BaseModal';
import { TopUpDataProps } from '../../interfaces/interfaces';
import { Spin, Typography } from 'antd';

interface TopUpBalanceModalProps extends TopUpDataProps {
  isOpen: boolean;
  onOpenChange: () => void;
  count: number;
}

export const TopUpBalanceModal: React.FC<TopUpBalanceModalProps> = ({
  isOpen,
  onOpenChange,
  count,
}) => {
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    // Simulate delay before showing the count
    const timer = setTimeout(() => {
      setShowCount(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BaseModal width={500} open={isOpen} onCancel={onOpenChange} footer={null} destroyOnClose>
      <Spin spinning={!showCount}>

        {showCount && <Typography style={{ textAlign: "center", fontWeight: "bold" }}>Count: {count}</Typography>}

      </Spin>
    </BaseModal>
  );
};
