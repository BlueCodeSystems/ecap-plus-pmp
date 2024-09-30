import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import axios from 'axios';
import { Button, Space, Tooltip, Spin, message, Modal, Form, Input, Popconfirm, Divider, Alert, Tabs, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import * as S from '@app/components/common/inputs/SearchInput/SearchInput.styles';
import TabPane from 'antd/lib/tabs/TabPane';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  location: string;
  title: string;
  last_access: string;
  last_page: string;
  email: string;
  status: string;
  description: string;
  role: string;
}

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  app_access: boolean;
  users: string[];
}

export const UserManagementTreeTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setUsers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const fetchCurrentUserRole = async () => {
    try {
      const roleId = 'ad9d1ebb-f16c-4743-af1b-a1379c3d3e91'; // Adjust role ID if necessary
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setCurrentUserRole(response.data.data);
      console.log("roles id::", response.data.data);
    } catch (error) {
      console.error('Error fetching current user role:', error);
    }
  };

  const createUser = async (newUser: any) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/users`, newUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setUsers(prevUsers => [...prevUsers, response.data]);
      message.success('User created successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Failed to create user');
    }
  };

  const editUser = async (userId: string, updatedUser: Partial<User>) => {
    try {
      const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/users/${userId}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setUsers(users.map(user => user.id === userId ? { ...user, ...updatedUser } : user));
      message.success('User updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setUsers(users.filter(user => user.id !== userId));
      message.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingUser(null);
    form.resetFields(); // Reset form fields when opening modal
  };

  const showEditModal = (user: User) => {
    setIsModalVisible(true);
    setEditingUser(user);
    form.setFieldsValue(user); // Populate form fields with user data
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await editUser(editingUser.id, values);
      } else {
        await createUser(values);
      }
      form.resetFields();
      fetchUsers(); // Refresh user list after successful operation
    } catch (error) {
      console.error('Failed to create or update user:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields(); // Reset form fields on cancel
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      width: '25%',
    },
    {
      title: 'Province',
      dataIndex: 'title',
      width: '25%',
    },
    {
      title: 'District',
      dataIndex: 'location',
      width: '25%',
    },
    // {
    //   title: 'Department',
    //   dataIndex: 'description',
    //   width: '25%',
    // },
    {
      title: 'Last Accessed PMP',
      dataIndex: 'last_access',
      width: '25%',
    },
    {
      title: 'Last Page',
      dataIndex: 'last_page',
      width: '25%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '25%',
      render: (status: string) => {
        let color = '';
        let text = '';
  
        switch (status.toLowerCase()) {
          case 'active':
            color = '#198754';
            text = 'Active';
            break;
          case 'inactive':
            color = '#ffc107';
            text = 'Inactive';
            break;
          case 'suspended':
            color = '#dc3545';
            text = 'Suspended';
            break;
          default:
            color = 'default';
            text = status;
        }
  
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: User) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="primary" onClick={() => showEditModal(record)}>Edit</Button>
          </Tooltip>
          <Popconfirm
            title="Are you sure delete this user?"
            onConfirm={() => deleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="ghost" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const navigateToHQFeedback = () => {
    navigate('/hq-province-supervisory-tools-feedback-dashboard');
  };

  return (
    <>
      <Tabs defaultActiveKey="1">
        <TabPane tab="User Management" key="1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Button
              onClick={showModal}
              style={{ fontSize: '16px', cursor: 'pointer' }}
              title="Add New User"
              type='primary'
              icon={<PlusOutlined />}
            >
              Add New User
            </Button>
            <Space>
              <S.SearchInput
                placeholder="Search for a user"
                onChange={(e) => handleSearch(e.target.value)}
                value={searchText}
              />
              {searchText && (
                // Add clear search functionality if needed
                ''
              )}
            </Space>
          </div>
          <Divider />
          <Spin spinning={loading}>
            <BaseTable
              bordered
              dataSource={users.filter(user =>
                (user.first_name && user.first_name.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.last_name && user.last_name.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.location && user.location.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.description && user.description.toLowerCase().includes(searchText.toLowerCase()))
              )}
              columns={columns}
              rowClassName="editable-row"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Spin>
        </TabPane>
      </Tabs>

      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingUser ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          name="user_form"
        >
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true, message: 'Please input the first name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[{ required: true, message: 'Please input the last name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please input the email!' }, { type: 'email', message: 'The input is not valid E-mail!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="Province"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="location"
            label="District"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Department"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}  