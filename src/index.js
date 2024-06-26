const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.use("/public/", express.static("./public"));
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.render("dash");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// Register user
app.post("/signup", async (req, res) => {
  const data = {
    firstname: req.body.firstname,
    surname: req.body.surname,
    name: req.body.username,
    mail: req.body.mail,
    password: req.body.password,
    balanceValue: req.body.balanceValue,
  };

  // If user exists in the database validation
  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    res.render("user_exists");
  } else {
    // Mail validation if contains "@"
    if (!data.mail || !data.mail.includes("@")) {
      res.render("signup");
      return;
    }

    // Check if mail contains a valid domain
    const validDomains = ["com", "pl", "eu", "net", "org"]; // Can get more domains in the future
    const domain = data.mail.split("@")[1]; // Get domain part of email
    const domainParts = domain.split(".");
    if (!validDomains.includes(domainParts[domainParts.length - 1])) {
      res.render("signup");
      return;
    }

    // Password validation if psw is longer than 8 chars
    if (data.password.length < 7) {
      res.render("signup");
      return;
    }

    // Hashing password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userdata = await collection.insertMany(data);
    console.log(userdata);

    res.render("home", {
      username: data.name,
      firstname: data.firstname,
      surname: data.surname,
      password: data.password,
      balanceValue: data.balanceValue,
    });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      res.render("user_cannot_be_found");
    } else {
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );
      if (isPasswordMatch) {
        res.render("home", {
          username: req.body.username,
          firstname: check.firstname,
          surname: check.surname,
          balanceValue: check.balanceValue,
        });
      } else {
        res.render("wrong_password");
      }
    }
  } catch (err) {
    res.send("Unexpected error: " + err.message);
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running. Reach at http://localhost:${port}`);
});
