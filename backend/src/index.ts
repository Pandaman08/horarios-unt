import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { initSocketServer } from './lib/socket-server';

// Importar rutas
import periodoRouter from './routes/periodos';
import docenteRouter from './routes/docentes';
import horarioRouter from './routes/horarios';
import reporteRouter from './routes/reportes';
import ambienteRouter from './routes/ambientes';
import cicloRouter from './routes/ciclos';
import cursoRouter from './routes/cursos';
import grupoRouter from './routes/grupos';
import statsRouter from './routes/stats';
import ventanaRouter from './routes/ventanas';
import { iniciarCronJobs } from './lib/programadorTareas';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initSocketServer(httpServer);

const PORT = process.env.PORT || 4000;

// Iniciar Cron Jobs
iniciarCronJobs();

app.use(cors());
app.use(express.json());

// Registrar rutas
app.use('/api/periodos', periodoRouter);
app.use('/api/docentes', docenteRouter);
app.use('/api/horarios', horarioRouter);
app.use('/api/reportes', reporteRouter);
app.use('/api/ambientes', ambienteRouter);
app.use('/api/ciclos', cicloRouter);
app.use('/api/cursos', cursoRouter);
app.use('/api/grupos', grupoRouter);
app.use('/api/dashboard/stats', statsRouter);
app.use('/api/ventanas', ventanaRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend de Horarios UNT activo' });
});

// Middleware de error global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor', details: err.message });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});

export { io };
