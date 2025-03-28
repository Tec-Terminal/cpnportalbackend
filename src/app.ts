import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import {cronJobEndpoint} from './controllers/profileControllers';
import admindashRoutes from './admin/routes/admindashRoutes'
import managersdashRoutes from './managers/routes/managersdashRoutes';
import connectDB from './database/database';
import { json } from 'stream/consumers';
import { spawn } from "child_process";

const app = express()

  // script to connect to vps webhook to build automatically
  const script:string = `echo 'starting script' 
   git pull
   npm install
   npm run build
   pm2 restart apicpn
   echo 'ended script'`;
       app.post('/api/webhook-backend', async (req: any, res: any) => {
          console.log("Webhook triggered. Starting build process...");

           const child = spawn("bash", ["-c", script.replace(/\n/g, "&&")]);
   
           const prom = new Promise<boolean>((resolve, reject) => {
             child.stdout.on("data", (data: any) => {
               console.log(`stdout: ${data}`);
             });
         
             child.on("close", (code: any) => {
               console.log(`child process exited with code ${code}`);
               if (code == 0) resolve(true);
               else resolve(false);
             });

           });

          if (await prom) {
      console.log("Build process completed successfully.");
      return res.status(200).json({ success: true });
  } else {
      console.error("Build process failed.");
      return res.status(500).json({ success: false });
  }
})
   
       
   
// Frontend webhook
const feScript:string = `echo 'starting frontend deployment'
   cd /var/www/cpnfrontend 
   git pull origin main
   npm install
   npm run build
   pm2 restart cpnfrontend
   echo 'Frontend deployment completed.'`;
    app.post('/api/webhook-frontend', async (req: any, res: any) => {
      const child = spawn("bash", ["-c", feScript.replace(/\n/g, "&&")]);

      const prom = new Promise<boolean>((resolve) => {
          child.stdout.on("data", (data: any) => {
              console.log(`stdout: ${data}`);
          });

          child.on("close", (code: any) => {
              console.log(`child process exited with code ${code}`);
              resolve(code === 0);
          });
      });

      if (await prom) return res.status(200).json({ success: true });
      return res.status(500).json({ success: false });
  });




dotenv.config();

const PORT = process.env.PORT || 5000;

const startApp = async () => {
    app.use(cors());
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({extended: true}))

   

    app.listen(PORT, () =>{
        console.log(`Server running on port ${PORT}`);
        
    });

    await connectDB();

    // Use the authentication routes
    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes)
    app.use('/api/admin', admindashRoutes)
    app.use('/api/manager', managersdashRoutes)

    // Cron Job Route
    app.get('/cron-job', cronJobEndpoint);


      // 404 route
  app.use((req: any, res: any) => {
    return res.status(404).json({ data: `Cannot ${req.method} route ${req.path}`, statusCode: 404, msg: "Failure" })
})
}

startApp()
