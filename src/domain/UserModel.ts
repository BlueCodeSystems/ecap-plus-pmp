export interface UserModel {
  [x: string]: string;
  // id: number;
  first_name: string;
  last_name: string;
  location: string;
  imgUrl: string;
  userName: string;

  sex: 'male' | 'female';
  birthday: string;
  lang: 'en' | 'de';
  country: string;
  city: string;
  address1: string;
}
