import jwt from 'jsonwebtoken';

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: '1h'
  });
};

export default generateToken;

