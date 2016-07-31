export class ErrorHelper {
    public static getErrorString(errorCode: number): string {
        switch (errorCode) {
            case OK:
                return "OK (" + errorCode + ")";
            case ERR_NOT_OWNER:
                return "ERR_NOT_OWNER (" + errorCode + ")";
            case ERR_NO_PATH:
                return "ERR_NO_PATH (" + errorCode + ")";
            case ERR_NAME_EXISTS:
                return "ERR_NAME_EXISTS (" + errorCode + ")";
            case ERR_BUSY:
                return "ERR_BUSY (" + errorCode + ")";
            case ERR_NOT_FOUND:
                return "ERR_NOT_FOUND (" + errorCode + ")";
            case ERR_NOT_ENOUGH_ENERGY:
                return "ERR_NOT_ENOUGH_ENERGY (" + errorCode + ")";
            case ERR_NOT_ENOUGH_RESOURCES:
                return "ERR_NOT_ENOUGH_RESOURCES (" + errorCode + ")";
            case ERR_NOT_ENOUGH_EXTENSIONS:
                return "ERR_NOT_ENOUGH_EXTENSIONS (" + errorCode + ")";
            case ERR_INVALID_TARGET:
                return "ERR_INVALID_TARGET (" + errorCode + ")";
            case ERR_FULL:
                return "ERR_FULL (" + errorCode + ")";
            case ERR_NOT_IN_RANGE:
                return "ERR_NOT_IN_RANGE (" + errorCode + ")";
            case ERR_INVALID_ARGS:
                return "ERR_INVALID_ARGS (" + errorCode + ")";
            case ERR_TIRED:
                return "ERR_TIRED (" + errorCode + ")";
            case ERR_NO_BODYPART:
                return "ERR_NO_BODYPART (" + errorCode + ")";
            case ERR_RCL_NOT_ENOUGH:
                return "ERR_RCL_NOT_ENOUGH (" + errorCode + ")";
            case ERR_GCL_NOT_ENOUGH:
                return "ERR_GCL_NOT_ENOUGH (" + errorCode + ")";
            default:
                return errorCode.toString();
        }
    }
}