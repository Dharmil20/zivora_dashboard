'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalOptions {
  title: string;
  content: ReactNode;
  size?: '' | 'lg' | 'xl';
  submitLabel?: string;
  showFooter?: boolean;
  onSubmit?: () => Promise<boolean | void> | boolean | void;
}

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<((val: boolean) => void) | null>(null);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
    if (confirmResolve) {
      confirmResolve(false);
      setConfirmResolve(null);
    }
  }, [confirmResolve]);

  const openModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setConfirmResolve(null);
  }, []);

  const confirm = useCallback((message: string, title: string = 'Confirm'): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmResolve(() => resolve);
      setOptions({
        title,
        content: <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>,
        submitLabel: 'Confirm',
        showFooter: true,
        onSubmit: () => {
          resolve(true);
          setConfirmResolve(null);
          return true;
        },
      });
      setIsOpen(true);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (options?.onSubmit) {
      const result = await options.onSubmit();
      if (result !== false) {
        setIsOpen(false);
        setOptions(null);
      }
    }
  }, [options]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  }, [closeModal]);

  const sizeClass = options?.size ? `modal-${options.size}` : '';
  const showFooter = options?.showFooter !== false;

  return (
    <ModalContext.Provider value={{ openModal, closeModal, confirm }}>
      {children}
      <div
        id="modal-overlay"
        className={isOpen ? 'show' : ''}
        onClick={handleOverlayClick}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)', zIndex: 1000,
          display: isOpen ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {options && (
          <div className={`modal ${sizeClass}`}>
            <div className="modal-header">
              <h3 className="modal-title">{options.title}</h3>
              <button className="modal-close" onClick={closeModal}>
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="modal-body">
              {options.content}
            </div>
            {showFooter && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <span className="material-icons-round">check</span>
                  {options.submitLabel || 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
