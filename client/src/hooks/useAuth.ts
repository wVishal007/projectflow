import { useAuthContext } from '../App';
import { isAuthenticated } from '../lib/auth';

export function useAuth() {
  return { ...useAuthContext(), isAuthenticated: isAuthenticated() };
}
