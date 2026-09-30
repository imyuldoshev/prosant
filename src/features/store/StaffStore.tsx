import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type StaffRole = 'admin' | 'xodim';

export interface Staff {
  id: string;
  ism: string;
  telefon: string;
  email: string;
  role: StaffRole;
  faol: boolean;
  qoshilganSana: string;
}

interface StaffState {
  staffList: Staff[];
}

type StaffAction =
  | { type: 'ADD_STAFF'; payload: Staff }
  | { type: 'UPDATE_STAFF'; payload: { id: string; updates: Partial<Staff> } }
  | { type: 'TOGGLE_ACTIVE'; payload: string };

const initialState: StaffState = {
  staffList: [],
};

const staffReducer = (state: StaffState, action: StaffAction): StaffState => {
  switch (action.type) {
    case 'ADD_STAFF':
      return { ...state, staffList: [...state.staffList, action.payload] };
    case 'UPDATE_STAFF':
      return {
        ...state,
        staffList: state.staffList.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      };
    case 'TOGGLE_ACTIVE':
      return {
        ...state,
        staffList: state.staffList.map((s) =>
          s.id === action.payload ? { ...s, faol: !s.faol } : s
        ),
      };
    default:
      return state;
  }
};

interface StaffContextType {
  state: StaffState;
  addStaff: (staff: Staff) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  toggleActive: (id: string) => void;
  resetPassword: (id: string) => string;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(staffReducer, initialState);

  const addStaff = (staff: Staff) => {
    dispatch({ type: 'ADD_STAFF', payload: staff });
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    dispatch({ type: 'UPDATE_STAFF', payload: { id, updates } });
  };

  const toggleActive = (id: string) => {
    dispatch({ type: 'TOGGLE_ACTIVE', payload: id });
  };

  const resetPassword = (id: string) => {
    // Generate a random 8-character password
    return Math.random().toString(36).slice(-8);
  };

  return (
    <StaffContext.Provider
      value={{ state, addStaff, updateStaff, toggleActive, resetPassword }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaffStore = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaffStore must be used within a StaffProvider');
  }
  return context;
};
