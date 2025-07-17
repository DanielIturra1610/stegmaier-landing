import React, { createContext, useState, useContext, ReactNode } from 'react';

type ModalType = 'login' | 'register' | 'verification' | null;

interface AuthModalContextType {
  modalType: ModalType;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
  setModalType: (type: ModalType) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const openLoginModal = () => setModalType('login');
  const openRegisterModal = () => setModalType('register');
  const closeModal = () => setModalType(null);
  const isModalOpen = modalType !== null;

  return (
    <AuthModalContext.Provider
      value={{
        modalType,
        openLoginModal,
        openRegisterModal,
        closeModal,
        isModalOpen,
        setModalType
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
