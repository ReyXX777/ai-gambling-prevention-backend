const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser } = require('../models/User');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser({ email, passwordHash, name });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
