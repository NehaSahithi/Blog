import exp from 'express';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import { userRoute } from './APIs/UserAPI.js'; // fixed import names
import { adminRoute } from './APIs/AdminAPI.js'; // fixed import names
import { authorRoute } from './APIs/AuthorAPI.js'; // fixed import names
import { commonRouter } from './APIs/CommonAPI.js'; // Added missing CommonAPI
import cors from 'cors';

config(); //process.env
export const app = exp();

// add body parser middle ware
app.use(exp.json());
app.use(cors());

// connecting api
app.use('/user-api', userRoute); // fixed variables
app.use('/admin-api', adminRoute); // fixed variables
app.use('/author-api', authorRoute); // fixed variables
app.use('/common-api', commonRouter); // Registered CommonAPI

//connection to db
const connectDB = async () => {
    try {
        await connect(process.env.DB_URL);
        console.log("DataBase connected succesfully");
        //start the server
        app.listen(process.env.PORT, () => console.log("server started"));
    }
    catch (err) {
        console.log("error in connect data base", err);
    }
}
 
connectDB();

//error handling middleware
app.use((err, req, res, next) => {
  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Full error:", err);

  // mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`,
    });
  }                     

  // ✅ HANDLE CUSTOM ERRORS
  if (err.status) {
    return res.status(err.status).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // default server error
  res.status(500).json({
    message: "error occurred",
    error: "Server side error",
  });
});