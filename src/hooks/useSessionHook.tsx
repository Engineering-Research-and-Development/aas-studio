import { useState } from "react";
import { useCustomSnackbar } from '@/context/SnackbarContext';
import { useSessionContext } from '@/context/SessionContext';
import { useApiWrapper } from '@/api/apiWrapper';

import Session from "@/models/Session";

export const useSessionHook = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const { showSnackbar } = useCustomSnackbar();
  const { setOperator } = useSessionContext();
  const { get, post } = useApiWrapper();

  const listSocietySessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await get('/v1/session/list');
      if (response.status === 'Success') {
        setSessions(response.data.sessions);
      } else {
        showSnackbar(response.message || 'Errore durante il recupero delle sessioni', 'error');
      }
    } catch (error: any) {
      console.error(error.response?.data?.message || 'An error occurred');
      showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const disconnectOperator = async (operator_id: number) => {
    try {
      const response = await post('/v1/session/disconnect/operator', {
        operator_id: operator_id
      });
      if (response.status === 'Success') {
        // Rimuovi le sessioni dell'operator dalla lista
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session.operator_id !== operator_id)
        );
        showSnackbar(response.message, 'success');
      } else {
        showSnackbar(response.message || 'Errore durante la disconnessione dell\'operator', 'error');
      }
    } catch (error: any) {
      console.error(error.response?.data?.message || 'An error occurred');
      showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
    }
  };
  
  const disconnectDevice = async (operator_id: number, session_id: string) => {
    try {
      const response = await post('/v1/session/disconnect/device', {
        operator_id: operator_id, 
        session_id: session_id
      });
      if (response.status === 'Success') {
        // Rimuovi la sessione dalle liste
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session.session_id !== session_id)
        );
        setMySessions((prevSessions) =>
          prevSessions.filter((session) => session.session_id !== session_id)
        );
        showSnackbar(response.message, 'success');
      } else {
        showSnackbar(response.message || 'Errore durante la disconnessione del dispositivo', 'error');
      }
    } catch (error: any) {
      console.error(error.response?.data?.message || 'An error occurred');
      showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
    }
  };

  const logout = async () => {
    try {
      const response = await get('/v1/session/logout');
      if (response.status === 'Success') {
        showSnackbar(response.message || 'Logout effettuato con successo', 'success');
        // Annulla la sessione dal SessionContext (pulisce localStorage e stato globale)
        setOperator(null);
        return true;
      } else {
        showSnackbar(response.message || 'Errore durante il logout', 'error');
        return false;
      }
    } catch (error: any) {
      console.error(error.response?.data?.message || 'An error occurred');
      showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
      return false;
    }
  };

  return {
    sessions,
    mySessions,
    isLoadingSessions,
    listSocietySessions,
    disconnectOperator,
    disconnectDevice,
    logout
  };
};
