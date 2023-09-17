export const CURRENT_USER = "CURRENT_USER";

export const getCurrentUser = () => {
    return sessionStorage.getItem(CURRENT_USER);
};

export const setCurrentUser = (userName: string) => {
    sessionStorage.setItem(CURRENT_USER, userName);
};