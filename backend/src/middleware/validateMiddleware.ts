import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      res.status(400).json({
        error: 'Validation failed',
        details,
      });
      return;
    }

    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};
