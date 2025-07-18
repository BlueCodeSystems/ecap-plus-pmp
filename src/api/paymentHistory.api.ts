import { CurrencyTypeEnum } from '@app/interfaces/interfaces';
import { Key } from 'antd/es/table/interface';

export interface Payment {
  unique_id: Key | null | undefined;
  provider_id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  province: string;
  district: string;
  cwac: string;
  date_created: string;
  disability: string;
  relationship: string;
  other_relationship: string;
  is_index: string;
  household_id: string;
  ward: string;
  year: number;
  id: number;
  recipient: string;
  date: number;
  status: number;
  amount: number;
  currency: CurrencyTypeEnum;
  imgUrl: string;
}

export const getPaymentHistory = (): Promise<Payment[]> => {
  return new Promise((res) => {
    setTimeout(() => {
      res([
        // {
        //   id: 1,
        //   recipient: 'IBM Transactions',
        //   date: 1626037200000,
        //   status: 1,
        //   amount: 500,
        //   currency: CurrencyTypeEnum.USD,
        //   imgUrl: 'https://res.cloudinary.com/lapkinthegod/image/upload/v1632988451/Ellipse_72_hwxejr.png',
        // },
        // {
        //   id: 2,
        //   recipient: 'Citigroup',
        //   date: 1630443600000,
        //   status: 2,
        //   amount: 40,
        //   currency: CurrencyTypeEnum.USD,
        //   imgUrl: 'https://res.cloudinary.com/lapkinthegod/image/upload/v1632988456/Ellipse_73_zanfs3.png',
        // },
        // {
        //   id: 3,
        //   recipient: 'Netflix',
        //   date: 1628370000000,
        //   status: 3,
        //   amount: 1200,
        //   currency: CurrencyTypeEnum.USD,
        //   imgUrl: 'https://res.cloudinary.com/lapkinthegod/image/upload/v1632988460/Ellipse_73_1_hhfpzj.png',
        // },
        // {
        //   id: 4,
        //   recipient: 'IBM Transactions',
        //   date: 1622667600000,
        //   status: 4,
        //   amount: 190,
        //   currency: CurrencyTypeEnum.USD,
        //   imgUrl: 'https://res.cloudinary.com/lapkinthegod/image/upload/v1632988451/Ellipse_72_hwxejr.png',
        // },
      ]);
    }, 0);
  });
};
