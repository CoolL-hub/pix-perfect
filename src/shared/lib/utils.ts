import { HexColor } from "./types";

export const clsx = (styles: string[] | null): string => {
    if( styles ) {
        return styles.join(" ");
    }

    return "";
}

export const isHexColor = (color: HexColor): boolean => {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}