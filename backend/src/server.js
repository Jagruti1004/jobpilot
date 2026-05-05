import 'dotenv/config';
import { app } from './app.js';

const PORT = Number(process.env.PORT) || 4000;

// Bind to 0.0.0.0 in production (Render requires this)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JobPilot API running on port ${PORT}`);
});