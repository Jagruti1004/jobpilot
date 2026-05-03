import 'dotenv/config'; // Loads .env into process.env — must be first
import { app } from './app.js';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`🚀 JobPilot API running on http://localhost:${PORT}`);
});