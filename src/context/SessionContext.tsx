import { createContext, useState, useContext, ReactNode } from 'react';
import SocietyOperator from '@/models/SocietyOperator';

interface SessionContextProps {
  operator: SocietyOperator;
  setOperator: (operator: SocietyOperator | null) => void;
}

const SessionContext = createContext<SessionContextProps>({
  operator: {
    operator_id: -1,
    user_id: -1,
    society_id: -1,
    session_id: '',
    auth_token: '',
    user: { user_id: -1, name: '', surname: '', email: '', picture: '' },
    society: { society_id: -1, name: '', email: '', picture: '' },
  },
  setOperator: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [operator, setOperatorState] = useState<SocietyOperator>(() => ({
    operator_id: parseInt(localStorage.getItem('operator_id') || '-1', 10),
    user_id: parseInt(localStorage.getItem('user_id') || '-1', 10),
    society_id: parseInt(localStorage.getItem('society_id') || '-1', 10),
    session_id: localStorage.getItem('session_id') || '',
    auth_token: localStorage.getItem('auth_token') || '',
    user: {
      user_id: parseInt(localStorage.getItem('user_id') || '-1', 10),
      name: localStorage.getItem('user_name') || '',
      surname: localStorage.getItem('user_surname') || '',
      email: localStorage.getItem('user_email') || '',
      picture: localStorage.getItem('user_picture') || '',
    },
    society: {
      society_id: parseInt(localStorage.getItem('society_id') || '-1', 10),
      name: localStorage.getItem('society_name') || '',
      email: localStorage.getItem('society_email') || '',
      picture: localStorage.getItem('society_picture') || '',
    },
  }));

  const setOperator = (operator: SocietyOperator | null) => {
    if (operator) {
      localStorage.setItem('operator_id', operator.operator_id.toString());
      localStorage.setItem('user_id', operator.user_id.toString());
      localStorage.setItem('society_id', operator.society_id.toString());
      localStorage.setItem('session_id', operator.session_id || '');
      localStorage.setItem('auth_token', operator.auth_token || '');
      localStorage.setItem('user_name', operator.user.name || '');
      localStorage.setItem('user_surname', operator.user.surname || '');
      localStorage.setItem('user_email', operator.user.email || '');
      localStorage.setItem('user_picture', operator.user.picture || '/profile.png');
      localStorage.setItem('society_name', operator.society?.name || '');
      localStorage.setItem('society_email', operator.society?.email || '');
      localStorage.setItem('society_picture', operator.society?.picture || '');
      setOperatorState(operator);
    } else {
      ['operator_id','user_id','society_id','session_id','auth_token','user_name','user_surname','user_email','user_picture','society_name','society_email','society_picture'].forEach(k => localStorage.removeItem(k));
      setOperatorState({
        operator_id: -1, user_id: -1, society_id: -1, session_id: '', auth_token: '',
        user: { user_id: -1, name: '', surname: '', email: '', picture: '' },
        society: { society_id: -1, name: '', email: '', picture: '' },
      });
    }
  };

  return (
    <SessionContext.Provider value={{ operator, setOperator }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);
