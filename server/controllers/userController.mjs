import bcrypt from 'bcrypt';
import Admin from '../models/Admin.mjs';
import Society from '../models/Society.mjs';

export const updatePassword = async (req, res) => {
  const { userId, role, currentPassword, newPassword } = req.body;

  try {
    let user;
    if (role === 'Admin') {
      user = await Admin.findById(userId);
    } else if (role === 'Society') {
      user = await Society.findById(userId);
    } else {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error });
  }
};
