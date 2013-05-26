
var assert = require("assert");

describe("Array", function() {
	describe("#indexOf()", function() {
		it("Should return -1 when the value is not found", function() {
			assert.equal(-1, [1, 2, 3].indexOf(5));
			assert.equal(-1, [1, 2, 3].indexOf(0));
		});
	});
});

