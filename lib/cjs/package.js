"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageName = exports.packageExports = exports.getPackageShape = exports.registerPackageModule = exports.registerPackageExport = exports.linkedOntology = exports.linkedUtil = exports.linkedShape = exports.linkedComponent = void 0;
const Package_1 = require("@_linked/core/utils/Package");
const LinkedComponent_1 = require("@_linked/react/utils/LinkedComponent");
const { linkedShape, linkedUtil, linkedOntology, registerPackageExport, registerPackageModule, getPackageShape, packageExports, packageName, } = (0, Package_1.linkedPackage)('@_linked/auth');
exports.linkedShape = linkedShape;
exports.linkedUtil = linkedUtil;
exports.linkedOntology = linkedOntology;
exports.registerPackageExport = registerPackageExport;
exports.registerPackageModule = registerPackageModule;
exports.getPackageShape = getPackageShape;
exports.packageExports = packageExports;
exports.packageName = packageName;
const linkedComponent = (0, LinkedComponent_1.createLinkedComponentFn)(registerPackageExport, () => { });
exports.linkedComponent = linkedComponent;
//# sourceMappingURL=package.js.map