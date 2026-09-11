import { User } from '../types';

export const toPortalUser = (user: { id: number; name: string; email: string; role: string; status?: User['status'] }): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
});
