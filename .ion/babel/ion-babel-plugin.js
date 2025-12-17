/**
 * Ion Babel Plugin
 * Adds data-ion-id and data-ion-caller-id attributes to JSX elements
 * for source location tracking in the Ion element selection system.
 */

const ATTRIBUTE_NAME = 'data-ion-id';
const CALLER_ATTRIBUTE_NAME = 'data-ion-caller-id';

function encodeNodeInfo(nodeInfo) {
  return Buffer.from(JSON.stringify(nodeInfo)).toString('base64');
}

module.exports = function ionBabelPlugin({ types: t }) {
  let currentFilePath = '';
  let currentComponentName = null;
  const componentStack = [];

  function isReactFragment(node) {
    if (!node) return false;

    // Check for <Fragment>
    if (t.isJSXIdentifier(node.name)) {
      return node.name.name === 'Fragment';
    }

    // Check for <React.Fragment>
    if (t.isJSXMemberExpression(node.name)) {
      const { object, property } = node.name;
      return (
        t.isJSXIdentifier(object) &&
        object.name === 'React' &&
        t.isJSXIdentifier(property) &&
        property.name === 'Fragment'
      );
    }

    return false;
  }

  function hasAttribute(node, attributeName) {
    if (!node.attributes) return false;
    return node.attributes.some(
      (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === attributeName
    );
  }

  function createNodeInfo(path) {
    const node = path.node;

    if (!node.loc) return null;

    const nodeInfo = {
      path: currentFilePath,
      startTag: {
        start: {
          line: node.loc.start.line,
          column: node.loc.start.column,
        },
        end: {
          line: node.loc.end.line,
          column: node.loc.end.column,
        },
      },
    };

    // Add component name if we're inside a component
    if (currentComponentName) {
      nodeInfo.component = currentComponentName;
    }

    return nodeInfo;
  }

  function addIonAttribute(path, nodeInfo) {
    const openingElement = path.node.openingElement;

    // Skip if already has the attribute
    if (hasAttribute(openingElement, ATTRIBUTE_NAME)) {
      return;
    }

    // Skip fragments
    if (isReactFragment(openingElement)) {
      return;
    }

    // Create the data-ion-id attribute with encoded node info
    const encodedInfo = encodeNodeInfo(nodeInfo);
    const ionAttribute = t.jsxAttribute(t.jsxIdentifier(ATTRIBUTE_NAME), t.stringLiteral(encodedInfo));

    openingElement.attributes.push(ionAttribute);

    // Add caller attribute if we're inside a component and there's a parent component
    if (componentStack.length > 0) {
      const callerInfo = {
        caller: componentStack[componentStack.length - 1],
        depth: componentStack.length,
      };
      const callerAttribute = t.jsxAttribute(
        t.jsxIdentifier(CALLER_ATTRIBUTE_NAME),
        t.stringLiteral(Buffer.from(JSON.stringify(callerInfo)).toString('base64'))
      );
      openingElement.attributes.push(callerAttribute);
    }
  }

  return {
    name: 'ion-babel-plugin',
    visitor: {
      Program: {
        enter(path, state) {
          currentFilePath = state.filename || 'unknown';
          currentComponentName = null;
          componentStack.length = 0;
        },
        exit() {
          currentFilePath = '';
          currentComponentName = null;
          componentStack.length = 0;
        },
      },

      // Track function components
      FunctionDeclaration: {
        enter(path) {
          const name = path.node.id?.name;
          if (name && /^[A-Z]/.test(name)) {
            currentComponentName = name;
            componentStack.push(name);
          }
        },
        exit(path) {
          const name = path.node.id?.name;
          if (name && /^[A-Z]/.test(name)) {
            componentStack.pop();
            currentComponentName = componentStack[componentStack.length - 1] || null;
          }
        },
      },

      // Track arrow function components
      VariableDeclarator: {
        enter(path) {
          const name = path.node.id?.name;
          if (
            name &&
            /^[A-Z]/.test(name) &&
            (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
          ) {
            currentComponentName = name;
            componentStack.push(name);
          }
        },
        exit(path) {
          const name = path.node.id?.name;
          if (
            name &&
            /^[A-Z]/.test(name) &&
            (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
          ) {
            componentStack.pop();
            currentComponentName = componentStack[componentStack.length - 1] || null;
          }
        },
      },

      JSXElement(path) {
        const nodeInfo = createNodeInfo(path);
        if (nodeInfo) {
          addIonAttribute(path, nodeInfo);
        }
      },
    },
  };
};
