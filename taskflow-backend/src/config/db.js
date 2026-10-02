import mongoose from "mongoose";


const safeUrl = (raw = "") => raw.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");

const connectDB = async () => {
  const url = process.env.MONGO_URL;

  if (!url) {
    console.error("MONGO_URL is not set. Add it in the Render dashboard under Environment.");
    process.exit(1);
  }


  const hasDbName = /mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(url);
  if (!hasDbName) {
    console.error(
      "MONGO_URL has no database name. Use .../taskflow at the end, e.g. " +
        "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/taskflow"
    );
  }

  console.log("Connecting to MongoDB at:", safeUrl(url));

  try {
    const conn = await mongoose.connect(url, { 
  
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  } catch (error) {
    console.error("DB Error:", error.message);

    // Ye do wajah se hota hai — Render par log se pata chal jaayega kaunsa fix karna hai
    if (/ECONNREFUSED|querySrv|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(error.message)) {
      console.error(
        "Hint: Render could not reach the cluster. On MongoDB Atlas go to " +
          "Network Access and add 0.0.0.0/0 (allow from anywhere)."
      );
    } else if (/Authentication failed|bad auth/i.test(error.message)) {
      console.error(
        "Hint: Wrong username/password in MONGO_URL. Also check that this Atlas " +
          "user has read/write access on the target database."
      );
    }

    process.exit(1);
  }
};

export default connectDB;
