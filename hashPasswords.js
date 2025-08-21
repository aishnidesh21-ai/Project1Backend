const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();  // to load .env variables

async function hashExistingPasswords() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({});
  for (const user of users) {
    if (!user.password.startsWith('$2b$')) { // bcrypt hash start hota hai $2b$ se
      const hashed = await bcrypt.hash(user.password, 10);
      user.password = hashed;
      await user.save();
      console.log(`Password hashed for user: ${user.email}`);
    }
  }

  console.log("All passwords hashed");
  process.exit(0);
}

hashExistingPasswords().catch(console.error);
