import { useEffect, useState } from 'react';

interface UserData {
  _id: string;
  email: string;
  profilePictureUrl?: string;
  identity: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  wallet: {
    balance: number;
  };
}

export const useUser = () => {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
