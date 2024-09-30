export interface Doctor {
  id: number;
  name: string;
}

export const getDoctorsData = (): Promise<Doctor[]> => {
  return new Promise((res) => {
    setTimeout(() => {
      res([
        {
          id: 1,
          name: 'Legislation and Guidelines',
        },
        {
          id: 2,
          name: 'Practice and Processes',
        },
        {
          id: 3,
          name: 'Capacity and Knowledge',
        },
        {
          id: 4,
          name: 'Supervision and Mentorship',
        },
        {
          id: 5,
          name: 'Coordination and Referral',
        },
        {
          id: 6,
          name: 'Data Management',
        },
        {
          id: 7,
          name: 'Reporting',
        }
      ]);
    }, 0);
  });
};
