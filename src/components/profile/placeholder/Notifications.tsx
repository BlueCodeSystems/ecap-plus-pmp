import React from 'react';
import { Card, Result } from 'antd';

export const Notifications: React.FC = () => (
  <Card>
    <Result
      status="info"
      title="Notification Settings Coming Soon"
      subTitle="This feature is currently under development."
    />
  </Card>
);
