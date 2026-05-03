import { registerUser, loginUser, getCurrentUser } from '../services/authService.js';
import { ApiError } from '../middleware/errorHandler.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password are required');
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

    const result = await registerUser(email, password, name);
    res.status(201).json(result); // 201 = Created
  } catch (err) {
    next(err); // Pass to errorHandler middleware
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password are required');

    const result = await loginUser(email, password);
    res.json(result); // 200 OK
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.userId); // userId attached by requireAuth middleware
    res.json({ user });
  } catch (err) {
    next(err);
  }
};