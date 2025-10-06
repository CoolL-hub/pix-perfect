import { create } from "zustand";
import { Cursor } from "./types";


interface State {
    cursor: Cursor;
}
export const appStore = create<{ initialState: State }>(() => ({
    initialState: {
        cursor: "default"
    }
}));