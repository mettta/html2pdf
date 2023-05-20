import logMe from "./../../src/testable-example.js";

var assert = chai.assert;

var style = document.createElement('style');
style.innerHTML = `
  .main-stage {
    margin: 0 auto;
    height: 10000px;
    background-color: #fafafa;
  }
`;
document.body.appendChild(style);

var rootContainer;
beforeEach(() => {
  if (rootContainer) {
    rootContainer.parentNode.removeChild(rootContainer);
  }

  rootContainer = document.createElement("div");
  rootContainer.innerHTML = 'This is a Stage for testing Paginate';
  document.body.appendChild(rootContainer);
  rootContainer.classList.add('main-stage');
});

describe('Example Test Group', function() {
  describe('Example Test Subgroup', function() {
    it('should pass', function() {
      ///printTHIS(rootContainer);
      assert(logMe());
    });
  });
});
