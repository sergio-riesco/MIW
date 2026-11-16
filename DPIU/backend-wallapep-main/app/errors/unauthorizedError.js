

class UnauthorizedError extends Error {
    constructor(msg) {
      super(msg);
      this.msg = msg; 
      this.code = 401;
    }
  }

module.exports = UnauthorizedError;