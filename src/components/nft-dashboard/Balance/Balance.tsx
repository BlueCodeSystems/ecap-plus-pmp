import React, { useState } from 'react';
import { NFTCard } from '@app/components/nft-dashboard/common/NFTCard/NFTCard';
import { TopUpBalanceButton } from './components/TopUpBalanceButton/TopUpBalanceButton';
import { BaseRow } from '@app/components/common/BaseRow/BaseRow';
import { BaseCol } from '@app/components/common/BaseCol/BaseCol';
import * as S from './Balance.styles';

interface BalanceProps {
  title: string;
  count: number;
}

export const Balance: React.FC<BalanceProps> = ({
  title,
  count,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleModal = () => setModalOpen((open) => !open);

  return (
    <BaseRow>
      <BaseCol span={24}>
        <NFTCard isSider>
          <BaseRow gutter={[30, 30]}>
            <BaseCol span={24}>
              <BaseRow gutter={[14, 14]}>
                <BaseCol span={24}>
                  <S.TitleBalanceText level={5} style={{ textAlign: "center" }}>
                    {title}
                  </S.TitleBalanceText>
                </BaseCol>
              </BaseRow>
            </BaseCol>

            <BaseCol span={24}>
              <TopUpBalanceButton onClick={handleModal} count={count} />
            </BaseCol>
          </BaseRow>
        </NFTCard>
      </BaseCol>
    </BaseRow>
  );
};
