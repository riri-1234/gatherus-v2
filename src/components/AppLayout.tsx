import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const AppLayout = ({ children, hideNav = false }: AppLayoutProps) => {
  return (
    <div
      className="
        flex flex-col
        min-h-[100dvh]
        bg-background
        pt-[env(safe-area-inset-top)]
      "
    >
      <main
        className={`
          flex-1
          ${hideNav ? '' : 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]'}
        `}
      >
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;

