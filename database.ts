import { Machine } from './sharedTypes';
import { Pool } from 'pg';

export class Database {
    private pool: Pool;

    constructor() {
        const connectionString = process.env.DATABASE_URL || 'postgres://postgres:wWsFhtbpSUCrT8vf3jhBkDyYCWE8m6kTF0hAZcZkpw265822i6XNHMoZ7vgfHJX1@b0s4c8ggc4wk8c08g0wwwswg:5432/postgres';
        this.pool = new Pool({ connectionString });
        this.createTablesIfNotExist();
    }

    createTablesIfNotExist(): void {
        const createMachinesTableQuery = `
            CREATE TABLE IF NOT EXISTS machines (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL
            );
        `;
        const createWeightTableQuery = `
            CREATE TABLE IF NOT EXISTS weight (
                "machineId" INTEGER REFERENCES machines(id),
                weight REAL NOT NULL,
                date DATE NOT NULL,
                PRIMARY KEY ("machineId", date)
            );
        `;
        this.pool.query(createMachinesTableQuery);
        this.pool.query(createWeightTableQuery);
    }

    async getMachinesAndData(machineId?: number): Promise<Array<Machine>> {
        let query = `
            SELECT m.id as "machineId", m.name, m.type, w.weight, w.date
            FROM machines m
            LEFT JOIN weight w ON m.id = w."machineId"
            AND (w.date >= (CURRENT_DATE - INTERVAL '12 months') OR w.date IS NULL)
        `;
        const params: any[] = [];
        if (machineId !== undefined) {
            query += ` WHERE m.id = $1`;
            params.push(machineId);
        }
        const { rows } = await this.pool.query(query, params);
        const machinesMap: { [key: number]: Machine } = {};
        rows.forEach((row: any) => {
            if (!machinesMap[row.machineId]) {
                machinesMap[row.machineId] = {
                    id: row.machineId,
                    name: row.name,
                    type: row.type,
                    data: []
                };
            }
            if (row.weight !== null && row.date !== null) {
                machinesMap[row.machineId].data.push({
                    weight: row.weight,
                    date: row.date
                });
            }
        });
        Object.values(machinesMap).forEach(machine => {
            machine.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return Object.values(machinesMap);
    }

    async newMachine(name: string, type: string): Promise<Machine> {
        const insertQuery = `INSERT INTO machines (name, type) VALUES ($1, $2) RETURNING id`;
        const { rows } = await this.pool.query(insertQuery, [name, type]);
        return {
            id: rows[0].id,
            name,
            type,
            data: []
        };
    }

    async newWeight(machineId: number, weight: number, date: string): Promise<void> {
        const upsertQuery = `
            INSERT INTO weight ("machineId", weight, date)
            VALUES ($1, $2, $3)
            ON CONFLICT ("machineId", date) DO UPDATE SET weight = EXCLUDED.weight
        `;
        await this.pool.query(upsertQuery, [machineId, weight, date]);
    }
}