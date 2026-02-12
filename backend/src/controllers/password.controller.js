import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import { generateOtp6, sha256 } from '../utils/otp.js';
import { sendResetCodeEmail } from '../mail/mailer.js';

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  const normalizedEmail = String(email).toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  const neutral = { message: 'Si el correo existe, enviaremos un codigo.' };
  if (!user) return res.status(200).json(neutral);

  if (user.resetCodeLastSentAt) {
    const lastSentAt = new Date(user.resetCodeLastSentAt).getTime();
    if (Date.now() - lastSentAt < 60 * 1000) {
      return res.status(429).json({ message: 'Espera un minuto.' });
    }
  }

  const code = generateOtp6();

  user.resetCodeHash = sha256(code);
  user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.resetCodeAttempts = 0;
  user.resetCodeLastSentAt = new Date();

  await user.save();

  try {
    await sendResetCodeEmail({ to: user.email, code });
  } catch (error) {
    console.error('[forgot-password] mail send failed', error);
    return res.status(500).json({ message: 'No se pudo enviar el correo.' });
  }

  return res.json(neutral);
}

export async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;

  const normalizedEmail = String(email).toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(400).json({ message: 'Codigo invalido.' });

  if (!user.resetCodeHash || !user.resetCodeExpires) {
    return res.status(400).json({ message: 'Codigo invalido.' });
  }

  if (user.resetCodeExpires < Date.now()) {
    user.resetCodeHash = undefined;
    user.resetCodeExpires = undefined;
    user.resetCodeAttempts = 0;
    user.resetCodeLastSentAt = undefined;
    await user.save();
    return res.status(400).json({ message: 'Codigo expirado.' });
  }

  if (user.resetCodeAttempts >= 5) {
    return res.status(429).json({ message: 'Demasiados intentos.' });
  }

  if (sha256(String(code)) !== user.resetCodeHash) {
    user.resetCodeAttempts += 1;
    await user.save();
    return res.status(400).json({ message: 'Codigo incorrecto.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  user.resetCodeHash = undefined;
  user.resetCodeExpires = undefined;
  user.resetCodeAttempts = 0;
  user.resetCodeLastSentAt = undefined;

  await user.save();
  return res.json({ message: 'Contrasena actualizada.' });
}
