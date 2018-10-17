export default class TryACL {
    static login(user: string, pwd: string): Promise<{
        code: number;
        msg: string;
        data: {};
    }>;
    static logout(): Promise<{
        code: number;
        msg: string;
        dtaa: {};
    }>;
    static refreshToken(): Promise<{
        code: number;
        msg: string;
        data: {};
    }>;
    static getData01(userID: string): Promise<{
        code: number;
        msg: string;
        data: {
            msg: string;
        };
    }>;
    static getData02(userID: string, tempData: string): Promise<{
        code: number;
        msg: string;
        data: {
            msg: string;
        };
    }>;
}
