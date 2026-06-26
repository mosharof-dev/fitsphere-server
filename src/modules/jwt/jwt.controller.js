const jwt = require('jsonwebtoken');

const signToken = async (req, res) => {
  try {
    const user = req.body;
    // Create token
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '7d',
    });

    // Set HTTPOnly Cookie
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate token', error });
  }
};

const logout = async (req, res) => {
  try {
    res
      .clearCookie('token', {
        maxAge: 0,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear token', error });
  }
};

module.exports = {
  signToken,
  logout,
};
