import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface AppNotification {
  id: string;
  type: 'product_added' | 'sale_made' | 'debt_paid' | 'info';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  metadata?: any;
}

type State = {
  notifications: AppNotification[];
};

type Action =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppNotification, 'id' | 'isRead'> }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' };

const initialState: State = {
  notifications: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          {
            ...action.payload,
            id: `notif_${Date.now()}_${Math.random()}`,
            isRead: false,
          },
          ...state.notifications,
        ],
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      };
    default:
      return state;
  }
}

const NotificationsContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <NotificationsContext.Provider value={{ state, dispatch }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsStore = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsStore must be used within a NotificationsProvider');
  }
  return context;
};
