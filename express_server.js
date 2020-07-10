const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');



const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());




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
  if (users[req.cookies["user_id"]] && users[req.cookies["user_id"]].email) {
    return res.redirect("/urls");
  }
  let templateVars = {
    email: ""
  };
  //console.log('email = ' + req.cookies["user_id"]);
  res.render("register", templateVars);
});

// app.post("/register", (req, res) => {
//   if (req.body["email"] === "" || req.body["password"] === "" || findUser(req.body["email"]) ) {
//     res.send(400);
//   } else {
//   const password = "purple-monkey-dinosaur"; // found in the req.params object
//   const hashedPassword = bcrypt.hashSync(password, 10);
//   const randomUserID = generateRandomString();
//   users[randomUserID] = {};
//   users[randomUserID].id = randomUserID;
//   users[randomUserID].email = req.body["email"];
//   users[randomUserID].password = req.body["password"];
//   res.cookie("user_id", randomUserID);
//   // console.log("user_id");
//   // console.log(users)
//   res.redirect("/urls");
//   }
// });

app.post("/register", (req, res) => {
  if (req.body["email"] === "" || req.body["password"] === "" || findUser(req.body["email"]) ) {
    res.send(400);
  } else {
  const password = req.body["password"]; // found in the req.params object
  const hashedPassword = bcrypt.hashSync(password, 10);
  const randomUserID = generateRandomString();
  users[randomUserID] = {};
  users[randomUserID].id = randomUserID;
  users[randomUserID].email = req.body["email"];
  users[randomUserID].password = hashedPassword;
  res.cookie("user_id", randomUserID);
  // console.log("user_id");
  // console.log(users)
  res.redirect("/urls");
  }
});




// LOGIN PAGE
app.get("/login", (req, res) => {
  if (users[req.cookies["user_id"]] && users[req.cookies["user_id"]].email) {
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
        res.cookie("user_id", user);
        res.redirect("/urls");
        return;
      }
    }
  }
  res.send(403);
});

// app.post("/login", (req, res) => {
//   if (!req.cookies["user_id"]) { //if you are not logged in
//     const email = req.body.email;
//     const pass = req.body.password;
//     let userID = "";
//   for (const user in users) {
//     if (users[user].email === email) {
//       userID = users[user].id;
//     }
//   }
//   res.cookie("user_id", userID);
//   res.redirect('/urls');
//   } else {
//     res.redirect("/urls");
//   }
// });


// // middleware location



// LOGOUT REQUEST
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});




//MAIN URL PAGE
app.get("/urls", (req, res) => {
  const access = userAccess(req.cookies["user_id"]);
  console.log("informative_text", access);
  
  if (users[req.cookies["user_id"]] && users[req.cookies["user_id"]].email) {
    
    const templateVars = {
      urls: access,
      email: users[req.cookies["user_id"]].email
    };

    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      urls: access,
      email: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
  }
});

// app.post("/urls", (req, res) => {
//     const shortURLString = generateRandomString();
//     if (req.body.longURL) {
//       urlDatabase[shortURLString] = req.body.longURL;
//     }
//     console.log(req.body); // Log the POST request body to the console
//     res.redirect(`urls/${shortURLString}`);
// });


//TESTING URLDATABASE UPDATE
app.post("/urls", (req, res) => {
  const shortURLString = generateRandomString();
  if (req.body.longURL) {
    urlDatabase[shortURLString] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};
  }
  console.log(urlDatabase); // Log the POST request body to the console
  res.redirect(`urls/${shortURLString}`);
});




//URL PAGE EDIT AND DETELE BUTTONS
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;
  if (req.cookies["user_id"] === userid) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;
  if (req.cookies["user_id"] === userid) {
    const shortURL = req.params.shortURL;
    res.redirect(`/urls/${shortURL}`);
  }
  res.redirect("/login");
});




//CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]]) {

    let templateVars = { user: users[req.cookies["user_id"]], 
    email: users[req.cookies["user_id"]].email 
  };
    res.render("urls_new", templateVars);
    return;

  } else {
    res.redirect("/login");
  }
});




//URL SHORTURL PAGE
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[req.params.shortURL] = req.body.longURL;
//  res.redirect(`/urls/${shortURL}`);
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const userid = urlDatabase[shortURL].userID;
  if (req.cookies["user_id"] === userid) {
    const access = userAccess(req.cookies["user_id"]);
    let templateVars = {
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL, //changed to look for L-URL
      email: users[req.cookies["user_id"]].email
    };
    res.render("urls_show", templateVars);
  }
  res.redirect("/login");
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

const findUser = (email) => {
  for (let user in users) {
  // console.log(users[user]);
    if (users[user].email === email) {
      // console.log(user);
      return user;
    }
  }
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