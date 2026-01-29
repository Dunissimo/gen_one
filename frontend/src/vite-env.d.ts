/// <reference types="vite/client" />
interface Window {
    ethereum?: Eip1193Provider & {
        on?: (event: string, listener: (...args: any[]) => void) => void;
        removeListener?: (event: string, listener: (...args: any[]) => void) => void;
    };
}