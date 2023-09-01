import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();
  const navigation = useCallback(path => navigate(path), [navigate]);
  return navigation;
};
