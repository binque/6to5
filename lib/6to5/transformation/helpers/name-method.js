"use strict";

var util = require("../../util");
var t    = require("../../types");

var visitor = {
  enter: function (node, parent, scope, state) {
    // check if this node is an identifier that matches the same as our function id
    if (!t.isIdentifier(node, { name: state.id })) return;

    // check if this node is the one referenced
    if (!t.isReferenced(node, parent)) return;

    // check that we don't have a local variable declared as that removes the need
    // for the wrapper
    var localDeclar = scope.getBinding(state.id);
    if (localDeclar !== state.outerDeclar) return;

    state.selfReference = true;
    this.stop();
  }
};

exports.property = function (node, file, scope) {
  var key = t.toComputedKey(node, node.key);
  if (!t.isLiteral(key)) return node; // we can't set a function id with this

  var id = t.toIdentifier(key.value);
  key = t.identifier(id);

  var state = {
    id: id,
    selfReference: false,
    outerDeclar: scope.getBinding(id),
  };

  scope.traverse(node, visitor, state);

  if (state.selfReference) {
    // todo: support generators
    node.value = util.template("property-method-assignment-wrapper", {
      FUNCTION: node.value,
      FUNCTION_ID: key,
      FUNCTION_KEY: scope.generateUidIdentifier(id),
      WRAPPER_KEY: scope.generateUidIdentifier(id + "Wrapper")
    });
  } else {
    node.value.id = key;
  }
};
