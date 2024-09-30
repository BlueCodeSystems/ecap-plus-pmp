import React, { useState, useEffect, useCallback } from 'react';
import { BaseTable } from '@app/components/common/BaseTable/BaseTable';
import { BasicTableRow, Pagination } from 'api/table.api';
import { BaseButton } from '@app/components/common/BaseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import { BaseForm } from '@app/components/common/forms/BaseForm/BaseForm';
import { BaseSpace } from '@app/components/common/BaseSpace/BaseSpace';
import axios from 'axios';
import moment from 'moment';

interface Household {

  household_id: string;
  province: string;
  district: string;
  cwac: string;
  provider_name: string;
  caregiver_name: string;
  date_created: string;
  last_interacted_with: string;

  year: number;
  village: string;
  ward: string;
  cwac_member_name: string;

}

const initialPagination: Pagination = {
  current: 1,
  pageSize: 4,
};

export const EditableTableModule: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [form] = BaseForm.useForm();
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://ecapplus.server.dqa.bluecodeltd.com/household/all-households/`);
        setHouseholds(response.data.data);
      } catch (error) {
        console.error('Error fetching households data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const mappedData = households.map((household, index) => ({
      key: index, // Assigning index as the key
      household_id: household.household_id, // Add household_id
      name: household.caregiver_name,
      cwac_member_name: household.cwac_member_name, // Add cwac_member_name
      age: household.year, // Assuming "year" represents age
      address:
      `Province: ${household.province}, 
       District: ${household.district},
       CWAC Name: ${household.cwac}, 
       Date Case Created: ${household.date_created}, 
       Date Last Visited: ${moment(household.last_interacted_with).format('DD/MM/YYYY')}`, 
    }));

    setTableData({ data: mappedData, pagination: initialPagination, loading: false });
  }, [households]);

  const fetch = useCallback(
    (pagination: Pagination) => {
      setTableData((tableData) => ({ ...tableData, loading: true }));
      // Implement getEditableTableData function as per your API structure
    },
    []
  );

  useEffect(() => {
    fetch(initialPagination);
  }, [fetch]);

  const handleTableChange = (pagination: Pagination) => {
    fetch(pagination);
  };

  const columns = [
    {
      title: t('Household ID'),
      dataIndex: 'household_id',
      width: '25%',
    },
    {
      title: t('Caregiver Name'),
      dataIndex: 'name',
      width: '25%',
    },
      {
      title: t('Household Details'),
      dataIndex: 'address',
      width: '25%',
    },
    {
      title: t('CWAC Member Name'),
      dataIndex: 'cwac_member_name',
      width: '25%',
    },
    {
      title: t('tables.actions'),
      dataIndex: 'actions',
      width: '15%',
      render: (text: string, record: BasicTableRow) => {
        return (
          <BaseSpace>
            <BaseButton type="primary" onClick={() => handleView(record)}>
              {t('View')}
            </BaseButton>
          </BaseSpace>
        );
      },
    },
  ];

  const handleView = (record: BasicTableRow) => {
    // Handle view action here
  };

  return (
    <BaseForm form={form} component={false}>
      <BaseTable
        bordered
        dataSource={tableData.data}
        columns={columns}
        rowClassName="editable-row"
        pagination={tableData.pagination}
        onChange={handleTableChange}
        loading={tableData.loading}
        scroll={{ x: 800 }}
      />
    </BaseForm>
  );
};