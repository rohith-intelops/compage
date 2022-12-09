import {getProjectGrpcClient} from "../grpc/project";
import {Router} from "express";
import * as fs from "fs";
import * as os from "os";
import {pushToExistingProjectOnGithub, PushToExistingProjectOnGithubRequest} from "../util/simple-git/existing-project";
import {getUser} from "../util/store";
import {cloneExistingProjectFromGithub, CloneExistingProjectFromGithubRequest} from "../util/simple-git/clone";
import {CreateProjectRequest, CreateProjectResponse, Project} from "./models";
import {requireUserNameMiddleware} from "../middlewares/auth";

const rimraf = require("rimraf");
const tar = require('tar')
const compageRouter = Router();
const projectGrpcClient = getProjectGrpcClient();

const getCreateProjectResponse = (createProjectRequest: CreateProjectRequest, message: string, error: string) => {
    let createProjectResponse: CreateProjectResponse = {
        repositoryName: createProjectRequest.repository.name,
        userName: createProjectRequest.userName,
        projectName: createProjectRequest.projectName,
        message: message,
        error: error
    }
    return createProjectResponse;
}

// createProject (grpc calls to core)
compageRouter.post("/create_project", requireUserNameMiddleware, async (req, res) => {
    const createProjectRequest: CreateProjectRequest = req.body;
    const cleanup = (downloadedProjectPath: string) => {
        // remove directory created, delete directory recursively
        rimraf(downloadedProjectPath, () => {
            console.debug(`${downloadedProjectPath} is cleaned up`);
        });
    }

    // create directory hierarchy here itself as creating it after receiving data will not be proper.
    const originalProjectPath = `${os.tmpdir()}/${createProjectRequest.projectName}`
    const downloadedProjectPath = `${originalProjectPath}_downloaded`
    try {
        fs.mkdirSync(downloadedProjectPath, {recursive: true});
    } catch (err: any) {
        if (err.code !== 'EEXIST') {
            let message = `unable to create project : ${createProjectRequest.projectName}`
            let error = `unable to create project : ${createProjectRequest.projectName} directory with error : ${err}`
            return res.status(500).json(getCreateProjectResponse(createProjectRequest, message, error));
        } else {
            // first clean up and then recreate (it might be a residue of previous run)
            cleanup(downloadedProjectPath)
            fs.mkdirSync(downloadedProjectPath, {recursive: true});
        }
    }
    const projectTarFilePath = `${downloadedProjectPath}/${createProjectRequest.projectName}_downloaded.tar.gz`;

    // save project metadata (in compage db or somewhere)
    // need to save project-name, compage-yaml version, github repo and latest commit to the db
    const payload: Project = {
        projectName: createProjectRequest.projectName,
        userName: createProjectRequest.userName,
        yaml: JSON.stringify(createProjectRequest.yaml),
        repositoryName: createProjectRequest.repository.name,
        metadata: JSON.stringify(createProjectRequest.metadata)
    }

    //save to redis
    const getKey = (userName: string | undefined, projectName: string | undefined) => {
        return userName + "$" + projectName;
    }

    // call to grpc server to generate the project
    let call = projectGrpcClient.CreateProject(payload);
    // receive the data(tar file) in chunks.
    call.on('data', async (response: { fileChunk: any }) => {
        // chunk is available, append it to the given path.
        if (response.fileChunk) {
            fs.appendFileSync(projectTarFilePath, response.fileChunk);
            console.debug(`writing tar file chunk to: ${projectTarFilePath}`);
        }
    });

    // error while receiving the file from core component
    call.on('error', async (response: any) => {
        let message = `unable to create project : ${createProjectRequest.projectName}`
        let error = response.details
        return res.status(500).json(getCreateProjectResponse(createProjectRequest, message, error));
    });

    // file has been transferred, lets save it to github.
    call.on('end', () => {
        // extract tar file
        const extract = tar.extract({
            strip: 1,
            C: downloadedProjectPath
        });
        // stream on extraction on tar file
        let fscrs = fs.createReadStream(projectTarFilePath)
        fscrs.on('error', function (err: any) {
            console.log(JSON.stringify(err))
        });
        fscrs.pipe(extract)

        extract.on('finish', async () => {
            let password = <string>await getUser(<string>createProjectRequest.userName);
            // clone existing repository
            const cloneExistingProjectFromGithubRequest: CloneExistingProjectFromGithubRequest = {
                clonedProjectPath: `${downloadedProjectPath}`,
                userName: <string>createProjectRequest.userName,
                password: password,
                repository: createProjectRequest.repository
            }

            await cloneExistingProjectFromGithub(cloneExistingProjectFromGithubRequest)

            // save to GitHub
            const pushToExistingProjectOnGithubRequest: PushToExistingProjectOnGithubRequest = {
                createdProjectPath: `${downloadedProjectPath}` + `${originalProjectPath}`,
                existingProject: cloneExistingProjectFromGithubRequest.clonedProjectPath + "/" + createProjectRequest.repository.name,
                userName: <string>createProjectRequest.userName,
                email: createProjectRequest.email,
                password: password,
                repository: createProjectRequest.repository
            }

            await pushToExistingProjectOnGithub(pushToExistingProjectOnGithubRequest)
            console.log(`saved ${downloadedProjectPath} to github`)
            cleanup(downloadedProjectPath);

            // send status back to ui
            let message = `created project: ${createProjectRequest.projectName} and saved in repository : ${createProjectRequest.repository.name} successfully`
            let error = ""
            return res.status(200).json(getCreateProjectResponse(createProjectRequest, message, error));
        });
    });
});

// updateProject (grpc calls to core)
compageRouter.post("/update_project", requireUserNameMiddleware, async (req, res) => {
    const {repositoryName, yaml, projectName, userName} = req.body;
    try {
        const payload = {
            "projectName": projectName,
            "userName": userName,
            "yaml": yaml,
            "repositoryName": repositoryName
        }
        projectGrpcClient.UpdateProject(payload, (err: any, response: { fileChunk: any; }) => {
            if (err) {
                return res.status(500).json(err);
            }
            return res.status(200).json({fileChunk: response.fileChunk.toString()});
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

export default compageRouter;
