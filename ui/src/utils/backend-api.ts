import axios from 'axios';
import {config} from "./constants";
import {getCurrentUser} from "./sessionstorage-client";

export const X_EMAIL_HEADER = "X-Email-ID";

export const sanitizeString = (input: string) => {
    return input.split(" ").join("_");
};

export const K8sOperationsBackendApi = () => {
    const path = "/k8s";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    });
};

export const GitPlatformBackendApi = () => {
    const path = "/";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    });
};

export const CodeOperationsBackendApi = () => {
    const path = "/code";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    },);
};

export const OpenApiYamlOperationsBackendApi = () => {
    const path = "/openapi";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    },);
};

export const ProjectsBackendApi = () => {
    const path = "/";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    },);
};

export const UserBackendApi = () => {
    const path = "/users";
    return axios.create({
        baseURL: config.backend_base_url + path,
        headers: getHeaders()
    },);
};

const getHeaders = () => {
    return {
        post: {
            [X_EMAIL_HEADER]: getCurrentUser()
        },
        get: {
            [X_EMAIL_HEADER]: getCurrentUser()
        },
        put: {
            [X_EMAIL_HEADER]: getCurrentUser()
        }
    };
};