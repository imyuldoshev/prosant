import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Payment {
  id: string;
  summa: number;
  sana: string;
}

export interface Debt {
  id: string;
  mijozIsm: string;
  telefon: string;
  jamiSumma: number;
  tolanganSumma: number;
  berilganSana: string;
  muddat: string;
  izoh?: string;
  tolovlar: Payment[];
}

const mockDebts: Debt[] = [
  { id: 'd1', mijozIsm: 'Ali Valiyev', telefon: '+998901234567', jamiSumma: 500000, tolanganSumma: 100000, berilganSana: '2026-09-01T10:00:00.000Z', muddat: '2026-09-15T10:00:00.000Z', tolovlar: [{ id: 'p1', summa: 100000, sana: '2026-09-05T10:00:00.000Z' }] }, // overdue
  { id: 'd2', mijozIsm: 'Sardor', telefon: '+998931112233', jamiSumma: 1200000, tolanganSumma: 0, berilganSana: '2026-09-25T10:00:00.000Z', muddat: '2026-09-30T10:00:00.000Z', tolovlar: [] }, // tomorrow
  { id: 'd3', mijozIsm: 'Murod', telefon: '+998991234567', jamiSumma: 300000, tolanganSumma: 0, berilganSana: '2026-09-29T10:00:00.000Z', muddat: '2026-10-09T10:00:00.000Z', tolovlar: [] }, // in 10 days
  { id: 'd4', mijozIsm: 'Olim', telefon: '+998971112233', jamiSumma: 800000, tolanganSumma: 800000, berilganSana: '2026-09-10T10:00:00.000Z', muddat: '2026-09-20T10:00:00.000Z', tolovlar: [{ id: 'p2', summa: 800000, sana: '2026-09-15T10:00:00.000Z' }] }, // fully paid
  { id: 'd5', mijozIsm: 'Dilshod', telefon: '+998941234567', jamiSumma: 2000000, tolanganSumma: 500000, berilganSana: '2026-09-15T10:00:00.000Z', muddat: '2026-10-15T10:00:00.000Z', tolovlar: [{ id: 'p3', summa: 500000, sana: '2026-09-25T10:00:00.000Z' }] }, // partially paid
  { id: 'd6', mijozIsm: 'Jamshid', telefon: '+998911112233', jamiSumma: 150000, tolanganSumma: 0, berilganSana: '2026-09-20T10:00:00.000Z', muddat: '2026-10-05T10:00:00.000Z', tolovlar: [] },
];

type State = {
  debts: Debt[];
};

type Action =
  | { type: 'ADD_DEBT'; payload: Omit<Debt, 'id' | 'tolovlar'> }
  | { type: 'ADD_PAYMENT'; payload: { debtId: string; payment: Omit<Payment, 'id'> } };

const initialState: State = {
  debts: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_DEBT': {
      const newDebt: Debt = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        tolovlar: [],
      };
      return { ...state, debts: [newDebt, ...state.debts] };
    }
    case 'ADD_PAYMENT': {
      return {
        ...state,
        debts: state.debts.map(d => {
          if (d.id === action.payload.debtId) {
            const newPayment: Payment = {
              ...action.payload.payment,
              id: Math.random().toString(36).substr(2, 9),
            };
            return {
              ...d,
              tolanganSumma: d.tolanganSumma + newPayment.summa,
              tolovlar: [...d.tolovlar, newPayment],
            };
          }
          return d;
        }),
      };
    }
    default:
      return state;
  }
}

const DebtsContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const DebtsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <DebtsContext.Provider value={{ state, dispatch }}>
      {children}
    </DebtsContext.Provider>
  );
};

export const useDebtsStore = () => {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error('useDebtsStore must be used within a DebtsProvider');
  }
  return context;
};
