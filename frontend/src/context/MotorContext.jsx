import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const MotorContext = createContext(null);

export function MotorProvider({ children }) {
  const [motorTypes, setMotorTypes] = useState([]);
  const [selectedMotor, setSelectedMotorState] = useState(() => {
    try {
      const saved = localStorage.getItem('pepso_my_motor');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    api.get('/motor-types')
      .then((res) => {
        if (isMounted && res?.data) {
          setMotorTypes(res.data);
        }
      })
      .catch(() => {
        // Fallback default jika backend belum jalan
      });
    return () => { isMounted = false; };
  }, []);

  const selectMotor = (motor) => {
    setSelectedMotorState(motor);
    if (motor) {
      localStorage.setItem('pepso_my_motor', JSON.stringify(motor));
    } else {
      localStorage.removeItem('pepso_my_motor');
    }
  };

  return (
    <MotorContext.Provider value={{ motorTypes, selectedMotor, selectMotor, setMotorTypes }}>
      {children}
    </MotorContext.Provider>
  );
}

export function useMotor() {
  const ctx = useContext(MotorContext);
  if (!ctx) throw new Error('useMotor must be used within MotorProvider');
  return ctx;
}

