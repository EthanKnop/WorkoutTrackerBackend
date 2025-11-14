import express from 'express';
import cors from 'cors';
import WorkoutTrackerEndpoints from './workout-tracker-endpoints';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Register API endpoints
new WorkoutTrackerEndpoints(app);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
