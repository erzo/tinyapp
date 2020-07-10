const findUser = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      // console.log(user);
      return user;
    } else {
      return undefined;
    }
  }
};

module.exports = { findUser };