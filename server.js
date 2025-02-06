const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here

const SECRET_KEY = "supersecretkey";
// In-memory database (temporary storage)
const users = new Map(); 
const highScores = [];

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized, JWT token is missing" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).json({ error: "Unauthorized, invalid JWT" });
    req.user = user;
    next();
  });
}


// Signup endpoint
app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password) {
    return res.status(400).json({ error: "userHandle and password are required." });
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: "userHandle and password must be at least 6 characters long." });
  }
  // For later improvement
  // if (users.has(userHandle)) {
  //   return res.status(400).json({ error: "User already exists." });
  // }

  users.set(userHandle, { userHandle, password });

  return res.status(201).json({ message: "User registered successfully." });
});

app.post("/login", (req, res) => {
  const { userHandle, password, additional } = req.body;

  // Log the request details for debugging
  console.log("Login attempt:", { userHandle, password });

  if (additional) {
    console.error("Extra field");
    return res.status(400).json({ error: "additional field is given" });
  }

  // Ensure that both userHandle and password are provided
  if (!userHandle || !password) {
    console.error("Missing userHandle or password!");
    return res.status(400).json({ error: "userHandle and password are required." });
  }

  if (typeof userHandle !== "string" && typeof password !== "string") {
    console.error("Incorrect data type for userHandle and password!");
    return res.status(400).json({ error: "userHandle and password must include text." });
  } else {
    if (typeof password !== "string") {
      console.error("Incorrect data type for password!");
      return res.status(400).json({ error: "password must include text." });
    }
    if (typeof userHandle !== "string") {
      console.error("Incorrect data type for userHandle!");
      return res.status(400).json({ error: "userHandle must include text." });
    }
  }

  // Check if user exists in the database
  const user = users.get(userHandle);
  console.log("User found in DB:", user);

  if (!user) {
    console.error("User not found!");
    return res.status(401).json({ error: "Unauthorized, incorrect username or password" });
  }

  // Validate the password
  if (user.password !== password) {
    console.error("Incorrect password!");
    return res.status(401).json({ error: "Unauthorized, incorrect username or password" });
  }

  // Create a JWT token for the user
  const token = jwt.sign({ userHandle }, SECRET_KEY, { expiresIn: "1h" });

  // Send response with 200 status and the token
  console.info("Login successful, returning 200 with JWT.");
  return res.status(200).json({ jsonWebToken: token });
});

// Post high score (requires authentication)
app.post("/high-scores", authenticateToken, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (userHandle !== req.user.userHandle) {
    return res.status(401).json({ error: "Unauthorized, user mismatch." });
  }

  highScores.push({ level, userHandle, score, timestamp });
  return res.status(201).json({ message: "High score posted successfully." });
});

// Get high scores for a level
app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;

  if (!level) {
    return res.status(400).json({ error: "Level parameter is required." });
  }

  const scores = highScores
    .filter(score => score.level === level)
    .sort((a, b) => b.score - a.score); // Order scores from highest to lowest

  const pageSize = 20;
  const paginatedScores = scores.slice((page - 1) * pageSize, page * pageSize);

  res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
