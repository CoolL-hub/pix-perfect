export const clsx = (styles: string[] | null): string => {
    if( styles ) {
        return styles.join(" ");
    }

    return "";
}