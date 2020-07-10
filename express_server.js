const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { findUser } = require("./helpers");


const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


app.use(cookieSession({
  name: 'session',
  keys: ["tinyappforthewin"]
}));


// Global Objects
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "123"
  }
}

const urlDatabase = {
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "user_id" },
  "i3BoGr": { longURL: "https://www.google.ca", userID: "user_id" },
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "user_id" }
};



// server read and create methods
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});




// REGISTER PAGE
app.get("/register", (req, res) => {
  if (users[req.session.user_id] && users[req.session.user_id].email) {
    return res.redirect("/urls");
  }
  let templateVars = {
    email: ""
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body["email"] === "" || req.body["password"] === "" || findUser(req.body["email"], users)) {
    res.redirect("error");
  } else {
  const password = req.body["password"];
  const hashedPassword = bcrypt.hashSync(password, 10);
  const randomUserID = generateRandomString();
  users[randomUserID] = {};
  users[randomUserID].id = randomUserID;
  users[randomUserID].email = req.body["email"];
  users[randomUserID].password = hashedPassword;
  req.session.user_id = randomUserID;
  res.redirect("/urls");
  }
});



//ERROR PAGE
app.get("/error", (req, res) => {
  const access = userAccess(req.session.user_id);
  const templateVars = {
    urls: access,
    email: ""
  };
  res.render("error", templateVars);
});



// LOGIN PAGE
app.get("/login", (req, res) => {
  if (users[req.session.user_id] && users[req.session.user_id].email) {
    return res.redirect("/urls");
  }
  const templateVars = {
    email: ""
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  for (const user in users) {

    if (req.body.email === users[user].email) {
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);

      if (bcrypt.compareSync(req.body.password, hashedPassword)) {
        console.log(users);
        req.session.user_id = user;
        res.redirect("/urls");
        return;
      }
    }
  }
  res.redirect("register");
});


// // middleware location


// LOGOUT REQUEST
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});



//MAIN URL PAGE
app.get("/urls", (req, res) => {
  const access = userAccess(req.session.user_id);
  
  if (users[req.session.user_id] && users[req.session.user_id].email) {
  
    const templateVars = {
      urls: access,
      email: users[req.session.user_id].email
    };
    res.render("urls_index", templateVars);

  } else {
    const templateVars = {
      urls: access,
      email: users[req.session.user_id]
    };
    res.render("error", templateVars);
  }
});


//TESTING URLDATABASE UPDATE
app.post("/urls", (req, res) => {
  const shortURLString = generateRandomString();
  
  if (req.body.longURL) {
    urlDatabase[shortURLString] = {longURL: req.body.longURL, userID: req.session.user_id};
  }
  console.log(urlDatabase); // Log the POST request body to the console
  res.redirect(`urls/${shortURLString}`);
});



//URL PAGE EDIT AND DETELE BUTTONS
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;
  
  if (req.session.user_id === userid) {
  delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;
  
  if (req.session.user_id === userid) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
  res.redirect("/login");
  }
});


//CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
  
    let templateVars = { 
      user: users[req.session.user_id], 
      email: users[req.session.user_id].email 
  };
    res.render("urls_new", templateVars);
    return;

  } else {
    res.redirect("/login");
  }
});




//URL SHORTURL PAGE
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;

  if (req.session.user_id === userid) {
    const access = userAccess(req.session.user_id);
    let templateVars = {
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL,
      email: users[req.session.user_id].email
    };
    res.render("urls_show", templateVars);
  }
  res.redirect("/error"); //was login
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log(longURL);
  res.redirect(longURL);
});




//LISTEN TO PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



//FUNCTIONS
const generateRandomString = () => {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i <= 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const userAccess = (user) => {
  const urlArray = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID ===  user) {
      let urlData = {};
      urlData = { shortURL: url, longURL: urlDatabase[url].longURL }
      urlArray.push(urlData);
    }
  }
  return urlArray;
};


// // middleware 
// app.use((req, res, next) => {
//   if (req.cookies["user_id"] && 
//     users[req.cookies["user_id"]] && 
//     users[req.cookies["user_id"]].email) {
//       // makes email into a value that can be access by any page
//       res.locals.email = users[req.cookies["user_id"]].email;
//       next();
//   } else {
//     return res.redirect("/login");
//   }
// });