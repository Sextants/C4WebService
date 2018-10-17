export default class Hello {
    static hello(): string;
    static world(): Promise<{
        code: number;
        msg: string;
        data: {
            text: string;
        };
    }>;
}
