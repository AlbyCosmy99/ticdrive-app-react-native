import User from '@/types/User';

const formatUserData = (payload: any): User => {
  return {
    userId: payload.userId,
    name: payload.name,
    email: payload.email,
    category: 'user', //to-do: integrate also workshop user type,
    emailConfirmed: payload.emailConfirmed,
    phoneNumber: payload.phoneNumber,
    address: payload.address,
  };
};

export default formatUserData;
