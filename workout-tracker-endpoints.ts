import { Machine } from './sharedTypes';
import { Database } from './database';

class WorkoutTrackerEndpoints {

    private database = new Database();
    private app: any;

    constructor(app: any) {
      this.app = app;
      this.createEndpoints();
    }

    public createEndpoints() {
      this.app.get('/machines', async (req: any, res: any) => {
          const machines: Array<Machine> = await this.database.getMachinesAndData();
          res.status(200).send(machines);
        });
        
      this.app.post('/new-machine', async (req: any, res: any) => {
        const { name, type } = req.body;
        const machine: Machine = await this.database.newMachine(name, type);
        res.status(200).send(machine);
      });
        
      this.app.post('/new-weight', async (req: any, res: any) => {
        const { machineId, weight, date } = req.body;
        await this.database.newWeight(machineId, weight, date);
        res.status(200).send();
      });
        
      this.app.post('/get-machine', async (req: any, res: any) => {
        const { machineId } = req.body;
        const machineData = (await this.database.getMachinesAndData(machineId)).pop();
        if (!machineData) {
          return res.status(404).send({ error: 'Machine not found' });
        }
        const machine: Machine = machineData;
        res.status(200).send(machine);
      });
    }



}

export default WorkoutTrackerEndpoints;