const users = [];

class User {
  constructor(id, username, passwordHash, email) {
    this.id = id;
    this.username = username;
    this.passwordHash = passwordHash;
    this.email = email;
    this.documents = [];
  }

  static findByUsername(username) {
    return users.find(user => user.username === username);
  }

  static findById(id) {
    return users.find(user => user.id === id);
  }

  static create(username, passwordHash, email) {
    const id = Date.now().toString();
    const user = new User(id, username, passwordHash, email);
    users.push(user);
    return user;
  }
}

module.exports = User;
