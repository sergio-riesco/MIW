

class InputError extends Error {
    constructor(field, msg) {
      super(msg);
      this.msg = msg; 
      this.field = field;
      this.code = 400;
    }
  }

module.exports = InputError;