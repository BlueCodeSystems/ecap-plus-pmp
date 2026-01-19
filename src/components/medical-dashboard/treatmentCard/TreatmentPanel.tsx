import React, { useEffect, useState } from 'react';
import { CalendarEvent } from '@app/api/calendar.api';
import { Doctor, getDoctorsData } from '@app/api/doctors.api';
import { TreatmentDoctor } from './TreatmentDoctor/TreatmentDoctor';
import { TreatmentNotFound } from './TreatmentNotFound/TreatmentNotFound';

interface TreatmentPanelProps {
  event?: CalendarEvent;
}

export const TreatmentPanel: React.FC<TreatmentPanelProps> = ({ event }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (event) {
      getDoctorsData().then((doctors) => {
        const foundDoctor = doctors.find((d) => d.id === event.doctor);
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          setDoctor(null);
        }
      });
    } else {
      setDoctor(null);
    }
  }, [event]);

  if (!event || !doctor) {
    return <TreatmentNotFound />;
  }

  // Map Doctor to TreatmentDoctor props
  const doctorForComponent = {
    name: doctor.name,
    imgUrl: doctor.imgUrl || '',
    speciality: doctor.specifity,
    date: event.date,
    address: 'District Hospital', // Mock address
    phone: '+123456789', // Mock phone
  };

  return <TreatmentDoctor doctor={doctorForComponent} />;
};
