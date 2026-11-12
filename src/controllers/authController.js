const store = require('../data/store');

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@anurag.edu.in')) {
      return res.status(403).json({
        error: 'Only @anurag.edu.in institutional email addresses are permitted.'
      });
    }

    let user = store.findUserByEmail(cleanEmail);

    // If user doesn't exist yet, auto-provision student account for frictionless demo
    if (!user) {
      const username = cleanEmail.split('@')[0];
      user = store.createUser({
        email: cleanEmail,
        password: password,
        fullName: username.charAt(0).toUpperCase() + username.slice(1),
        rollNo: username.toUpperCase(),
        role: 'student'
      });
    } else if (user.password && user.password !== password) {
      // If user exists and password is provided, check password
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Determine redirect
    let redirectUrl = 'index.html';
    if (user.email === 'canteen@anurag.edu.in') {
      redirectUrl = 'admin_canteen.html';
    } else if (user.email === 'voting@anurag.edu.in') {
      redirectUrl = 'home.html';
    } else if (user.email === 'tracurrency@anurag.edu.in') {
      redirectUrl = 'tracurrency.html';
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.displayName || 'Student',
        rollNo: user.rollNo || '',
        role: user.role || 'student'
      },
      redirectUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = (req, res) => {
  try {
    const { fullName, rollNo, email, password, confirmPassword } = req.body;

    if (!fullName || !rollNo || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@anurag.edu.in')) {
      return res.status(403).json({
        error: 'Signup declined: Only @anurag.edu.in emails are accepted.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existing = store.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = store.createUser({
      fullName,
      rollNo,
      email: cleanEmail,
      password,
      role: 'student',
      hasVoted: false
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        rollNo: user.rollNo,
        role: user.role
      },
      redirectUrl: 'index.html'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser = (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.json({ user: null });
  }
  const user = store.findUserById(userId);
  if (!user) {
    return res.json({ user: null });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      rollNo: user.rollNo,
      role: user.role
    }
  });
};

