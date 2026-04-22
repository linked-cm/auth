"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageName = exports.packageExports = exports.getPackageShape = exports.registerPackageModule = exports.registerPackageExport = exports.linkedOntology = exports.linkedUtil = exports.linkedShape = exports.linkedComponent = void 0;
var Package_1 = require("@_linked/core/utils/Package");
var LinkedComponent_1 = require("@_linked/react/utils/LinkedComponent");
var _a = (0, Package_1.linkedPackage)('@_linked/auth'), linkedShape = _a.linkedShape, linkedUtil = _a.linkedUtil, linkedOntology = _a.linkedOntology, registerPackageExport = _a.registerPackageExport, registerPackageModule = _a.registerPackageModule, getPackageShape = _a.getPackageShape, packageExports = _a.packageExports, packageName = _a.packageName;
exports.linkedShape = linkedShape;
exports.linkedUtil = linkedUtil;
exports.linkedOntology = linkedOntology;
exports.registerPackageExport = registerPackageExport;
exports.registerPackageModule = registerPackageModule;
exports.getPackageShape = getPackageShape;
exports.packageExports = packageExports;
exports.packageName = packageName;
var linkedComponent = (0, LinkedComponent_1.createLinkedComponentFn)(registerPackageExport, function () { });
exports.linkedComponent = linkedComponent;
//# sourceMappingURL=package.js.map