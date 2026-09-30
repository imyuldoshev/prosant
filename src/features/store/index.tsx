import React, { ReactNode } from 'react';
import { ProductsProvider } from './ProductsStore';
import { SalesProvider } from './SalesStore';
import { DebtsProvider } from './DebtsStore';
import { StaffProvider } from './StaffStore';
import { NotificationsProvider } from './NotificationsStore';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <StaffProvider>
      <ProductsProvider>
        <SalesProvider>
          <DebtsProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </DebtsProvider>
        </SalesProvider>
      </ProductsProvider>
    </StaffProvider>
  );
};
