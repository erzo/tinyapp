const findUser = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
    //console.log(user);
  }
  return undefined;
};

module.exports = { findUser };