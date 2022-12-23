import React, {useState} from "react";
import {Navigate} from "react-router-dom";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import {Alert, Snackbar, Stack} from "@mui/material";
import {setCurrentRepositoryDetails} from "../../utils/service";
import {commitCompageYaml, createRepository, listRepositories, pullCompageYaml} from "../../backend/rest-service";
import {GithubRepository, GithubRepositoryContent} from "../../backend/models";
import {useAppSelector} from "../../hooks/redux-hooks";

export const Sample = () => {
    const authentication = useAppSelector(state => state.authentication);

    const [operationState, setOperationState] = useState({
        severity: "",
        message: "",
        operation: "",
        isOpen: false
    })
    if (!authentication.user.login) {
        return <Navigate to="/login"/>;
    }

    function handleClose() {
        setOperationState({...operationState, isOpen: false, message: "", severity: "", operation: ""})
    }

    const isRepositoryNameExists = (newRepositoryName: string, githubRepositories: GithubRepository[]) => {
        for (const githubRepository of githubRepositories) {
            if (newRepositoryName === githubRepository.name) {
                return true
            }
        }
        return false
    }

    const handleResponse = (repositoryName: string, githubRepositoryContent: GithubRepositoryContent) => {
        const currentRepositoryDetails = {
            repositoryName: repositoryName,
            details: githubRepositoryContent
        }
        setCurrentRepositoryDetails(JSON.stringify(currentRepositoryDetails))
    }

    return (
        <React.Fragment>
            <Container>
                <Stack spacing={3} style={{padding: "10px"}}>
                    <Snackbar open={operationState.isOpen} autoHideDuration={6000} onClose={handleClose}>
                        <Alert onClose={handleClose}
                               severity={operationState.severity === "success" ? "success" : operationState.severity === "error" ? "error" : operationState.severity === "info" ? "info" : "warning"}
                               sx={{width: '100%'}}>
                            {operationState.severity}
                            {operationState.message}
                        </Alert>
                    </Snackbar>
                    <Button variant="contained" onClick={
                        () => {
                            listRepositories(authentication.user.login)
                                .then((response: Response) => {
                                    if (!response.ok) {
                                        setOperationState({
                                            ...operationState,
                                            message: " : Received Non-200 response : " + response.status,
                                            severity: 'error',
                                            operation: "listRepos",
                                            isOpen: true
                                        })
                                    } else return response.json();
                                })
                                .then(data => {
                                    if (data) {
                                        if (JSON.stringify(data).toLowerCase().includes("Bad Credentials".toLowerCase())) {
                                            setOperationState({
                                                ...operationState,
                                                message: " : Received response : " + data,
                                                severity: 'error',
                                                operation: "listRepos",
                                                isOpen: true
                                            })
                                        } else {
                                            const newRepositoryName = "Sample1";
                                            if (!isRepositoryNameExists(newRepositoryName, data)) {
                                                // check for repo existence
                                                createRepository(authentication.user.login, newRepositoryName, "Sample repo description")
                                                    .then((response: Response) => {
                                                        if (!response.ok) {
                                                            setOperationState({
                                                                ...operationState,
                                                                message: " : Received Non-200 response : " + response.status,
                                                                severity: 'error',
                                                                operation: "createRepo",
                                                                isOpen: true
                                                            })
                                                        } else return response.json();
                                                    })
                                                    .then(data => {
                                                        if (data) {
                                                            if (JSON.stringify(data).toLowerCase().includes("Bad Credentials".toLowerCase())) {
                                                                setOperationState({
                                                                    ...operationState,
                                                                    message: " : Received response : " + data,
                                                                    severity: 'error',
                                                                    operation: "createRepo",
                                                                    isOpen: true
                                                                })
                                                            } else {
                                                                setOperationState({
                                                                    ...operationState,
                                                                    message: " : Received response : " + data,
                                                                    severity: 'success',
                                                                    operation: "createRepo",
                                                                    isOpen: true
                                                                })
                                                                setCurrentRepositoryDetails(newRepositoryName)
                                                            }
                                                        }
                                                    })
                                                    .catch(error => {
                                                        setOperationState({
                                                            ...operationState,
                                                            message: " : Received error : " + error,
                                                            severity: 'error',
                                                            operation: "createRepo",
                                                            isOpen: true
                                                        })
                                                    });
                                            } else {
                                                setOperationState({
                                                    ...operationState,
                                                    message: " : Repo [" + newRepositoryName + "] name exists! - Please choose different name for the repo.",
                                                    severity: 'error',
                                                    operation: "createRepo",
                                                    isOpen: true
                                                })
                                            }
                                        }
                                    }
                                })
                                .catch(error => {
                                    setOperationState({
                                        ...operationState,
                                        message: " : Received error : " + error,
                                        severity: 'error',
                                        operation: "listRepos",
                                        isOpen: true
                                    })
                                });
                        }
                    }>
                        Create a Repo
                    </Button>
                    <Button variant="contained" onClick={
                        () => {
                            commitCompageYaml(authentication.user.login, authentication.user.email, "Sample message")
                                .then((response: Response) => {
                                    if (!response.ok) {
                                        setOperationState({
                                            ...operationState,
                                            message: " : Received Non-200 response : " + JSON.stringify(response),
                                            severity: 'error',
                                            operation: "commitChanges",
                                            isOpen: true
                                        })
                                    } else return response.json();
                                })
                                .then(data => {
                                    if (data) {
                                        if (JSON.stringify(data).toLowerCase().includes("Bad Credentials".toLowerCase())) {
                                            setOperationState({
                                                ...operationState,
                                                message: " : Received response : " + data,
                                                severity: 'error',
                                                operation: "commitChanges",
                                                isOpen: true
                                            })
                                        } else {
                                            setOperationState({
                                                ...operationState,
                                                message: " : Received response : " + data,
                                                severity: 'success',
                                                operation: "commitChanges",
                                                isOpen: true
                                            })
                                        }
                                    }
                                })
                                .catch(error => {
                                    setOperationState({
                                        ...operationState,
                                        message: " : Received error : " + error,
                                        severity: 'error',
                                        operation: "commitChanges",
                                        isOpen: true
                                    })
                                });
                        }
                    }>
                        Commit changes
                    </Button>
                    <Button variant="contained" onClick={
                        () => {
                            const repositoryName = "Sample1"
                            pullCompageYaml(authentication.user.login, repositoryName)
                                .then((response: Response) => {
                                    if (!response.ok) {
                                        setOperationState({
                                            ...operationState,
                                            message: " : Received Non-200 response : " + response.status,
                                            severity: 'error',
                                            operation: "pullChanges",
                                            isOpen: true
                                        })
                                    } else return response.json();
                                })
                                .then(data => {
                                    if (data) {
                                        if (JSON.stringify(data).toLowerCase().includes("Bad Credentials".toLowerCase())) {
                                            setOperationState({
                                                ...operationState,
                                                message: " : Received response : " + data,
                                                severity: 'error',
                                                operation: "pullChanges",
                                                isOpen: true
                                            })
                                        } else {
                                            setOperationState({
                                                ...operationState,
                                                message: " : Received response : " + JSON.stringify(data),
                                                severity: 'success',
                                                operation: "pullChanges",
                                                isOpen: true
                                            })
                                            handleResponse(repositoryName, data)
                                        }
                                    }
                                })
                                .catch(error => {
                                    setOperationState({
                                        ...operationState,
                                        message: " : Received error : " + error,
                                        severity: 'error',
                                        operation: "commitChanges",
                                        isOpen: true
                                    })
                                });
                        }
                    }>
                        Pull changes
                    </Button>
                </Stack>
            </Container>
        </React.Fragment>
    );
}