import React, { useState } from 'react';
import { SmileOutlined, UserOutlined } from '@ant-design/icons';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { AddUserFormModal } from './AddUserFormModal';
import { BaseInput } from '../../common/inputs/BaseInput/BaseInput';
import { BaseButton } from '../../common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import * as S from './ControlForm.styles';
import { notificationController } from '@app/controllers/notificationController';
import { BaseAvatar } from '@app/components/common/BaseAvatar/BaseAvatar';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

interface UserType {
  name: string;
  age: string;
}

export const ControlForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isFieldsChanged, setFieldsChanged] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const { t } = useTranslation();

  const showUserModal = () => {
    setOpen(true);
  };

  const hideUserModal = () => {
    setOpen(false);
  };

  const onFinish = (values = {}) => {
    setLoading(true);
    setTimeout(() => {
      setFieldsChanged(false);
      setLoading(false);
      notificationController.success({ message: t('common.success') });
      console.log(values);
    }, 1000);
  };

  return (
    <BaseButtonsForm.Provider
      onFormFinish={(name, { values, forms }) => {
        if (name === 'userForm') {
          const { controlForm } = forms;
          const users = controlForm.getFieldValue('users') || [];
          controlForm.setFieldsValue({ users: [...users, values] });
          setOpen(false);
        }
      }}
    >
      <BaseButtonsForm
        {...layout}
        name="controlForm"
        isFieldsChanged={isFieldsChanged}
        footer={
          <BaseButtonsForm.Item>
            <BaseButton htmlType="submit" type="primary" loading={isLoading}>
              {t('common.submit')}
            </BaseButton>
            <S.AddUserButton type="default" htmlType="button" onClick={showUserModal}>
              {t('forms.controlFormLabels.addUser')}
            </S.AddUserButton>
          </BaseButtonsForm.Item>
        }
        onFinish={onFinish}
        onFieldsChange={() => setFieldsChanged(true)}
      >
        <BaseButtonsForm.Item
          name="group"
          label={t('forms.controlFormLabels.groupName')}
          rules={[{ required: true, message: t('forms.controlFormLabels.groupNameError') }]}
        >
          <BaseInput />
        </BaseButtonsForm.Item>
        <S.UserList
          label={t('forms.controlFormLabels.userList')}
          // eslint-disable-next-line
          shouldUpdate={(prevValues: any, curValues: any) => prevValues.users !== curValues.users}
        >
          {({ getFieldValue }) => {
            const users: UserType[] = getFieldValue('users') || [];
            return users.length ? (
              <S.List>
                {users.map((user, index) => (
                  <S.ListItem key={index}>
                    <BaseAvatar icon={<UserOutlined />} />
                    <S.User>
                      {user.name} - {user.age}
                    </S.User>
                  </S.ListItem>
                ))}
              </S.List>
            ) : (
              <S.Text>
                ( <SmileOutlined /> {t('forms.controlFormLabels.noUser')} )
              </S.Text>
            );
          }}
        </S.UserList>
      </BaseButtonsForm>
      <AddUserFormModal open={open} onCancel={hideUserModal} />
    </BaseButtonsForm.Provider>
  );
};

export default ControlForm;
