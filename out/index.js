"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const C4WebService_1 = __importDefault(require("./C4WebService"));
exports.C4WebService = C4WebService_1.default;
const Controller = __importStar(require("./Annotation/Controller"));
exports.Controller = Controller;
const ControllerUtils_1 = require("./Annotation/ControllerUtils");
exports.getControllers = ControllerUtils_1.getControllers;
exports.defineControllers = ControllerUtils_1.defineControllers;
//# sourceMappingURL=index.js.map