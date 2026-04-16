import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { sendEmail } from '../services/emailService';

// Temporary storage for reset tokens (Token -> Email)
const resetTokens = new Map<string, string>();

interface IPendingRegistration {
  name: string;
  email: string;
  password: string;
  otp: string;
  expires: number;
}

const pendingRegistrations = new Map<string, IPendingRegistration>();

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const origin = req.headers.origin;
  const isHomepage =
    origin === process.env.HOMEPAGE_ORIGIN ||
    origin === 'http://localhost:6699';

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await User.findOne({ email });

    // If not homepage, block GUEST roles
    if (!isHomepage && user?.role === 'GUEST') {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (user && (await user.matchPassword(password))) {
      // Check for inactive status
      if (user.status === 'INACTIVE') {
        res.status(403).json({
          message:
            'Your account is deactivated or deleted. Please contact Super Admin for support.',
          code: 'ACCOUNT_INACTIVE',
        });
        return;
      }

      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'GUEST',
        permissions: user.permissions || [],
      };

      res.status(200).json({
        message: 'Login successful',
        user: req.session.user,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (_error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Map with 10-minute expiration
    pendingRegistrations.set(email, {
      name,
      email,
      password,
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Cleanup after 10 minutes
    setTimeout(
      () => {
        pendingRegistrations.delete(email);
      },
      10 * 60 * 1000
    );

    // Send email with OTP
    await sendEmail({
      to: email,
      subject: 'Your Registration OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to WettenHalls!</h2>
          <p>Your OTP for registration is:</p>
          <div style="background: #f4f4f4; padding: 20px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      message:
        'OTP sent to your email. Please verify to complete registration.',
      email,
    });
  } catch (_error) {
    console.error('Registration error:', _error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  try {
    const pendingData = pendingRegistrations.get(email);

    if (!pendingData) {
      res
        .status(400)
        .json({ message: 'No registration pending or OTP expired' });
      return;
    }

    if (pendingData.expires < Date.now()) {
      pendingRegistrations.delete(email);
      res.status(400).json({ message: 'OTP expired' });
      return;
    }

    if (pendingData.otp !== otp) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    // Success - Create User
    const user = await User.create({
      name: pendingData.name,
      email: pendingData.email,
      password: pendingData.password,
      role: 'GUEST',
      status: 'ACTIVE',
      permissions: ['VIEW'],
    });

    // Remove from Map
    pendingRegistrations.delete(email);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (_error) {
    console.error('Verify OTP error:', _error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  try {
    // Check if user exists (to follow security practices, we don't alert the user)
    await User.findOne({ email });

    // For security reasons, we should not reveal if the email exists or not
    // but in a dev environment or based on UX preference, we might alert.
    // The user requested: "gửi http://localhost:6699/reset-password/{rawtoken} tới email"

    const token = crypto.randomBytes(20).toString('hex');
    resetTokens.set(token, email);

    // Auto-delete token after 1 hour
    setTimeout(() => resetTokens.delete(token), 3600000);

    const resetUrl = `${process.env.HOMEPAGE_ORIGIN}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: 'Reset email sent successfully' });
  } catch (_error) {
    console.error('Forgot password error:', _error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  const origin = req.headers.origin;
  const isHomepage =
    origin === process.env.HOMEPAGE_ORIGIN ||
    origin === 'http://localhost:6699';
  const cookieName = isHomepage ? 'homepage.sid' : 'management.sid';

  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        message: 'Could not log out. Please try again.',
        code: 'LOGOUT_FAILED',
      });
      return;
    }
    res.clearCookie(cookieName);
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.session.user!.id);

    if (!user) {
      req.session.destroy(() => {
        res.status(401).json({ message: 'User no longer exists' });
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      req.session.destroy(() => {
        res.status(403).json({
          message:
            'Your account is deactivated or deleted. Please contact Super Admin for support.',
          code: 'ACCOUNT_INACTIVE',
        });
      });
      return;
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    });
  } catch (_error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, password } = req.body;

  try {
    const email = resetTokens.get(token);

    if (!email) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.password = password;
    await user.save();

    resetTokens.delete(token);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (_error) {
    console.error('Reset password error:', _error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
