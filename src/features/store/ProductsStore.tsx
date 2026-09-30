import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, Movement } from '../../types';


type State = {
  products: Product[];
  categories: string[];
};

type Action =
  | { type: 'DECREASE_STOCK'; payload: { productId: string; amount: number } }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Partial<Product> & { id: string } }
  | { type: 'ADD_STOCK_ARRIVAL'; payload: { productId: string; movement: Movement; newTannarx?: number } }
  | { type: 'ADD_CATEGORY'; payload: string };

const initialCategories: string[] = [];

const initialState: State = {
  products: [],
  categories: initialCategories,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'DECREASE_STOCK':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, joriyQoldiq: Math.max(0, p.joriyQoldiq - action.payload.amount) }
            : p
        ),
      };
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [action.payload, ...state.products],
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case 'ADD_STOCK_ARRIVAL':
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id === action.payload.productId) {
            const currentMovements = p.movements || [];
            return {
              ...p,
              joriyQoldiq: p.joriyQoldiq + action.payload.movement.miqdor,
              oxirgiKirimSana: action.payload.movement.sana,
              tannarx: action.payload.newTannarx !== undefined ? action.payload.newTannarx : p.tannarx,
              movements: [action.payload.movement, ...currentMovements],
            };
          }
          return p;
        }),
      };
    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) return state;
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    default:
      return state;
  }
}

const ProductsContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ProductsContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProductsStore = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProductsStore must be used within a ProductsProvider');
  }
  return context;
};
