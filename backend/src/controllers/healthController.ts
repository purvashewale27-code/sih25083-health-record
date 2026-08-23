import { Request, Response } from 'express';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Backend is running',
  });
};
