/**
 * Create a per-module debug checker.
 * Usage: In the module file, define: `const _isDebug = debugFor('moduleName')`
 * Then call `_isDebug(this)` inside any function of that module.
 *
 * @param {string} moduleName - The name of the debug group, as defined in `node._debug`.
 * The name must match the keys used in `debugConfig.node`.
 *
 * @returns {(node: Node) => boolean} A function that checks whether debug mode is enabled for the given group.
 *
 * Returned function:
 * @param {Node} node - The Node instance, passed as `this`.
 */
export function debugFor(moduleName) {
    return function (node) {
        return node._config.debugMode && node._debug[moduleName];
    };
}
