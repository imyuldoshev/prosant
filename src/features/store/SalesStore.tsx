import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SaleEntry } from '../sales/mockData';

type State = {
  sales: SaleEntry[];
};

type Action =
  | { type: 'ADD_SALE'; payload: SaleEntry }
  | { type: 'ADD_SALES'; payload: SaleEntry[] };

const initialState: State = {
  sales: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'ADD_SALES':
      return { ...state, sales: [...state.sales, ...action.payload] };
    default:
      return state;
  }
}

const SalesContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <SalesContext.Provider value={{ state, dispatch }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSalesStore = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSalesStore must be used within a SalesProvider');
  }
  return context;
};
