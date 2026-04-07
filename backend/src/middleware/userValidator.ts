import { body } from 'express-validator';

/**
 * Validation rules for user login
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Vui lòng cung cấp một địa chỉ email hợp lệ')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
];
/**
 * Validation rules for user creation (Super Admin only)
 */
export const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên không được để trống')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải từ 2 đến 50 ký tự'),
  body('email')
    .isEmail()
    .withMessage('Vui lòng cung cấp một địa chỉ email hợp lệ')
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('role')
    .isIn(['ADMIN', 'GUEST'])
    .withMessage('Chức vụ không hợp lệ. Chỉ có thể tạo ADMIN hoặc GUEST'),
];
