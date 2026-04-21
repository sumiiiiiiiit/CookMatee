require('dotenv').config();
const connectDB = require('./config/db');
const { server } = require('./app');

connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
