import dotenv from "dotenv";
import app from "./app.js";
import { connectdb } from "./config/db.js";


dotenv.config({ path: "../.env" });

await connectdb();

app.listen(3000,()=>{
    console.log("Server is running");
});